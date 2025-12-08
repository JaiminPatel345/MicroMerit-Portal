import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
    const hashedPassword = await bcrypt.hash('admin@123', 10);

    const admin = await prisma.admin.create({
        data: {
            email: 'admin@micromerit.com',
            password_hash: hashedPassword,
        },
    });

    console.log('✅ Admin user created:');
    console.log('  Email: admin@micromerit.com');
    console.log('  Password: admin@123');
    console.log('  ID:', admin.id);
}

createAdmin()
    .then(() => {
        prisma.$disconnect();
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        prisma.$disconnect();
        process.exit(1);
    });
