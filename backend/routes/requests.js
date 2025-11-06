// resqwave/backend/routes/requests.js

import express from 'express';
import prisma from '../src/client.js';

const router = express.Router();

// --- Urgency Score Calculation Logic (RULE-BASED PLACEHOLDER) ---
// This will be replaced by the ML model later. Scores range from 1 to 10.
const calculateUrgencyScore = (emergencyType) => {
    let score = 0;

    // Assign a base score based on the critical nature of the request
    switch (emergencyType.toLowerCase()) {
        case 'medical':
        case 'rescue':
            score = 9.5; // Highest initial priority: immediate life/safety threat
            break;
        case 'shelter':
        case 'transportation':
            score = 7.0; // High priority: safety and relocation needs
            break;
        case 'food':
            score = 5.5; // Medium priority: sustained welfare
            break;
        case 'other':
        default:
            score = 3.0; // Low initial urgency
            break;
    }

    // Add small random decimal to ensure requests submitted at the same time are ordered
    return parseFloat((score + Math.random() * 0.5).toFixed(2));
};


// --- POST /api/requests (Victim Submits Help Request) ---
router.post('/', async (req, res) => {
    const { name, contact, location, emergencyType, details } = req.body;

    // Basic Validation
    if (!name || !location || !emergencyType) {
        return res.status(400).json({ message: "Missing required request fields." });
    }

    try {
        // 1. Calculate the urgency score using the placeholder function
        const urgencyScore = calculateUrgencyScore(emergencyType);

        // 2. Save the request to the Request table
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

        // 3. Respond with success status and the new Request ID
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

export default router;