/**
 * Reset Database Script
 * Clears all data from the database
 * 
 * Run: npx tsx prisma/reset_db.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('⚠️  Resetting database...\n');

    // Delete in order to respect foreign key constraints
    const tables = [
        'ExternalCredential',
        'ProcessedJob',
        'DLQ',
        'IssuerPublicKeys',
        'Credential',
        'LearnerSkillProfile',
        'LearnerRoadmap',
        'verification_session',
        'issuer_api_key',
        'employer_activity_log',
        'employer',
        'learner',
        'issuer',
        'admin',
    ];

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
            console.log(`  ✓ Cleared ${table}`);
        } catch (error) {
            // Table might not exist yet (e.g., new tables from migration)
            console.log(`  - Skipped ${table} (doesn't exist or already empty)`);
        }
    }

    console.log('\n✅ Database reset complete!\n');
}

main()
    .catch((e) => {
        console.error('❌ Error resetting database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
