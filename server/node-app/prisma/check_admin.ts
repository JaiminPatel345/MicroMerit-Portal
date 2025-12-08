import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmin() {
    const admins = await prisma.admin.findMany({
        select: {
            id: true,
            email: true,
            created_at: true,
        },
    });

    console.log('\n📊 Admin Users in Database:\n');
    if (admins.length === 0) {
        console.log('❌ No admin users found!');
    } else {
        admins.forEach(admin => {
            console.log(`  ✓ ID: ${admin.id}`);
            console.log(`    Email: ${admin.email}`);
            console.log(`    Created: ${admin.created_at.toLocaleString()}`);
            console.log('');
        });
        console.log(`Total: ${admins.length} admin(s)`);
    }
}

checkAdmin()
    .then(() => {
        prisma.$disconnect();
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Error:', error);
        prisma.$disconnect();
        process.exit(1);
    });
