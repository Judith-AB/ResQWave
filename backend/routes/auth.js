// --- backend/routes/auth.js ---
import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../src/client.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const router = express.Router();

// Setup file path helpers for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- MULTER STORAGE CONFIGURATION ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Path points to backend/uploads/proofs/
        cb(null, path.join(__dirname, '../../uploads/proofs'));
    },
    filename: (req, file, cb) => {
        // Filename: username-timestamp-extension
        cb(null, req.body.username + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// 1. SIGNUP ROUTE (POST /signup)
router.post('/signup', upload.single('medicalProof'), async (req, res) => {

    const {
        fullName, contact, location, username, password,
        isMedicalCertified, skills
    } = req.body;

    const proofFile = req.file;
    const proofPath = proofFile ? `/uploads/proofs/${proofFile.filename}` : null;
    const certified = isMedicalCertified === 'true'; // Convert string "true" to boolean true

    // --- Validation 1: Required Fields ---
    if (!username || !password || !fullName) {
        if (proofFile) await fs.unlink(proofFile.path);
        return res.status(400).json({ message: "Missing required fields." });
    }

    // --- Validation 2: Proof Check ---
    if (certified && !proofPath) {
        return res.status(400).json({ message: "Medical certification selected but proof file is missing." });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                fullName, contact: contact || null, location: location || 'N/A',
                username, passwordHash, skills: skills || null,
                isVolunteer: true, isMedicalVerified: false, status: 'Available',
            },
        });

        // --- CORRECT LOGIC: CREATE PROOF RECORD AND SAVE THE PATH ---
        if (certified && proofPath) {
            await prisma.proof.create({
                data: {
                    userId: newUser.id,
                    proofUrl: proofPath, // Store the relative URL
                    isVerified: false, // Flagged for Admin review
                }
            });
        }
        // -----------------------------------------------------------

        res.status(201).json({
            message: "Volunteer registered successfully! Awaiting verification.",
            userId: newUser.id
        });

    } catch (error) {
        console.error('Signup Error:', error);

        // Clean up uploaded file if database insertion fails 
        if (proofFile) await fs.unlink(proofFile.path);

        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Username already taken." });
        }
        res.status(500).json({ message: "Failed to register volunteer." });
    }
});


// 2. LOGIN ROUTE (POST /login)
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true, username: true, fullName: true, passwordHash: true,
                contact: true, location: true, skills: true, isVolunteer: true,
                isMedicalVerified: true, status: true,
            }
        });

        if (!user) { return res.status(401).json({ message: "Invalid username or password." }); }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) { return res.status(401).json({ message: "Invalid username or password." }); }

        let role = user.username === 'admin' ? 'admin' : 'volunteer';
        const { passwordHash, ...userPayload } = user;

        res.status(200).json({ message: "Login successful!", ...userPayload, role: role });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: "An error occurred during login." });
    }
});
router.put('/verify-medical/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { isMedicalVerified: true },
        });

        await prisma.proof.updateMany({
            where: { userId: userId, isVerified: false },
            data: { isVerified: true },
        });

        res.status(200).json({ message: `Volunteer ${userId} medically verified.`, user: updatedUser });
    } catch (error) {
        console.error('Medical Verification Error:', error);
        res.status(500).json({ message: "Failed to verify medical proof." });
    }
});


export default router;