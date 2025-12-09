import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting external issuers seeding...');

    // Create external provider issuers
    const issuers = [
        {
            name: 'NSDC (National Skill Development Corporation)',
            email: 'nsdc@skillindiadigital.gov.in',
            type: 'government',
            website_url: 'https://nsdcindia.org',
        },
        {
            name: 'Udemy',
            email: 'partnerships@udemy.com',
            type: 'private',
            website_url: 'https://www.udemy.com',
        },
        {
            name: 'Jaimin Pvt Ltd',
            email: 'contact@jaimin.com',
            type: 'private',
            website_url: 'https://jaimin.com',
        },
        {
            name: 'Smart India Hackathon',
            email: 'info@sih.gov.in',
            type: 'government',
            website_url: 'https://sih.gov.in',
        },
    ];

    for (const issuerData of issuers) {
        const issuer = await prisma.issuer.upsert({
            where: { email: issuerData.email },
            update: {},
            create: {
                name: issuerData.name,
                email: issuerData.email,
                password_hash: '', // External issuers don't need login
                type: issuerData.type,
                website_url: issuerData.website_url,
                status: 'approved', // Auto-approve external providers
                approved_at: new Date(),
            },
        });

        console.log(`✅ Issuer created/verified: ${issuer.name} (ID: ${issuer.id})`);
    }

    console.log('');
    console.log('🎉 External issuers seeding completed!');
    console.log('');
    console.log('Created issuers:');
    console.log('  1. NSDC (National Skill Development Corporation)');
    console.log('  2. Udemy');
    console.log('  3. Jaimin Pvt Ltd');
    console.log('  4. Smart India Hackathon');
}

main()
    .catch((e) => {
        console.error('❌ Error during seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
