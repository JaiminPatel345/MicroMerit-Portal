/**
 * Seed script for External Credential Sync testing
 * Creates issuers and learners that match the dummy API-Setu server data
 * 
 * Run: npx tsx prisma/seed_sync_test.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding test data for credential sync...\n');

    // Create test issuers matching dummy server providers
    const issuers = [
        {
            name: 'NSDC Provider A (Webhook)',
            email: 'provider-a@nsdc-test.gov.in',
            type: 'government',
            status: 'approved',
            registry_id: 'provider-a', // Matches dummy server
            accept_external: true,
            reissue_local_vc: false,
        },
        {
            name: 'NSDC Provider B (Poll)',
            email: 'provider-b@nsdc-test.gov.in',
            type: 'government',
            status: 'approved',
            registry_id: 'provider-b', // Matches dummy server
            accept_external: true,
            reissue_local_vc: false,
        },
        {
            name: 'NSDC Provider C (PDF)',
            email: 'provider-c@nsdc-test.gov.in',
            type: 'government',
            status: 'approved',
            registry_id: 'provider-c', // Matches dummy server
            accept_external: true,
            reissue_local_vc: false,
        },
    ];

    console.log('Creating test issuers...');
    for (const issuerData of issuers) {
        const existing = await prisma.issuer.findUnique({
            where: { email: issuerData.email },
        });

        if (existing) {
            await prisma.issuer.update({
                where: { email: issuerData.email },
                data: {
                    registry_id: issuerData.registry_id,
                    accept_external: issuerData.accept_external,
                    reissue_local_vc: issuerData.reissue_local_vc,
                },
            });
            console.log(`  ✓ Updated: ${issuerData.name} (registry_id: ${issuerData.registry_id})`);
        } else {
            await prisma.issuer.create({
                data: issuerData,
            });
            console.log(`  ✓ Created: ${issuerData.name} (registry_id: ${issuerData.registry_id})`);
        }
    }

    // Create test learners matching dummy server credentials
    const learners = [
        {
            email: 'learner1@example.com',
            name: 'John Doe',
            phone: '+919876543211',
            other_emails: [],
        },
        {
            email: 'learner2@example.com',
            name: 'Jane Smith',
            phone: '+919876543212',
            other_emails: ['other.email@example.com'], // Matches cred-a-003
        },
        {
            email: 'learner3@example.com',
            name: 'Diana Prince',
            phone: '+919876543213',
            other_emails: [],
        },
        {
            // This learner will match by phone
            email: 'alice.j@example.com',
            name: 'Alice Johnson',
            phone: '+919876543210', // Matches cred-b-001
            other_emails: [],
        },
    ];

    console.log('\nCreating test learners...');
    for (const learnerData of learners) {
        const existing = await prisma.learner.findUnique({
            where: { email: learnerData.email },
        });

        if (existing) {
            console.log(`  - Skipped: ${learnerData.name} (already exists)`);
        } else {
            await prisma.learner.create({
                data: learnerData,
            });
            console.log(`  ✓ Created: ${learnerData.name} (${learnerData.email})`);
        }
    }

    console.log('\n✅ Seed complete!\n');
    console.log('Test Data Summary:');
    console.log('─'.repeat(50));
    console.log('Issuers:');
    console.log('  • provider-a: Webhook-enabled, sends JWS-signed credentials');
    console.log('  • provider-b: Poll-only with pagination');
    console.log('  • provider-c: PDF/DSC signatures');
    console.log('\nLearners (for matching):');
    console.log('  • learner1@example.com → matches cred-a-001');
    console.log('  • learner2@example.com → matches cred-a-002');
    console.log('  • other.email@example.com (secondary) → matches cred-a-003');
    console.log('  • +919876543210 (phone) → matches cred-b-001');
    console.log('  • learner3@example.com → matches cred-c-001');
    console.log('\nTo test:');
    console.log('  1. Start dummy server: cd server/dummy-apisetu && npm run dev');
    console.log('  2. In admin panel, go to Credential Sync → Test tab');
    console.log('  3. Click "Trigger Test Webhook"');
    console.log('  4. Check the Credentials tab to see the imported credential\n');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
