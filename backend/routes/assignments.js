import express from 'express';
import prisma from "../src/client.js";

import { io } from '../src/index.js';

const router = express.Router();


const updateVolunteerStatus = async (volunteerId, newStatus) => {
  try {
    await prisma.user.update({
      where: { id: volunteerId },
      data: { status: newStatus }
    });
  } catch (e) {
    console.error(`[DB ERROR] Failed to update volunteer ${volunteerId} → ${newStatus}:`, e);
  }
};


router.post('/admin-assign', async (req, res) => {
  const { requestId, volunteerId } = req.body;
  const reqIdStr = String(requestId);

  try {

    const prevAssignments = await prisma.assignment.findMany({
      where: { requestId },
      select: { volunteerId: true }
    });

    const prevVolIds = [...new Set(prevAssignments.map(a => a.volunteerId))];

    for (const vid of prevVolIds) {
      await updateVolunteerStatus(vid, 'Available');
    }

    
    await prisma.assignment.updateMany({
      where: { requestId },
      data: { isAccepted: false }
    });

    await prisma.assignment.create({
      data: {
        requestId,
        volunteerId,
        isAccepted: false,
        declineCount: 0
      }
    });

    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'Assigned' }
    });


    await updateVolunteerStatus(volunteerId, 'Busy');


    io.to(reqIdStr).emit('system_notification', {
      status: 'Assigned',
      text: 'A volunteer has been assigned by a coordinator.',
      requestId
    });

    res.status(200).json({ message: "Assigned successfully." });
  } catch (error) {
    console.error("Admin Assign Error:", error);
    res.status(500).json({ message: "Failed to assign volunteer." });
  }
});


router.get('/my-active-task/:volunteerId', async (req, res) => {
  const volunteerId = parseInt(req.params.volunteerId);

  try {
    const activeAssignment = await prisma.request.findFirst({
      where: {
        status: { in: ['Assigned', 'Conflict', 'Atmost'] },
        assignments: {
          some: {
            volunteerId: volunteerId,
            isAccepted: true
          }
        }
      },
      select: {
        id: true,
        emergencyType: true,
        location: true,
        urgencyScore: true,
        details: true,
        status: true
      }
    });


    res.json({ activeRequest: activeAssignment });

  } catch (error) {
    console.error("Fetch Active Assignment Error:", error);
    res.status(500).json({ message: "Failed to fetch active assignment." });
  }
});


router.post('/accept-request', async (req, res) => {
  const { requestId, volunteerId } = req.body;
  const reqIdStr = String(requestId);

  try {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    const volunteer = await prisma.user.findUnique({ where: { id: volunteerId } });

    if (!request || !volunteer) {
      return res.status(404).json({ message: "Request or volunteer not found." });
    }

    if (request.emergencyType.toLowerCase() === "medical") {
      if (!volunteer.isMedicalVerified) {
        return res.status(403).json({
          message: "Only medically verified volunteers can accept medical requests."
        });
      }
    }

   
    const assignment = await prisma.assignment.findFirst({
      where: { requestId, volunteerId },
      orderBy: { id: 'desc' }
    });

    if (assignment) {
      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { isAccepted: true }
      });
    } else {
      await prisma.assignment.create({
        data: { requestId, volunteerId, isAccepted: true }
      });
    }
    await prisma.request.update({
      where: { id: requestId },
      data: { status: "Assigned" }
    });

    await updateVolunteerStatus(volunteerId, 'Busy');

    io.to(reqIdStr).emit('system_notification', {
      status: 'Assigned',
      text: "Volunteer accepted the task!",
      requestId
    });

    res.json({ message: "Task accepted successfully." });
  } catch (err) {
    console.error("Accept request error:", err);
    res.status(500).json({ message: "Failed to accept task." });
  }
});


router.put('/decline/:id', async (req, res) => {
  const requestId = parseInt(req.params.id);
  const { volunteerId: rawVolunteerId } = req.body;

  const volunteerId = parseInt(rawVolunteerId);
  const reqIdStr = String(requestId);

  if (isNaN(requestId) || isNaN(volunteerId)) {
    return res.status(400).json({ message: "Invalid Request ID or Volunteer ID provided." });
  }

  try {
    let assignment = await prisma.assignment.findFirst({
      where: { requestId, volunteerId },
      orderBy: { id: 'desc' }
    });

    if (assignment) {
    
      assignment = await prisma.assignment.update({
        where: { id: assignment.id },
        data: { declineCount: assignment.declineCount + 1, isAccepted: false }
      });
    } else {
     
      assignment = await prisma.assignment.create({
        data: { requestId, volunteerId, declineCount: 1, isAccepted: false }
      });
    }

    
    await updateVolunteerStatus(volunteerId, 'Available');

    const declineRecords = await prisma.assignment.findMany({
      where: { requestId, declineCount: { gte: 1 } },
      select: { volunteerId: true }
    });

    const uniqueDecliners = new Set(declineRecords.map(d => d.volunteerId));

   
    if (uniqueDecliners.size >= 3) {
      await prisma.request.update({
        where: { id: requestId },
        data: { status: 'Reassign' }
      });

      io.to('admin_room').emit('system_notification', {
        status: 'Reassign',
        text: `⚠️ Request #${requestId} declined by 3 volunteers. Action required.`,
        requestId
      });

      return res.json({
        message: "Moved to Reassign. Admin must assign a new volunteer.",
        needsAdminAssign: true
      });
    }

    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'Pending' }
    });

    io.to(reqIdStr).emit('system_notification', {
      status: 'Pending',
      text: `Volunteer declined. Request returned to queue.`,
      requestId
    });

    res.json({ message: "Decline recorded, returned to queue." });

  } catch (err) {

    console.error("Decline error:", err);
    res.status(500).json({ message: "Failed to record decline." });
  }
});



router.get('/available-tasks/:volunteerId', async (req, res) => {
  const volunteerId = parseInt(req.params.volunteerId);

  try {
    const volunteer = await prisma.user.findUnique({
      where: { id: volunteerId },
      select: { fullName: true, isMedicalVerified: true, skills: true }
    });

    if (!volunteer) {
      return res.status(404).json({ message: "Volunteer not found." });
    }

    const isMedical = volunteer.isMedicalVerified || (volunteer.skills || "").toLowerCase().includes("medical");

    const requests = await prisma.request.findMany({
      where: {
        status: { in: ['Pending', 'Assigned', 'Conflict'] },

        // 🔥 FIX 2: Add a NOT filter to exclude tasks that THIS volunteer has declined
        NOT: {
          assignments: {
            some: {
              volunteerId: volunteerId,
              declineCount: { gt: 0 } // Exclude if this volunteer has any recorded decline count
            }
          }
        },

        // Keep existing logic for tasks the volunteer is assigned to or in conflict with
        OR: [
          { status: 'Pending' },
          { status: 'Assigned', assignments: { some: { volunteerId } } },
          { status: 'Conflict', assignments: { some: { volunteerId } } }
        ]
      },
      include: {
        assignments: {
          orderBy: { id: 'desc' },
          take: 1,
          include: { volunteer: { select: { fullName: true } } }
        }
      },
      orderBy: { urgencyScore: 'desc' }
    });

    const filtered = requests.filter(r => {
      // Only filter out medical requests if the volunteer is NOT medically verified
      if ((r.emergencyType || '').toLowerCase() === "medical" && !isMedical) return false;
      return true;
    });

    res.json({ requests: filtered });

  } catch (err) {
    console.error("Fetch tasks error:", err);
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
});


router.put('/resolve/:id/admin', async (req, res) => {
  const requestId = parseInt(req.params.id);

  try {

    const currentAssignment = await prisma.assignment.findFirst({
      where: { requestId, isAccepted: true },
      orderBy: { id: 'desc' },
      select: { volunteerId: true }
    });

    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'Completed' }
    });

    if (currentAssignment?.volunteerId) {
      await updateVolunteerStatus(currentAssignment.volunteerId, 'Available');
    }

    io.to(String(requestId)).emit('system_notification', {
      status: 'COMPLETED',
      text: "✅ Request closed by Administrator.",
      requestId
    });

    res.json({ message: "Request completed by admin." });

  } catch (error) {
    console.error("Admin Complete Error:", error);
    res.status(500).json({ message: "Failed to complete request." });
  }
});


export default router;