
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

    console.log('\nCase 2: Filter by Name');
    const nameResults = await employerRepository.searchCandidates({ name: 'test' });
    console.log(`Result count: ${nameResults.length}`);

    console.log('\nCase 3: Filter by Certificate Title');
    const certResults = await employerRepository.searchCandidates({ certificate_title: 'Data Science' });
    console.log(`Result count: ${certResults.length}`);

    console.log('\nCase 4: Filter by Location');
    const locResults = await employerRepository.searchCandidates({ location: 'India' });
    console.log(`Result count: ${locResults.length}`);

    console.log('\nCase 5: Filter by Skills "Java"');
    const javaResults = await employerRepository.searchCandidates({ skills: ['Java'] });
    console.log(`Result count: ${javaResults.length}`);

    console.log('\nCase 6: Filter by Issuer');
    const issuerResults = await employerRepository.searchCandidates({ issuer: 'test' });
    console.log(`Result count: ${issuerResults.length}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
