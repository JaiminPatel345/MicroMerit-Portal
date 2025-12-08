/**
 * Credential Processing Worker
 * Processes jobs from the credential processing queue
 * 
 * Run: npx tsx src/workers/credential-worker.ts
 */

import { Worker } from 'bullmq';
import { getRedisConnection, QUEUE_NAMES, CredentialProcessingJob } from '../infrastructure/queue';
import { processCredential } from '../modules/external-credential-sync/processing/credential-processor';
import { getConnector, RawProviderCredential } from '../modules/external-credential-sync/connectors';
import { logger } from '../utils/logger';

async function startWorker() {
    const connection = getRedisConnection();

    const worker = new Worker<CredentialProcessingJob>(
        QUEUE_NAMES.CREDENTIAL_PROCESSING,
        async (job) => {
            logger.info(`Processing job ${job.id}: ${job.data.provider} credential`);

            const { provider, issuerId, payload, idempotencyKey } = job.data;

            // Convert payload to RawProviderCredential
            const rawCredential: RawProviderCredential = {
                id: (payload as any).credential_id || (payload as any).id,
                signedPayload: (payload as any).signed_credential || (payload as any).credential,
                signatureType: (payload as any).signature_type || 'JWS',
                rawData: payload as any,
            };

            const result = await processCredential(
                provider,
                issuerId,
                rawCredential,
                idempotencyKey
            );

            if (result.success) {
                logger.info(`✓ Credential processed: ${result.externalCredentialId}`);
                return { success: true, credentialId: result.externalCredentialId };
            } else {
                throw new Error(result.error || 'Processing failed');
            }
        },
        {
            connection,
            concurrency: 5,
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 50 },
        }
    );

    worker.on('completed', (job) => {
        logger.info(`Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
        logger.error(`Job ${job?.id} failed:`, err);
    });

    logger.info(`Credential processing worker started (concurrency: 5)`);

    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.info('SIGTERM received, closing worker...');
        await worker.close();
        process.exit(0);
    });

    process.on('SIGINT', async () => {
        logger.info('SIGINT received, closing worker...');
        await worker.close();
        process.exit(0);
    });
}

startWorker().catch((error) => {
    logger.error('Worker startup error:', error);
    process.exit(1);
});
