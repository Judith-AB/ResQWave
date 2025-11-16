// resqwave/backend/routes/auth.js

import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../src/client.js'; 

const router = express.Router();


router.post('/signup', async (req, res) => {
    const { fullName, contact, location, username, password, isMedicalCertified, skills } = req.body;

    if (!username || !password || !fullName) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const newUser = await prisma.user.create({
            data: {
                fullName,
                contact: contact || null, 
                location: location || 'N/A',
                username,
                passwordHash,
                skills: skills || null,
                isVolunteer: true, 
                isMedicalVerified: false,
                status: 'Available', 
            },
        });

        if (isMedicalCertified) {
            await prisma.proof.create({
                data: {
                    userId: newUser.id,
                    proofUrl: `Awaiting_Upload_for_User_${newUser.id}`, 
                    isVerified: false,
                }
            });
        }
        res.status(201).json({ 
            message: "Volunteer registered successfully! Awaiting verification.", 
            userId: newUser.id 
        });

    } catch (error) {
        console.error('Signup Error:', error);
        if (error.code === 'P2002') {
            return res.status(400).json({ message: "Username already taken." });
        }
        res.status(500).json({ message: "Failed to register volunteer." });
    }
});



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
                status: true,
            }
        });

        if (!user) {
            return res.status(401).json({ message: "Invalid username or password." });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid username or password." });
        }
        
        let role = user.username === 'admin' ? 'admin' : 'volunteer'; 
        
        const { passwordHash, ...userPayload } = user;

        res.status(200).json({
            message: "Login successful!",
            ...userPayload, 
            role: role,
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: "An error occurred during login." });
    }
});

export default router;