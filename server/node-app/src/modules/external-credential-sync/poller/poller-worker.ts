/**
 * Poller Worker
 * Fetches credentials from providers that don't support webhooks
 */

import { getConnector } from '../connectors';
import { externalCredentialSyncRepository } from '../repository';
import { enqueueCredentialForProcessing, generateIdempotencyKey } from '../processing/credential-processor';
import { featureFlags } from '../../../infrastructure/config/feature-flags';
import { logger } from '../../../utils/logger';

/**
 * Poll credentials for a single issuer
 */
export async function pollIssuerCredentials(
    issuerId: number,
    provider: string,
    options?: { fullSync?: boolean; cursor?: string }
): Promise<{ fetched: number; hasMore: boolean; nextCursor?: string }> {
    if (!featureFlags.externalSyncEnabled) {
        return { fetched: 0, hasMore: false };
    }

    const connector = getConnector(provider);
    if (!connector) {
        throw new Error(`Unknown provider: ${provider}`);
    }

    try {
        // Get issuer's last sync time
        const issuers = await externalCredentialSyncRepository.getIssuersForSync();
        const issuer = issuers.find(i => i.id === issuerId);

        const result = await connector.fetchCredentials(issuerId, {
            since: options?.fullSync ? undefined : issuer?.last_sync_at || undefined,
            cursor: options?.cursor,
            pageSize: 50,
            fullSync: options?.fullSync,
        });

        // Enqueue each credential for processing
        for (const credential of result.credentials) {
            const idempotencyKey = generateIdempotencyKey(provider, issuerId, credential.id);

            // Check if already processed before enqueueing
            const processed = await externalCredentialSyncRepository.isJobProcessed(idempotencyKey);
            if (!processed) {
                await enqueueCredentialForProcessing(
                    provider,
                    issuerId,
                    credential.rawData,
                    idempotencyKey
                );
            }
        }

        logger.info(`Polled ${result.credentials.length} credentials for issuer ${issuerId}`);

        return {
            fetched: result.credentials.length,
            hasMore: result.hasMore,
            nextCursor: result.nextCursor,
        };
    } catch (error) {
        logger.error(`Polling failed for issuer ${issuerId}:`, error);
        throw error;
    }
}

/**
 * Poll all eligible issuers
 */
export async function pollAllIssuers(): Promise<{
    issuersPolled: number;
    credentialsFetched: number
}> {
    if (!featureFlags.externalSyncEnabled) {
        return { issuersPolled: 0, credentialsFetched: 0 };
    }

    const issuers = await externalCredentialSyncRepository.getIssuersForSync({
        onlyExternal: true,
        staleThresholdHours: featureFlags.reconciliationThresholdHours,
    });

    let totalFetched = 0;
    let issuersPolled = 0;

    for (const issuer of issuers) {
        if (!issuer.registry_id) continue;

        try {
            // Determine provider (for now, assume NSDC)
            const provider = 'nsdc';

            let hasMore = true;
            let cursor: string | undefined;

            while (hasMore) {
                const result = await pollIssuerCredentials(issuer.id, provider, { cursor });
                totalFetched += result.fetched;
                hasMore = result.hasMore;
                cursor = result.nextCursor;
            }

            issuersPolled++;
        } catch (error) {
            logger.error(`Failed to poll issuer ${issuer.id}:`, error);
        }
    }

    return { issuersPolled, credentialsFetched: totalFetched };
}

/**
 * Run reconciliation for stale issuers
 */
export async function runReconciliation(): Promise<void> {
    logger.info('Starting reconciliation job');

    const result = await pollAllIssuers();

    logger.info(`Reconciliation complete: ${result.issuersPolled} issuers, ${result.credentialsFetched} credentials`);
}
