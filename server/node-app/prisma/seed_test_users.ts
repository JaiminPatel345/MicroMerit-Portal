/**
 * Seed script for test users and provider issuers
 * Run with: npx tsx prisma/seed_test_users.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const TEST_USERS = [
    { email: 'test1@gmail.com', name: 'Test User One' },
    { email: 'test2@gmail.com', name: 'Test User Two' },
    { email: 'test3@gmail.com', name: 'Test User Three' },
    { email: 'test4@gmail.com', name: 'Test User Four' },
    { email: 'test5@gmail.com', name: 'Test User Five' },
];

const PROVIDER_ISSUERS = [
    {
        name: 'NSDC (National Skill Development Corporation)',
        email: 'nsdc@example.com',
        type: 'government',
        status: 'approved',
    },
    {
        name: 'Udemy',
        email: 'udemy@example.com',
        type: 'online_platform',
        status: 'approved',
    },
    {
        name: 'Jaimin Pvt Ltd',
        email: 'jaimin@example.com',
        type: 'corporate',
        status: 'approved',
    },
    {
        name: 'SIH (Smart India Hackathon)',
        email: 'sih@example.com',
        type: 'government',
        status: 'approved',
    },
];

async function main() {
    console.log('🌱 Seeding test users and provider issuers...\n');

    const DEFAULT_PASSWORD = 'Test@123';
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // Create test users
    console.log('Creating test users:');
    for (const user of TEST_USERS) {
        const existing = await prisma.learner.findUnique({
            where: { email: user.email },
        });

        if (existing) {
            console.log(`  ✓ ${user.email} already exists (ID: ${existing.id})`);
        } else {
            const created = await prisma.learner.create({
                data: {
                    email: user.email,
                    name: user.name,
                    hashed_password: hashedPassword,
                    status: 'active',
                },
            });
            console.log(`  ✓ Created ${user.email} (ID: ${created.id})`);
        }
    }

    // Create provider issuers
    console.log('\nCreating provider issuers:');
    const issuerIds: Record<string, number> = {};

    for (const issuer of PROVIDER_ISSUERS) {
        const existing = await prisma.issuer.findUnique({
            where: { email: issuer.email },
        });

        if (existing) {
            console.log(`  ✓ ${issuer.name} already exists (ID: ${existing.id})`);
            issuerIds[issuer.email] = existing.id;
        } else {
            const created = await prisma.issuer.create({
                data: {
                    name: issuer.name,
                    email: issuer.email,
                    type: issuer.type,
                    status: issuer.status,
                    approved_at: new Date(),
                },
            });
            console.log(`  ✓ Created ${issuer.name} (ID: ${created.id})`);
            issuerIds[issuer.email] = created.id;
        }
    }

    // Print .env configuration
    console.log('\n📋 Add these to your .env file:\n');
    console.log(`NSDC_ISSUER_ID=${issuerIds['nsdc@example.com']}`);
    console.log(`UDEMY_ISSUER_ID=${issuerIds['udemy@example.com']}`);
    console.log(`JAIMIN_ISSUER_ID=${issuerIds['jaimin@example.com']}`);
    console.log(`SIH_ISSUER_ID=${issuerIds['sih@example.com']}`);

    console.log('\n✅ Seeding complete!');
    console.log('\nTest user credentials:');
    console.log(`  Email: test1@gmail.com to test5@gmail.com`);
    console.log(`  Password: ${DEFAULT_PASSWORD}`);
}

main()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
