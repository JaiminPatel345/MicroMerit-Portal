
import { mockIntegrationService } from '../modules/mock-integration/service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Rich Sync Test ---');
    
    // Find learner@example.com
    const learner = await prisma.learner.findFirst({ where: { email: 'learner@example.com' } });
    
    if (!learner) {
        console.error('Test user learner@example.com not found.');
        return;
    }

    // Force sync specifically for the new cert
    console.log(`Testing sync for user: ${learner.email} (ID: ${learner.id})`);
    
    // Clean up collision for testing
    const collisionId = `MOCK-SSC/Q8104-${learner.id}`;
    await prisma.credential.deleteMany({ where: { credential_id: collisionId } });
    console.log('Cleaned up potential collision:', collisionId);

    try {
        const result = await mockIntegrationService.syncCredentials(learner.id);
        console.log('Sync Result:', result);

        // Fetch the specific new credential (AI - Business Intelligence Analyst)
        const cert = await prisma.credential.findFirst({
            where: {
                learner_id: learner.id,
                certificate_title: 'AI - Business Intelligence Analyst'
            }
        });

        if (cert) {
            console.log('\n--- Verified Credential Metadata ---');
            console.log('Source Tag:', (cert.metadata as any).source);
            console.log('NSQF Alignment:', JSON.stringify((cert.metadata as any).ai_extracted?.nsqf_alignment || {}, null, 2));
        } else {
            console.error('New certificate not found in DB!');
        }

    } catch (e) {
        console.error('Sync Failed:', e);
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
