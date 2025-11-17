// --- backend/routes/auth.js ---
import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../src/client.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const router = express.Router();

// Setup file path helpers
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ------------------------------------------------------------------
// MULTER STORAGE FOR MEDICAL PDF UPLOAD
// ------------------------------------------------------------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../../uploads/proofs'));
    },
    filename: (req, file, cb) => {
        cb(null, req.body.username + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });


// ------------------------------------------------------------------
// 1️⃣ VOLUNTEER SIGNUP
// ------------------------------------------------------------------
router.post('/signup', upload.single('medicalProof'), async (req, res) => {
    const {
        fullName,
        contact,
        location,
        username,
        password,
        isMedicalCertified,
        skills
    } = req.body;

    const proofFile = req.file;
    const proofPath = proofFile ? `/uploads/proofs/${proofFile.filename}` : null;
    const certified = isMedicalCertified === 'true';

    if (!username || !password || !fullName) {
        if (proofFile) await fs.unlink(proofFile.path);
        return res.status(400).json({ message: "Missing required fields." });
    }

    // If user says they are certified, they MUST upload PDF
    if (certified && !proofPath) {
        return res.status(400).json({ message: "Medical proof required." });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Newly registered volunteers wait for admin approval
        const newUser = await prisma.user.create({
            data: {
                fullName,
                contact: contact || null,
                location: location || "N/A",
                username,
                passwordHash,
                skills: skills || null,
                isVolunteer: true,
                isApproved: false,
                isMedicalVerified: false,
                status: "Available"
            }
        });

        // ⭐ ALWAYS save proof if a file was uploaded
        if (proofPath) {
            await prisma.proof.create({
                data: {
                    userId: newUser.id,
                    proofUrl: proofPath,
                    isVerified: false
                }
            });
        }

        res.status(201).json({
            message: "Volunteer registered! Awaiting admin approval.",
            userId: newUser.id
        });

    } catch (error) {
        console.error("Signup Error:", error);

        if (proofFile) await fs.unlink(proofFile.path);

        if (error.code === "P2002") {
            return res.status(400).json({ message: "Username already taken." });
        }

        res.status(500).json({ message: "Signup failed." });
    }
});


// ------------------------------------------------------------------
// 2️⃣ LOGIN
// ------------------------------------------------------------------
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { username },
            select: {
                id: true,
                username: true,
                fullName: true,
                passwordHash: true,
                contact: true,
                location: true,
                skills: true,
                isVolunteer: true,
                isMedicalVerified: true,
                isApproved: true,
                status: true
            }
        });

        if (!user) return res.status(401).json({ message: "Invalid username or password." });

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) return res.status(401).json({ message: "Invalid username or password." });

        if (user.isVolunteer && !user.isApproved) {
            return res.status(403).json({ message: "Your account is pending admin approval." });
        }

        const role = user.username === "admin" ? "admin" : "volunteer";
        const { passwordHash, ...safeUser } = user;

        res.status(200).json({
            message: "Login successful!",
            ...safeUser,
            role
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Login failed." });
    }
});


// ------------------------------------------------------------------
// 3️⃣ FETCH PENDING VOLUNTEERS (Admin)
// ------------------------------------------------------------------
router.get('/pending-volunteers', async (req, res) => {
    try {
        const pending = await prisma.user.findMany({
            where: {
                isVolunteer: true,
                isApproved: false
            },
            include: { proofs: true }
        });

        res.json({ pending });

    } catch (e) {
        console.error("Fetch Pending Volunteers Error:", e);
        res.status(500).json({ message: "Failed to fetch pending volunteers." });
    }
});


// ------------------------------------------------------------------
// 4️⃣ APPROVE VOLUNTEER (Admin)
// ⭐ If volunteer uploaded a PDF → medically verified
// ⭐ If no PDF → not medically verified
// ------------------------------------------------------------------
router.put('/approve-volunteer/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { proofs: true }
        });

        if (!user) {
            return res.status(404).json({ message: "Volunteer not found" });
        }

        const hasPdf = user.proofs && user.proofs.length > 0;

        // If uploaded proof, mark as verified automatically
        if (hasPdf) {
            await prisma.proof.updateMany({
                where: { userId },
                data: { isVerified: true }
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                isApproved: true,
                isMedicalVerified: hasPdf ? true : false
            }
        });

        res.json({
            message: hasPdf
                ? "Volunteer approved + medically verified!"
                : "Volunteer approved!",
            user: updatedUser
        });

    } catch (e) {
        console.error("Approve Volunteer Error:", e);
        res.status(500).json({ message: "Failed to approve volunteer." });
    }
});


// ------------------------------------------------------------------
// 5️⃣ MANUAL MEDICAL VERIFICATION (Admin)
// ------------------------------------------------------------------
router.put('/verify-medical/:userId', async (req, res) => {
    const userId = parseInt(req.params.userId);

    try {
        await prisma.user.update({
            where: { id: userId },
            data: { isMedicalVerified: true }
        });

        await prisma.proof.updateMany({
            where: { userId },
            data: { isVerified: true }
        });

        res.json({ message: "Medical proof verified!" });

    } catch (error) {
        console.error("Medical Proof Verification Error:", error);
        res.status(500).json({ message: "Failed to verify medical proof." });
    }
});


export default router;
