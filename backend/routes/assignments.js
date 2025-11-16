// --- backend/routes/assignments.js ---
import express from 'express';
import prisma from '../src/client.js'; 
import { io } from '../src/index.js'; 

const router = express.Router();

const updateVolunteerStatus = async (volunteerId, newStatus) => {
    try {
        await prisma.user.update({
            where: { id: volunteerId },
            data: { status: newStatus }
        });
    } catch (e) {
        console.error(`Failed to update volunteer ${volunteerId} status to ${newStatus}.`, e);
    }
};


router.post('/admin-assign', async (req, res) => {
    const { requestId, volunteerId } = req.body;
    const reqIdStr = String(requestId);

    try {
        await prisma.request.update({
            where: { id: requestId },
            data: { status: 'Assigned' }
        });
        await updateVolunteerStatus(volunteerId, 'Busy');
        io.to(reqIdStr).emit('system_notification', {
            status: 'Assigned',
            text: `A volunteer has been assigned by a coordinator.`,
            requestId: requestId
        });

        res.status(200).json({ message: `Request ${requestId} assigned successfully.` });

    } catch (error) {
        console.error('Admin Assignment Error:', error);
        res.status(500).json({ message: "Failed to process Admin assignment." });
    }
});


router.post('/accept-request', async (req, res) => {
    const { requestId, volunteerId } = req.body;
    const reqIdStr = String(requestId);

    try {
        await prisma.request.update({
            where: { id: requestId },
            data: { status: 'Assigned' }
        });
        await updateVolunteerStatus(volunteerId, 'Busy');
    
        io.to(reqIdStr).emit('system_notification', {
            status: 'Assigned',
            text: `Volunteer is now officially en route! Use the chat below.`,
            requestId: requestId
        });

        res.status(200).json({ message: "Task accepted and status updated." });
    } catch (error) {
        console.error('Accept Request Error:', error);
        res.status(500).json({ message: "Failed to accept task." });
    }
});



router.put('/decline/:id', async (req, res) => {
    const requestId = parseInt(req.params.id);
    const reqIdStr = String(requestId);

    try {
        
        const updatedRequest = await prisma.request.update({
            where: { id: requestId },
            data: { rejectionCount: { increment: 1 }, status: 'Pending' },
        });
        if (updatedRequest.rejectionCount >= 3) {
            await prisma.request.update({ where: { id: requestId }, data: { status: 'Atmost' } });
        }
    
        io.to(reqIdStr).emit('system_notification', {
            status: updatedRequest.status,
            text: `A volunteer has declined this task. Re-queuing for assignment.`,
            requestId: requestId
        });

        res.status(200).json({ message: "Request declined. Rejection count incremented." });
    } catch (error) {
        console.error('Decline Error:', error);
        res.status(500).json({ message: "Failed to decline request." });
    }
});



router.put('/resolve/:id/admin', async (req, res) => {
    const requestId = parseInt(req.params.id);
    const reqIdStr = String(requestId);

    try {
        
        await prisma.request.update({
            where: { id: requestId },
            data: { isResolvedByVolunteer: true, isResolvedByVictim: true, status: 'Completed' },
        });


        const assignment = await prisma.assignment.findFirst({
            where: { requestId: requestId },
            orderBy: { id: 'desc' }
        });
        if (assignment) {
            await updateVolunteerStatus(assignment.volunteerId, 'Available');
        }
      
        io.to(reqIdStr).emit('system_notification', {
            status: 'Completed',
            text: `✅ The request has been manually closed by an Admin.`,
            requestId: requestId
        });

        res.status(200).json({ message: "Request successfully resolved and closed." });
    } catch (error) {
        console.error('Admin Resolve Error:', error);
        res.status(500).json({ message: "Failed to resolve task." });
    }
});

router.get('/available-tasks', async (req, res) => {

    try {
        const availableRequests = await prisma.request.findMany({
            where: { status: 'Pending' }, 
            orderBy: { urgencyScore: 'desc' },
        });

        res.status(200).json({ requests: availableRequests });
    } catch (error) {
        console.error('Fetch Available Tasks Error:', error);
        res.status(500).json({ message: "Failed to fetch tasks." });
    }
});


export default router;