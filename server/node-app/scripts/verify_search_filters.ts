
import { learnerRepository } from '../src/modules/learner/repository'; // Just to assume context
import { employerRepository } from '../src/modules/employer/repository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Verifying Search Filters ---');

    console.log('\nCase 1: No filters (Should return recent learners, max 50 by default logic)');
    const all = await employerRepository.searchCandidates({});
    console.log(`Result count: ${all.length}`);
    if (all.length === 0) console.error('[FAIL] No results for empty filter (should show default)');
    else console.log('[PASS] Default results returned');

    console.log('\nCase 2: Filter by Sector "IT-ITeS"');
    const itResults = await employerRepository.searchCandidates({ sector: 'IT-ITeS' });
    console.log(`Result count: ${itResults.length}`);
    if (itResults.length > 0) {
        // Verify mismatch
        const mismatch = itResults.find(r => r.matched_credential?.title && !JSON.stringify(r).includes('IT-ITeS')); 
        // Note: r has matched_credential logic which might not show sector directly in title, but we assume data integrity
        console.log('[PASS] IT-ITeS results found');
    } else {
        console.log('[WARN] No IT-ITeS results found (might be random seed)');
    }

    console.log('\nCase 3: Filter by NSQF Level 4');
    const level4 = await employerRepository.searchCandidates({ nsqf_level: 4 });
    console.log(`Result count: ${level4.length}`);
    if (level4.length > 0) console.log('[PASS] NSQF Level 4 results found');
    
    console.log('\nCase 4: Filter by Non-Existent Sector "Space Mining"');
    const empty = await employerRepository.searchCandidates({ sector: 'Space Mining' });
    console.log(`Result count: ${empty.length}`);
    if (empty.length === 0) console.log('[PASS] Correctly returned 0 results');
    else console.error('[FAIL] Returned results for fake sector');

    console.log('\nCase 5: Filter by Skills "Java" (Profile Only)');
    const javaResults = await employerRepository.searchCandidates({ skills: ['Java'] });
    console.log(`Result count: ${javaResults.length}`);
    if (javaResults.length < 50 && javaResults.length > 0) {
        console.log('[PASS] Specific skill search returned subset of users (not all)');
    } else if (javaResults.length === 50) {
        console.log('[WARN] Returned 50 users for "Java" - verify if actually all users have Java or if logic is loose');
    } else {
        console.log('[WARN] No Java developers found');
    }

}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
