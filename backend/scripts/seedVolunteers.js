import prisma from '../src/client.js';
import bcrypt from 'bcryptjs';

const seedVolunteers = async () => {
    console.log("Starting volunteer seeding...");

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt); 
    
    const volunteersData = [
       
        { 
            fullName: "Dr. Latha Menon", 
            username: "latha_md", 
            passwordHash: passwordHash, 
            location: "Kochi, Ernakulam", 
            skills: "Triage, Advanced First Aid", 
            isVolunteer: true, 
            isMedicalVerified: false,
            status: 'Available',
            contact: "9847123456" 
        },
     
        { 
            fullName: "Dr. Riju Thomas", 
            username: "riju_md", 
            passwordHash: passwordHash, 
            location: "Malappuram", 
            skills: "Trauma Care, Field Surgery", 
            isVolunteer: true, 
            isMedicalVerified: false,
            status: 'Available',
            contact: "9746789012"
        },
      
        { 
            fullName: "Santhosh Kumar", 
            username: "santhosh_k", 
            passwordHash: passwordHash, 
            location: "Alappuzha South", 
            skills: "Boat Operation, Logistics", 
            isVolunteer: true, 
            isMedicalVerified: false, 
            status: 'Available',
            contact: "9567456789"
        },
        { 
            fullName: "Mini Sreedharan", 
            username: "mini_s", 
            passwordHash: passwordHash, 
            location: "Thiruvananthapuram", 
            skills: "Shelter Management, Child Care", 
            isVolunteer: true, 
            isMedicalVerified: false, 
            status: 'Available',
            contact: "9447112233"
        },
        { 
            fullName: "Girish V.", 
            username: "girish_v", 
            passwordHash: passwordHash, 
            location: "Thrissur City", 
            skills: "Electrical Repair, Basic First Aid", 
            isVolunteer: true, 
            isMedicalVerified: false, 
            status: 'Available',
            contact: "9037887766"
        },
        { 
            fullName: "Ajay Zachariah", 
            username: "ajay_z", 
            passwordHash: passwordHash, 
            location: "Ernakulam Central", 
            skills: "Heavy Machinery, Logistics", 
            isVolunteer: true, 
            isMedicalVerified: false, 
            status: 'Available',
            contact: "9946554433"
        },
    
        { 
            fullName: "Rajeshwari P.", 
            username: "rajeshwari_p", 
            passwordHash: passwordHash, 
            location: "Kottayam Central", 
            skills: "Transportation, Shelter Management", 
            isVolunteer: true, 
            isMedicalVerified: false, 
            status: 'Busy',
            contact: "9633221100"
        },
        { 
            fullName: "Deepa Nair", 
            username: "deepa_n", 
            passwordHash: passwordHash, 
            location: "Kollam Beach", 
            skills: "Cooking, Food Distribution", 
            isVolunteer: true, 
            isMedicalVerified: false, 
            status: 'Busy',
            contact: "9747998877"
        },
        { 
            fullName: "Judith Ann Benny", 
            username: "judith_ab", 
            passwordHash: passwordHash, 
            location: "Pukkattupady", 
            skills: "Food Distribution", 
            isVolunteer: true, 
            isMedicalVerified: false, 
            status: 'Busy',
            contact: "9747998877"
        }
    ];

    for (const vol of volunteersData) {
        try {
          
            const newUser = await prisma.user.upsert({
                where: { username: vol.username },
                update: vol,
                create: vol,
            });
            
            console.log(` User ensured: ${newUser.fullName} (ID: ${newUser.id})`);


            if (vol.isMedicalVerified) {
                 await prisma.proof.upsert({
                    where: { userId: newUser.id },
                    update: { isVerified: false }, 
                    create: {
                        userId: newUser.id,
                        
                        proofUrl: `/uploads/proofs/${vol.username}_cert.pdf`, 
                        isVerified: false, 
                    }
                });
                console.log(`   * Proof record created/reset for ${vol.fullName} (PENDING REVIEW)`);
            }

        } catch (error) {
            if (error.code === 'P2002') {
                console.warn(`User ${vol.username} already exists. Skipping.`);
            } else {
                console.error(`Failed to create/update ${vol.fullName}:`, error);
            }
        }
    }

    console.log("Volunteer seeding complete.");
};

seedVolunteers()
    .catch((e) => {
        console.error("Seeding failed with unhandled error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });