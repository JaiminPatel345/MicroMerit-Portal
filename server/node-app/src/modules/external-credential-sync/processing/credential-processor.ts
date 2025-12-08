/**
 * Credential Processor
 * Main processing pipeline for external credentials
 */

import { externalCredentialSyncRepository } from '../repository';
import { getConnector, CanonicalCredential, RawProviderCredential } from '../connectors';
import { matchCredentialToLearner, MatchResult } from '../matching/matching-engine';
import { encryptJson } from '../../../infrastructure/kms';
import { getCredentialProcessingQueue } from '../../../infrastructure/queue';
import { featureFlags } from '../../../infrastructure/config/feature-flags';
import { logger } from '../../../utils/logger';

export interface ProcessingResult {
    success: boolean;
    externalCredentialId?: string;
    matchResult?: MatchResult;
    error?: string;
    skipped?: boolean;
    skipReason?: string;
}

/**
 * Process a single credential from queue
 */
export async function processCredential(
    provider: string,
    issuerId: number,
    rawCredential: RawProviderCredential,
    idempotencyKey: string
): Promise<ProcessingResult> {
    try {
        // 1. Check idempotency
        const alreadyProcessed = await externalCredentialSyncRepository.isJobProcessed(idempotencyKey);
        if (alreadyProcessed) {
            logger.info(`Skipping duplicate job: ${idempotencyKey}`);
            return { success: true, error: 'Already processed' };
        }

        // 2. Get connector and verify signature
        const connector = getConnector(provider);
        if (!connector) {
            throw new Error(`Unknown provider: ${provider}`);
        }

        const verificationResult = await connector.verify(rawCredential);
        if (!verificationResult.verified) {
            throw new Error(`Signature verification failed: ${verificationResult.error}`);
        }

        // 3. Normalize to canonical format
        const canonical = connector.normalize(rawCredential);

        // 4. Encrypt raw payload
        const encryptedPayload = rawCredential.rawData
            ? await encryptJson(rawCredential.rawData)
            : null;

        // 5. Match learner
        const matchResult = await matchCredentialToLearner(canonical);

        // 6. Determine status based on match confidence
        const threshold = featureFlags.matchThreshold;
        const status = matchResult.confidence >= threshold ? 'verified' : 'pending';

        // 7. Create external credential
        const externalCredential = await externalCredentialSyncRepository.createExternalCredential({
            issuerId,
            providerCredentialId: canonical.providerCredentialId,
            canonicalPayload: canonical,
            rawPayloadEncrypted: encryptedPayload,
            signatureVerified: verificationResult.verified,
            verificationMethod: verificationResult.method,
            status,
            learnerId: matchResult.learnerId || undefined,
            matchConfidence: matchResult.confidence,
        });

        // 8. Update issuer last_sync_at
        await externalCredentialSyncRepository.updateIssuerLastSync(issuerId);

        // 9. Mark job as processed
        await externalCredentialSyncRepository.markJobProcessed(idempotencyKey);

        logger.info(`✓ External credential processed: ${externalCredential.id}`);
        return { success: true, externalCredentialId: externalCredential.id, matchResult };
    } catch (error: any) {
        logger.error(`Credential processing failed:`, error);

        // Add to DLQ
        try {
            await externalCredentialSyncRepository.addToDLQ({
                jobType: 'credential_processing',
                jobId: idempotencyKey,
                reason: error.message,
                payload: { provider, rawCredential },
            });
        } catch (dlqError) {
            logger.error(`Failed to add to DLQ:`, dlqError);
        }

        return { success: false, error: error.message };
    }
}

/**
 * Enqueue credential for processing
 */
export async function enqueueCredentialForProcessing(
    provider: string,
    issuerId: number,
    payload: unknown,
    idempotencyKey: string,
    signatureHeader?: string
): Promise<void> {
    const queue = getCredentialProcessingQueue();

    await queue.add(
        'process-credential',
        {
            type: 'webhook',
            provider,
            issuerId,
            payload,
            idempotencyKey,
            signatureHeader,
        },
        {
            jobId: idempotencyKey,
            removeOnComplete: true,
            removeOnFail: false,
            attempts: featureFlags.dlqMaxRetries,
            backoff: {
                type: 'exponential',
                delay: 5000,
            },
        }
    );

    logger.info(`Enqueued credential for processing: ${idempotencyKey}`);
}

/**
 * Generate idempotency key
 */
export function generateIdempotencyKey(
    provider: string,
    issuerId: number | string,
    credentialId: string
): string {
    return `${provider}:${issuerId}:${credentialId}`;
}
