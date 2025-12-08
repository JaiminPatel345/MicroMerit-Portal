
import { mockIntegrationService } from '../modules/mock-integration/service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Sync Test ---');
    
    // Find learner@example.com
    const learner = await prisma.learner.findFirst({ where: { email: 'learner@example.com' } });
    
    if (!learner) {
        console.error('Test user learner@example.com not found.');
        return;
    }

    console.log(`Testing sync for user: ${learner.email} (ID: ${learner.id})`);
    
    // Clear credentials for this user to force re-sync of the new one
    // await prisma.credential.deleteMany({ where: { learner_id: learner.id } }); // Optional: uncomment if needed
    // Actually, sync checks existence by ID. The new one is new, so it should just work.

    try {
        const result = await mockIntegrationService.syncCredentials(learner.id);
        console.log('Sync Result:', result);
    } catch (e) {
        console.error('Sync Failed:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
