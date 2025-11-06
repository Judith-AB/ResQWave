
// resqwave/backend/scripts/setupAdmin.js

import bcrypt from 'bcryptjs';
import prisma from '../src/client.js';

async function createAdmin() {
    // Define Admin Credentials
    const username = 'admin';
    const password = 'admin123'; // Demo Password
    
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({ where: { username } });

    if (existingAdmin) {
        console.log(`Admin user "${username}" already exists. Skipping creation.`);
        return;
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create Admin User in DB
    await prisma.user.create({
        data: {
            username,
            passwordHash,
            fullName: 'ResQWave Coordinator',
            contact: 'admin@resqwave.com',
            location: 'Control Center',
            isVolunteer: false, 
            isMedicalVerified: false,
        },
    });

    console.log(`\n Default Admin Account Created:`);
    console.log(`   Username: admin`);
    console.log(`   Password: admin123\n`);

}

createAdmin()
    .catch((e) => {
        console.error("Failed to create admin account.");
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });