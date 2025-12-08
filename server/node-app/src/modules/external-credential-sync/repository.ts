/**
 * Repository for External Credential Sync
 * Handles database operations for sync state and credential deduplication
 */

import { PrismaClient } from '@prisma/client';
import { SyncState } from './types';

const prisma = new PrismaClient();

// In-memory sync state (in production, this could be stored in Redis or the database)
const syncStates: Map<string, SyncState> = new Map();

class ExternalCredentialSyncRepository {
    /**
     * Get sync state for a provider
     */
    getSyncState(providerId: string): SyncState | undefined {
        return syncStates.get(providerId);
    }

    /**
     * Update sync state for a provider
     */
    updateSyncState(state: SyncState): void {
        syncStates.set(state.provider_id, state);
    }

    /**
     * Get last sync timestamp for a provider
     * Returns epoch if never synced
     */
    getLastSyncTimestamp(providerId: string): Date {
        const state = syncStates.get(providerId);
        return state?.last_successful_sync_at || new Date(0);
    }

    /**
     * Check if a credential already exists by external ID
     */
    async credentialExistsByExternalId(externalId: string): Promise<boolean> {
        const credential = await prisma.credential.findFirst({
            where: {
                metadata: {
                    path: ['external_id'],
                    equals: externalId,
                },
            },
        });
        return !!credential;
    }

    /**
     * Check if a credential exists for the same learner, title, and issuer
     */
    async credentialExists(
        learnerEmail: string,
        certificateTitle: string,
        issuerId: number
    ): Promise<boolean> {
        const credential = await prisma.credential.findFirst({
            where: {
                learner_email: learnerEmail,
                certificate_title: certificateTitle,
                issuer_id: issuerId,
            },
        });
        return !!credential;
    }

    /**
     * Find learner by email
     */
    async findLearnerByEmail(email: string) {
        return await prisma.learner.findFirst({
            where: {
                OR: [
                    { email },
                    { other_emails: { has: email } },
                ],
            },
        });
    }

    /**
     * Find issuer by ID
     */
    async findIssuerById(id: number) {
        return await prisma.issuer.findUnique({
            where: { id },
        });
    }

    /**
     * Get all sync states
     */
    getAllSyncStates(): SyncState[] {
        return Array.from(syncStates.values());
    }

    /**
     * Clear sync state (for testing)
     */
    clearSyncState(providerId?: string): void {
        if (providerId) {
            syncStates.delete(providerId);
        } else {
            syncStates.clear();
        }
    }
}

export const externalCredentialSyncRepository = new ExternalCredentialSyncRepository();
