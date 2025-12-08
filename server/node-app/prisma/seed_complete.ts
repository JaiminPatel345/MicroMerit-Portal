/**
 * Complete Seed Script for Testing
 * Seeds admin + test data for credential sync
 * 
 * Run: npx tsx prisma/seed_complete.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding complete test database...\n');

    // 1. Create Admin
    console.log('Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    await prisma.admin.create({
        data: {
            email: 'admin@micromerit.com',
            password_hash: adminPassword,
        },
    });
    console.log('  ✓ Admin created: admin@micromerit.com / admin123\n');

    // 2. Create Test Issuers (matching dummy server)
    console.log('Creating test issuers...');
    const issuers = [
        {
            name: 'NSDC Provider A',
            email: 'provider-a@nsdc.gov.in',
            type: 'government',
            status: 'approved',
            registry_id: 'provider-a',
            accept_external: true,
            reissue_local_vc: false,
        },
        {
            name: 'NSDC Provider B',
            email: 'provider-b@nsdc.gov.in',
            type: 'government',
            status: 'approved',
            registry_id: 'provider-b',
            accept_external: true,
            reissue_local_vc: false,
        },
        {
            name: 'NSDC Provider C',
            email: 'provider-c@nsdc.gov.in',
            type: 'government',
            status: 'approved',
            registry_id: 'provider-c',
            accept_external: true,
            reissue_local_vc: false,
        },
    ];

    for (const issuer of issuers) {
        await prisma.issuer.create({ data: issuer });
        console.log(`  ✓ ${issuer.name} (${issuer.registry_id})`);
    }

    // 3. Create Test Learners (matching dummy credentials)
    console.log('\nCreating test learners...');
    const learnerPassword = await bcrypt.hash('password123', 10);

    const learners = [
        {
            email: 'learner1@example.com',
            name: 'John Doe',
            phone: '+919876543211',
            hashed_password: learnerPassword,
            dob: new Date('1995-05-15'),
            other_emails: [],
        },
        {
            email: 'learner2@example.com',
            name: 'Jane Smith',
            phone: '+919876543212',
            hashed_password: learnerPassword,
            dob: new Date('1998-08-20'),
            other_emails: ['other.email@example.com'],
        },
        {
            email: 'learner3@example.com',
            name: 'Diana Prince',
            phone: '+919876543213',
            hashed_password: learnerPassword,
            dob: new Date('1990-12-10'),
            other_emails: [],
        },
        {
            email: 'alice.j@example.com',
            name: 'Alice Johnson',
            phone: '+919876543210',
            hashed_password: learnerPassword,
            dob: new Date('1997-03-25'),
            other_emails: [],
        },
        {
            email: 'newlearner@example.com',
            name: 'Charlie Brown',
            phone: '+919876543214',
            hashed_password: learnerPassword,
            dob: new Date('1999-11-05'),
            other_emails: [],
        },
    ];

    for (const learner of learners) {
        await prisma.learner.create({ data: learner });
        console.log(`  ✓ ${learner.name} (${learner.email})`);
    }

    console.log('\n✅ Seed complete!\n');
    console.log('═'.repeat(60));
    console.log('CREDENTIALS:');
    console.log('═'.repeat(60));
    console.log('Admin Portal (http://localhost:5174):');
    console.log('  Email: admin@micromerit.com');
    console.log('  Password: admin123');
    console.log('');
    console.log('Learner Portal (http://localhost:5173):');
    console.log('  Email: learner1@example.com  (will receive: Advanced Web Dev)');
    console.log('  Email: learner2@example.com  (will receive: Data Science)');
    console.log('  Email: alice.j@example.com   (will receive: Mobile App Dev)');
    console.log('  Email: learner3@example.com  (will receive: Cybersecurity)');
    console.log('  Email: newlearner@example.com (will receive: UI/UX Design)');
    console.log('  Password (all): password123');
    console.log('');
    console.log('Dummy Server Providers:');
    console.log('  provider-a: JWS-signed credentials (webhook)');
    console.log('  provider-b: Poll-only credentials');
    console.log('  provider-c: PDF/DSC signatures');
    console.log('═'.repeat(60));
    console.log('\nNext Steps:');
    console.log('1. Start dummy server: cd server/dummy-apisetu && npm run dev');
    console.log('2. Trigger webhook: Admin → Credential Sync → Test');
    console.log('3. Login as learner to see imported credentials\n');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
