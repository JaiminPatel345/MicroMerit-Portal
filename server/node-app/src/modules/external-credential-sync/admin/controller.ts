/**
 * Admin Controller for External Credential Sync
 */

import { Request, Response } from 'express';
import { externalCredentialSyncRepository } from '../repository';
import { pollIssuerCredentials } from '../poller/poller-worker';
import { featureFlags } from '../../../infrastructure/config/feature-flags';
import { prisma } from '../../../utils/prisma';
import { logger } from '../../../utils/logger';
import { sendSuccess, sendError } from '../../../utils/response';

class AdminSyncController {
    /**
     * List issuers with external sync enabled
     * GET /admin/sync/issuers
     */
    async listIssuers(_req: Request, res: Response): Promise<void> {
        try {
            const issuers = await prisma.issuer.findMany({
                where: {
                    accept_external: true,
                },
                select: {
                    id: true,
                    name: true,
                    registry_id: true,
                    last_sync_at: true,
                    accept_external: true,
                    reissue_local_vc: true,
                    _count: {
                        select: {
                            credentials: {
                                where: {
                                    is_external: true,
                                },
                            },
                        },
                    },
                },
                orderBy: {
                    last_sync_at: 'desc',
                },
            });

            const formatted = issuers.map((issuer) => ({
                id: issuer.id,
                name: issuer.name,
                registryId: issuer.registry_id,
                lastSyncAt: issuer.last_sync_at,
                acceptExternal: issuer.accept_external,
                reissueLocalVc: issuer.reissue_local_vc,
                externalCredentialCount: issuer._count.credentials,
            }));

            sendSuccess(res, formatted, 'Issuers retrieved successfully');
        } catch (error) {
            logger.error('Failed to list issuers:', error);
            sendError(res, 'Failed to list issuers', 'Internal server error', 500);
        }
    }

    /**
     * Get sync stats
     */
    async getStats(_req: Request, res: Response): Promise<void> {
        try {
            const stats = await externalCredentialSyncRepository.getSyncStats();
            res.json({
                success: true,
                data: {
                    ...stats,
                    featureEnabled: featureFlags.externalSyncEnabled,
                    matchThreshold: featureFlags.matchThreshold,
                },
            });
        } catch (error) {
            logger.error('Failed to get stats:', error);
            res.status(500).json({ success: false, error: 'Failed to get stats' });
        }
    }

    /**
     * List external credentials
     */
    /**
     * List external credentials
     */
    async listExternalCredentials(req: Request, res: Response): Promise<void> {
        try {
            const { status, issuerId, limit = '50', offset = '0' } = req.query;

            const credentials = await prisma.credential.findMany({
                where: {
                    is_external: true,
                    ...(status && { status: status as string }),
                    ...(issuerId && { issuer_id: parseInt(issuerId as string) }),
                },
                take: parseInt(limit as string),
                skip: parseInt(offset as string),
                orderBy: { createdAt: 'desc' },
                include: {
                    issuer: { select: { name: true } },
                    learner: { select: { name: true, email: true } },
                },
            });

            const formatted = credentials.map(c => ({
                id: c.id,
                providerCredentialId: c.provider_credential_id,
                status: c.status,
                signatureVerified: c.signature_verified,
                verificationMethod: c.verification_method,
                matchConfidence: c.match_confidence,
                issuer: c.issuer.name,
                learner: c.learner ? { name: c.learner.name, email: c.learner.email } : null,
                createdAt: c.createdAt,
                processedAt: c.processed_at,
            }));

            sendSuccess(res, formatted);
        } catch (error) {
            logger.error('Failed to list external credentials:', error);
            sendError(res, 'Failed to list credentials', 'Internal server error', 500);
        }
    }

    /**
     * List DLQ items
     */
    async listDLQ(req: Request, res: Response): Promise<void> {
        try {
            const { limit = '50', offset = '0' } = req.query;

            const [items, count] = await Promise.all([
                externalCredentialSyncRepository.getDLQItems({
                    limit: parseInt(limit as string),
                    offset: parseInt(offset as string),
                }),
                externalCredentialSyncRepository.getDLQCount(),
            ]);

            sendSuccess(res, { items, total: count });
        } catch (error) {
            logger.error('Failed to list DLQ:', error);
            sendError(res, 'Failed to list DLQ', 'Internal server error', 500);
        }
    }

    /**
     * Retry a DLQ item
     */
    async retryDLQItem(req: Request, res: Response): Promise<void> {
        try {
            const { id } = req.params;

            const item = await prisma.dLQ.findUnique({ where: { id } });
            if (!item) {
                sendError(res, 'DLQ item not found', 'Not Found', 404);
                return;
            }

            // Re-enqueue the job (simplified - real implementation would use queue)
            await externalCredentialSyncRepository.incrementDLQAttempts(id);

            // Remove from DLQ after retry
            await externalCredentialSyncRepository.removeDLQItem(id);

            sendSuccess(res, { message: 'Item re-queued for processing' });
        } catch (error) {
            logger.error('Failed to retry DLQ item:', error);
            sendError(res, 'Failed to retry item', 'Internal server error', 500);
        }
    }

    /**
     * Force sync for an issuer
     */
    async forceSyncIssuer(req: Request, res: Response): Promise<void> {
        try {
            const issuerId = parseInt(req.params.id);
            const { fullSync = false } = req.body;

            const issuer = await prisma.issuer.findUnique({
                where: { id: issuerId },
                select: { registry_id: true },
            });

            if (!issuer?.registry_id) {
                sendError(res, 'Issuer has no registry_id', 'Bad Request', 400);
                return;
            }

            const result = await pollIssuerCredentials(issuerId, 'nsdc', { fullSync });

            sendSuccess(res, {
                fetched: result.fetched,
                hasMore: result.hasMore,
            });
        } catch (error) {
            logger.error('Failed to force sync:', error);
            sendError(res, 'Failed to sync', 'Internal server error', 500);
        }
    }

    /**
     * List pending matches (credentials without learner_id)
     */
    async listPendingMatches(req: Request, res: Response): Promise<void> {
        try {
            const { limit = '50' } = req.query;

            const pending = await prisma.credential.findMany({
                where: {
                    learner_id: null,
                    status: 'pending',
                    is_external: true
                },
                take: parseInt(limit as string),
                orderBy: { createdAt: 'desc' },
                include: {
                    issuer: { select: { name: true } },
                },
            });

            const formatted = pending.map(p => ({
                id: p.id,
                providerCredentialId: p.provider_credential_id,
                issuer: p.issuer.name,
                matchConfidence: p.match_confidence,
                payload: p.metadata, // Using metadata instead of canonical_payload
                createdAt: p.createdAt,
            }));

            sendSuccess(res, formatted);
        } catch (error) {
            logger.error('Failed to list pending matches:', error);
            sendError(res, 'Failed to list pending matches', 'Internal server error', 500);
        }
    }
}

export const adminSyncController = new AdminSyncController();
