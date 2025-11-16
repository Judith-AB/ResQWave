// resqwave/backend/routes/assignments.js

import express from 'express';
import prisma from '../src/client.js';

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

    try {
        const request = await prisma.request.findUnique({ where: { id: requestId } });
        if (!request || request.status !== 'Pending') {
            return res.status(409).json({ message: "Request is not in a Pending state for assignment." });
        }

        await prisma.assignment.create({
            data: {
                requestId: requestId,
                volunteerId: volunteerId,
                isAccepted: false,
            }
        });

        await prisma.request.update({
            where: { id: requestId },
            data: { status: 'Assigned' },
        });

        await updateVolunteerStatus(volunteerId, 'Busy');

        res.status(200).json({ message: `Request ${requestId} assigned successfully.` });

    } catch (error) {
        console.error('Admin Assignment Error:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "Assignment already exists for this request/volunteer pair." });
        }
        res.status(500).json({ message: "Failed to process Admin assignment." });
    }
});


router.post('/accept-request', async (req, res) => {
    const { requestId, volunteerId } = req.body;

    try {
        const request = await prisma.request.findUnique({ where: { id: requestId } });
        if (!request || request.status !== 'Pending') {
            return res.status(409).json({ message: "Request is no longer pending." });
        }

        await prisma.assignment.create({
            data: {
                requestId: requestId,
                volunteerId: volunteerId,
                isAccepted: true, 
            }
        });

        await prisma.request.update({
            where: { id: requestId },
            data: { status: 'Assigned' },
        });

        await updateVolunteerStatus(volunteerId, 'Busy');

        res.status(200).json({ message: "Task accepted and status updated." });
    } catch (error) {
        console.error('Accept Request Error:', error);
        if (error.code === 'P2002') {
            return res.status(409).json({ message: "Task already claimed by another volunteer." });
        }
        res.status(500).json({ message: "Failed to accept task." });
    }
});



router.put('/decline/:id', async (req, res) => {
    const requestId = parseInt(req.params.id);

    try {
        
        const updatedRequest = await prisma.request.update({
            where: { id: requestId },
            data: {
                rejectionCount: { increment: 1 },
                status: 'Pending' 
            },
        });


        if (updatedRequest.rejectionCount >= 3) {
            await prisma.request.update({
                where: { id: requestId },
                data: { status: 'Atmost' }, 
            });
        }

        res.status(200).json({ message: "Request declined. Rejection count incremented." });
    } catch (error) {
        console.error('Decline Error:', error);
        res.status(500).json({ message: "Failed to decline request." });
    }
});


router.put('/conflict/:id', async (req, res) => {
    const requestId = parseInt(req.params.id);

    try {
        await prisma.request.update({
            where: { id: requestId },
            data: { status: 'Atmost' },
        });

        res.status(200).json({ message: "Conflict reported. Urgency escalated." });
    } catch (error) {
        console.error('Conflict Error:', error);
        res.status(500).json({ message: "Failed to report conflict." });
    }
});


// -----------------------------------------------------------------
// --- PUT /api/assignments/complete/:id/volunteer (Volunteer Action) ---
// -----------------------------------------------------------------
router.put('/complete/:id/volunteer', async (req, res) => {
    const requestId = parseInt(req.params.id);

    try {
        // Mark completion flag by Volunteer
        await prisma.request.update({
            where: { id: requestId },
            data: { isResolvedByVolunteer: true },
        });

        res.status(200).json({ message: "Task completion marked by volunteer." });
    } catch (error) {
        console.error('Complete Error:', error);
        res.status(500).json({ message: "Failed to mark completion." });
    }
});


// -----------------------------------------------------------------
// --- PUT /api/assignments/resolve/:id/admin (Admin Final Resolution) ---
// -----------------------------------------------------------------
router.put('/resolve/:id/admin', async (req, res) => {
    const requestId = parseInt(req.params.id);

    try {
        // 1. Set BOTH resolution flags to true and set status to 'Completed'
        await prisma.request.update({
            where: { id: requestId },
            data: {
                isResolvedByVolunteer: true,
                isResolvedByVictim: true,
                status: 'Completed'
            },
        });

        // 2. Set the assigned volunteer's status back to 'Available'
        const assignment = await prisma.assignment.findFirst({
            where: { requestId: requestId },
            orderBy: { id: 'desc' }
        });

        if (assignment) {
            await updateVolunteerStatus(assignment.volunteerId, 'Available');
        }

        res.status(200).json({ message: "Request successfully resolved and closed." });
    } catch (error) {
        console.error('Admin Resolve Error:', error);
        res.status(500).json({ message: "Failed to resolve task." });
    }
});


// -----------------------------------------------------------------
// --- GET /api/assignments/available-tasks (Fetch tasks for Volunteers) ---
// -----------------------------------------------------------------
router.get('/available-tasks', async (req, res) => {
    // This route is called by the Volunteer Dashboard to show PENDING requests they can accept.
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