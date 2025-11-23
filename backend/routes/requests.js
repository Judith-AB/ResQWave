// --- backend/routes/requests.js (FINAL CORRECTED VERSION) ---
import express from 'express';
import prisma from "../src/client.js";

import Groq from 'groq-sdk';
import 'dotenv/config';

const router = express.Router();

/* ---------------- GROQ CONFIG ---------------- */
const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    console.warn("GROQ_API_KEY missing; using fallback scoring.");
    return null;
  }
  return new Groq({ apiKey: process.env.GROQ_API_KEY });
};
const groq = getGroqClient();

/* ---------------- URGENCY SCORE ---------------- */
const originalCalculateUrgencyScore = (type) => {
  const map = {
    medical: 9.5, rescue: 9.5, shelter: 7.0, transportation: 7.0,
    food: 5.5, water: 5.5, flooding: 5.5, missing: 5.5,
    electricity: 3.0, other: 3.0
  };
  return parseFloat(((map[(type || '').toLowerCase()] || 3.0) + Math.random() * 0.5).toFixed(2));
};

const calculateUrgencyScore = async (type, details) => {
  if (!groq) return originalCalculateUrgencyScore(type);

  try {
    const prompt = `Rate urgency 1–10. Type: ${type} Details: ${details}`;
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-120b",
      temperature: 0.3,
      max_tokens: 10
    });

    const score = parseFloat(completion.choices[0].message.content.trim());
    return isNaN(score) ? originalCalculateUrgencyScore(type) : score;

  } catch (err) {
    console.error("Groq error (Check API Key/Model)", err);
    return originalCalculateUrgencyScore(type);
  }
};

/* ---------------- CREATE REQUEST ---------------- */
router.post('/', async (req, res) => {
  const { victimName, contact, location, emergencyType, details } = req.body;

  if (!victimName || !location || !emergencyType) {
    return res.status(400).json({ message: "Missing fields." });
  }

  try {
    const urgencyScore = await calculateUrgencyScore(emergencyType, details || '');
    const newRequest = await prisma.request.create({
      data: {
        victimName, contact, location, emergencyType, details: details || '',
        urgencyScore, status: 'Pending', isResolvedByVictim: false, isResolvedByVolunteer: false
      }
    });

    res.status(201).json({
      message: "Help request submitted.",
      requestId: newRequest.id, urgencyScore: newRequest.urgencyScore
    });

  } catch (err) {
    console.error('Request Submission Error:', err);
    res.status(500).json({ message: "Failed to submit request." });
  }
});

/* ---------------- PENDING REQUESTS (ADMIN) ---------------- */
router.get('/pending', async (req, res) => {
  try {
    const volunteers = await prisma.user.findMany({
      where: {
        isVolunteer: true,
        isApproved: true, // ONLY APPROVED volunteers
      },
      include: { proofs: true }
    });

    // Remove unreliable 'Dr' check. Rely ONLY on the DB flag.
    const enrichedVolunteers = volunteers.map(v => ({
      ...v,
      isMedicalVerified: v.isMedicalVerified
    }));

    /* ---------------- GET REQUESTS ---------------- */
    const pendingRequests = await prisma.request.findMany({
      where: {
        status: { in: ['Pending', 'Assigned', 'Atmost', 'Conflict', 'Reassign'] }
      },
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

    res.status(200).json({ requests: pendingRequests, volunteers: enrichedVolunteers });

  } catch (err) {
    console.error("Fetch Pending Requests Error:", err);
    res.status(500).json({ message: "Failed to fetch pending requests." });
  }
});

/* ---------------- LOOKUP REQUEST ---------------- */
router.post('/lookup', async (req, res) => {
  const { requestId, contact } = req.body;

  if (!requestId && !contact) { return res.status(400).json({ message: "ID or Contact required." }); }

  try {
    let request = null;

    /* ---- SEARCH BY REQUEST ID ---- */
    if (requestId) {
      const id = parseInt(requestId);
      request = await prisma.request.findUnique({
        where: { id },
        include: {
          assignments: {
            orderBy: { id: 'desc' }, take: 1,
            select: { volunteerId: true, volunteer: { select: { id: true, fullName: true } } }
          }
        }
      });

      if (request && contact && request.contact !== contact) { return res.status(401).json({ message: "Contact mismatch." }); }
    }

    /* ---- SEARCH BY CONTACT ---- */
    if (!request && contact) {
      request = await prisma.request.findFirst({
        where: { contact, status: { notIn: ['Completed'] } },
        orderBy: { createdAt: 'desc' },
        include: {
          assignments: {
            orderBy: { id: 'desc' }, take: 1,
            select: { volunteerId: true, volunteer: { select: { id: true, fullName: true } } }
          }
        }
      });
    }

    if (!request) { return res.status(404).json({ message: "No active request found." }); }
    if (request.status === 'Completed') { return res.status(409).json({ message: "Already completed." }); }

    const latest = request.assignments?.[0];
    const assignedVolunteerId = latest?.volunteerId || null;

    res.status(200).json({
      message: "Request found.",
      request: {
        id: request.id, victimName: request.victimName, contact: request.contact,
        status: request.status, emergencyType: request.emergencyType,
        urgencyScore: request.urgencyScore, location: request.location,
        details: request.details, assignedVolunteerId,
        assignedVolunteerName: latest?.volunteer?.fullName || null
      }
    });

  } catch (err) {
    console.error("Request Lookup Error:", err);
    res.status(500).json({ message: "Failed to look up request." });
  }
});

export default router;