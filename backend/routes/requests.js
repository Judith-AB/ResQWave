// resqwave/backend/routes/requests.js
import express from 'express';
import prisma from '../src/client.js';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const router = express.Router();

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

//  Original scoring system as fallback
const originalCalculateUrgencyScore = (emergencyType) => {
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
        case 'water':
        case 'flooding':
        case 'missing':
            score = 5.5;
            break;
        case 'electricity':
        case 'other':
        default:
            score = 3.0;
            break;
    }

    return parseFloat((score + Math.random() * 0.5).toFixed(2));
};

//  New AI-enhanced urgency score calculator
const calculateUrgencyScore = async (emergencyType, details) => {
    try {
        const prompt = `Analyze this emergency situation and rate its urgency on a scale of 1-10, where 10 is most urgent.
        Emergency Type: ${emergencyType}
        Details: ${details}
        Respond only with a number between 1 and 10.`;

        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "openai/gpt-oss-120b",
            temperature: 0.3,
            max_tokens: 10
        });

        const score = parseFloat(completion.choices[0].message.content.trim());

        // Ensure it’s a valid score
        if (isNaN(score) || score < 1 || score > 10) {
            return originalCalculateUrgencyScore(emergencyType);
        }

        return score;

    } catch (error) {
        console.error('Groq API Error:', error);
        return originalCalculateUrgencyScore(emergencyType);
    }
};

// Route to submit new request
router.post('/', async (req, res) => {
    const { name, contact, location, emergencyType, details } = req.body;

    if (!name || !location || !emergencyType) {
        return res.status(400).json({ message: "Missing required request fields." });
    }

    try {
        // AI-based urgency scoring
        const urgencyScore = await calculateUrgencyScore(emergencyType, details || '');

        // Save the request to DB
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

//  Route to fetch pending requests
router.get('/pending', async (req, res) => {
    try {
        const pendingRequests = await prisma.request.findMany({
            where: {
                status: {
                    in: ['Pending', 'Assigned', 'Atmost']
                }
            },
            orderBy: {
                urgencyScore: 'desc',
            },
        });

        const volunteers = await prisma.user.findMany({
            where: { isVolunteer: true },
            select: {
                id: true,
                fullName: true,
                contact: true,
                skills: true,
                isMedicalVerified: true,
                location: true,
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
