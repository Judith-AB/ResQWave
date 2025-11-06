// resqwave/backend/routes/requests.js

import express from 'express';
import prisma from '../src/client.js';

const router = express.Router();

// --- Urgency Score Calculation Logic (RULE-BASED PLACEHOLDER) ---
const calculateUrgencyScore = (emergencyType) => {
    let score = 0;

    switch (emergencyType.toLowerCase()) {
        case 'medical':
        case 'rescue':
            score = 9.5;
            break;
        case 'shelter':
        case 'transportation':
            score = 7.0;
            break;
        case 'food':
            score = 5.5;
            break;
        case 'other':
        default:
            score = 3.0;
            break;
    }

    return parseFloat((score + Math.random() * 0.5).toFixed(2));
};


// --- POST /api/requests (Victim Submits Help Request) ---
router.post('/', async (req, res) => {
    const { name, contact, location, emergencyType, details } = req.body;

    if (!name || !location || !emergencyType) {
        return res.status(400).json({ message: "Missing required request fields." });
    }

    try {
        const urgencyScore = calculateUrgencyScore(emergencyType);

        const newRequest = await prisma.request.create({
            data: {
                victimName: name,
                contact: contact,
                location: location,
                emergencyType: emergencyType,
                details: details || '',
                urgencyScore: urgencyScore,
                status: 'Pending',
            }
        });

        // Respond with data needed by the frontend modal
        res.status(201).json({
            message: "Help request submitted successfully.",
            requestId: newRequest.id,
            urgencyScore: newRequest.urgencyScore
        });

    } catch (error) {
        console.error('Request Submission Error:', error);
        res.status(500).json({ message: "Failed to submit request." });
    }
});


// --- GET /api/requests/pending (Admin Dashboard Data) ---
router.get('/pending', async (req, res) => {
    try {
        // Fetch all active requests, ordered by urgency (highest first)
        const pendingRequests = await prisma.request.findMany({
            where: {
                status: {
                    in: ['Pending', 'Assigned', 'Atmost'] // Active requests
                }
            },
            orderBy: {
                urgencyScore: 'desc', // Orders by Urgency Score
            },
            // Include assignment details if needed
            include: {
                assignments: true,
            }
        });

        // Fetch all volunteers for display/assignment purposes
        const volunteers = await prisma.user.findMany({
            where: { isVolunteer: true },
            select: {
                id: true,
                fullName: true,
                contact: true,
                skills: true,
                isMedicalVerified: true
            }
        });

        res.status(200).json({
            requests: pendingRequests,
            volunteers: volunteers
        });

    } catch (error) {
        console.error('Fetch Pending Requests Error:', error);
        res.status(500).json({ message: "Failed to fetch pending requests." });
    }
});

export default router;