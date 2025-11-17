// --- backend/routes/requests.js ---
import express from 'express';
import prisma from '../src/client.js';
import Groq from 'groq-sdk';
import 'dotenv/config';

const router = express.Router();

const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY missing; falling back to rule-based score.");
    return null;
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};
const groq = getGroqClient();

const originalCalculateUrgencyScore = (type) => {
  const map = {
    medical: 9.5, rescue: 9.5,
    shelter: 7.0, transportation: 7.0,
    food: 5.5, water: 5.5, flooding: 5.5, missing: 5.5,
    electricity: 3.0, other: 3.0
  };
  return parseFloat(((map[(type || '').toLowerCase()] || 3.0) + Math.random() * 0.5).toFixed(2));
};

const calculateUrgencyScore = async (type, details) => {
  if (!groq) return originalCalculateUrgencyScore(type);
  try {
    const prompt = `Rate urgency 1-10. Emergency Type: ${type}. Details: ${details}`;
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 10
    });
    const score = parseFloat(completion.choices[0].message.content.trim());
    return isNaN(score) ? originalCalculateUrgencyScore(type) : score;
  } catch (err) {
    console.error('Groq error', err);
    return originalCalculateUrgencyScore(type);
  }
};

// CREATE REQUEST
router.post('/', async (req, res) => {
  const { victimName, contact, location, emergencyType, details } = req.body;
  if (!victimName || !location || !emergencyType) return res.status(400).json({ message: "Missing fields." });

  try {
    const urgencyScore = await calculateUrgencyScore(emergencyType, details || '');
    const newRequest = await prisma.request.create({
      data: {
        victimName, contact, location, emergencyType,
        details: details || '', urgencyScore,
        status: 'Pending',
        isResolvedByVictim: false, isResolvedByVolunteer: false
      }
    });
    res.status(201).json({ message: "Help request submitted.", requestId: newRequest.id, urgencyScore: newRequest.urgencyScore });
  } catch (error) {
    console.error('Request Submission Error:', error);
    res.status(500).json({ message: "Failed to submit request." });
  }
});

// PENDING (admin) — returns pending/assigned/conflict/reassign etc with latest assignment + volunteer info
router.get('/pending', async (req, res) => {
  try {
    const pendingRequests = await prisma.request.findMany({
      where: { status: { in: ['Pending', 'Assigned', 'Atmost', 'Conflict', 'Reassign'] } },
      orderBy: { urgencyScore: 'desc' },
      include: {
        assignments: {
          orderBy: { id: 'desc' },
          take: 1,
          include: {
            volunteer: { select: { id: true, fullName: true, isMedicalVerified: true, skills: true } }
          }
        }
      }
    });

    const volunteers = await prisma.user.findMany({
      where: { isVolunteer: true },
      select: {
        id: true, fullName: true, contact: true, skills: true, isMedicalVerified: true, location: true, status: true,
        proofs: { where: { isVerified: false }, take: 1, select: { proofUrl: true, isVerified: true } }
      }
    });

    res.status(200).json({ requests: pendingRequests, volunteers });
  } catch (error) {
    console.error('Fetch Pending Requests Error:', error);
    res.status(500).json({ message: "Failed to fetch pending requests." });
  }
});

// LOOKUP (unchanged semantics)
router.post('/lookup', async (req, res) => {
  const { requestId, contact, location } = req.body;
  if (!requestId && !contact) return res.status(400).json({ message: "ID or contact required." });

  try {
    let request = null;
    if (requestId) {
      const id = parseInt(requestId);
      request = await prisma.request.findUnique({
        where: { id },
        select: { id: true, victimName: true, contact: true, status: true, emergencyType: true, urgencyScore: true, details: true }
      });
      if (request && contact && request.contact !== contact) return res.status(401).json({ message: "Contact mismatch." });
    }

    if (!request && contact) {
      request = await prisma.request.findFirst({
        where: { contact, status: { notIn: ['Completed'] } },
        orderBy: { createdAt: 'desc' },
        select: { id: true, victimName: true, contact: true, status: true, emergencyType: true, urgencyScore: true, details: true }
      });
    }

    if (!request) return res.status(404).json({ message: "No active request found." });
    if (request.status === 'Completed') return res.status(409).json({ message: "Already completed." });

    res.status(200).json({ message: "Request found.", request });
  } catch (error) {
    console.error('Request Lookup Error:', error);
    res.status(500).json({ message: "Failed to look up request." });
  }
});

export default router;
