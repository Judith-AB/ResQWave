// --- backend/routes/assignments.js ---
import express from 'express';
import prisma from '../src/client.js';
import { io } from '../src/index.js';

const router = express.Router();

/* ----------------------------------------
   Helper: Update volunteer status
----------------------------------------- */
const updateVolunteerStatus = async (volunteerId, newStatus) => {
  try {
    await prisma.user.update({
      where: { id: volunteerId },
      data: { status: newStatus }
    });
  } catch (e) {
    console.error(`Failed to update volunteer ${volunteerId} → ${newStatus}`, e);
  }
};


/* ----------------------------------------
   ADMIN ASSIGN (Create new assignment)
----------------------------------------- */
router.post('/admin-assign', async (req, res) => {
  const { requestId, volunteerId } = req.body;
  const reqIdStr = String(requestId);

  try {
    // 0. Free previous volunteers
    const prevAssignments = await prisma.assignment.findMany({
      where: { requestId },
      select: { volunteerId: true }
    });

    const prevVolIds = [...new Set(prevAssignments.map(a => a.volunteerId))];

    for (const vid of prevVolIds) {
      await updateVolunteerStatus(vid, 'Available');
    }

    // 1. Reset previous assignment acceptance
    await prisma.assignment.updateMany({
      where: { requestId },
      data: { isAccepted: false }
    });

    // 2. Create new assignment record
    await prisma.assignment.create({
      data: {
        requestId,
        volunteerId,
        isAccepted: false,
        declineCount: 0
      }
    });

    // 3. Mark request as assigned
    await prisma.request.update({
      where: { id: requestId },
      data: { status: 'Assigned' }
    });

    // 4. Mark volunteer as busy
    await updateVolunteerStatus(volunteerId, 'Busy');

    // 5. Send socket update
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


/* ----------------------------------------
   VOLUNTEER ACCEPT REQUEST
----------------------------------------- */
router.post('/accept-request', async (req, res) => {
  const { requestId, volunteerId } = req.body;
  const reqIdStr = String(requestId);

  try {
    const request = await prisma.request.findUnique({ where: { id: requestId } });
    const volunteer = await prisma.user.findUnique({ where: { id: volunteerId } });

    if (!request || !volunteer) {
      return res.status(404).json({ message: "Request or volunteer not found." });
    }

    // Medical request rule
    if (request.emergencyType.toLowerCase() === "medical") {
      const hasMedicalSkill =
        (volunteer.skills || "").toLowerCase().includes("medical") ||
        volunteer.fullName.startsWith("Dr.");

      if (!volunteer.isMedicalVerified && !hasMedicalSkill) {
        return res.status(403).json({
          message: "Only medical volunteers can accept medical requests."
        });
      }
    }

    // Update the assignment
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

    // Update request & volunteer status
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


/* ----------------------------------------
   VOLUNTEER DECLINE REQUEST  (PUT /decline/:id)
----------------------------------------- */
router.put('/decline/:id', async (req, res) => {
  const requestId = parseInt(req.params.id);
  const { volunteerId } = req.body;
  const reqIdStr = String(requestId);

  try {
    // Record decline in assignment
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

    // Make volunteer available again
    await updateVolunteerStatus(volunteerId, 'Available');

    // Count UNIQUE decliners
    const declineRecords = await prisma.assignment.findMany({
      where: { requestId, declineCount: { gte: 1 } },
      select: { volunteerId: true }
    });

    const uniqueDecliners = new Set(declineRecords.map(d => d.volunteerId));

    // If 3+ volunteers declined → "Reassign"
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

    // Otherwise return to queue
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


/* ----------------------------------------
   VOLUNTEER AVAILABLE TASKS
----------------------------------------- */
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

    const isMedical =
      volunteer.isMedicalVerified ||
      (volunteer.skills || "").toLowerCase().includes("medical") ||
      volunteer.fullName.startsWith("Dr.");

    const requests = await prisma.request.findMany({
      where: {
        status: { in: ['Pending', 'Assigned', 'Conflict'] },
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
      if (r.emergencyType.toLowerCase() === "medical" && !isMedical) return false;
      return true;
    });

    res.json({ requests: filtered });

  } catch (err) {
    console.error("Fetch tasks error:", err);
    res.status(500).json({ message: "Failed to fetch tasks." });
  }
});


export default router;
