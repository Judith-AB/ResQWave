

import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../src/client.js'; // Our database client

const router = express.Router();

// --- POST /api/auth/signup (Volunteer Registration) ---
router.post('/signup', async (req, res) => {
    // Note: The proofUrl logic is simple here since we aren't doing actual file uploads yet.
    const { fullName, contact, location, username, password, isMedicalCertified } = req.body;

    // Check for essential fields
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
                isVolunteer: true, 
                isMedicalVerified: false, // Must be verified by Admin later
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

export default router; 