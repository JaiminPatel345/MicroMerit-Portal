/**
 * Controller for External Credential Sync admin endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { externalCredentialSyncService } from './service';
import { externalCredentialSyncScheduler } from './scheduler';
import { getProviderConfigs } from './connector.factory';
import { logger } from '../../utils/logger';

class ExternalCredentialSyncController {
    /**
     * GET /admin/external-sync/status
     * Get sync status for all providers
     */
    async getStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const schedulerStatus = externalCredentialSyncScheduler.getStatus();
            const providerConfigs = getProviderConfigs();
            const syncStates = externalCredentialSyncService.getSyncStatus();

            res.json({
                success: true,
                data: {
                    scheduler: schedulerStatus,
                    providers: providerConfigs.map(config => ({
                        id: config.id,
                        name: config.name,
                        enabled: config.enabled,
                        has_issuer: config.issuer_id > 0,
                        sync_state: syncStates.find(s => s.provider_id === config.id),
                    })),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /admin/external-sync/trigger
     * Manually trigger sync for all providers or a specific one
     */
    async triggerSync(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const { provider_id } = req.body;

            logger.info('Manual sync triggered', { provider_id: provider_id || 'all' });

            let results;
            if (provider_id) {
                const result = await externalCredentialSyncService.syncProvider(provider_id);
                results = [result];
            } else {
                results = await externalCredentialSyncService.syncAll();
            }

            res.json({
                success: true,
                message: `Sync completed for ${results.length} provider(s)`,
                data: results,
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /admin/external-sync/scheduler/start
     * Start the scheduler
     */
    async startScheduler(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            externalCredentialSyncScheduler.start();
            res.json({
                success: true,
                message: 'Scheduler started',
                data: externalCredentialSyncScheduler.getStatus(),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * POST /admin/external-sync/scheduler/stop
     * Stop the scheduler
     */
    async stopScheduler(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            externalCredentialSyncScheduler.stop();
            res.json({
                success: true,
                message: 'Scheduler stopped',
                data: externalCredentialSyncScheduler.getStatus(),
            });
        } catch (error) {
            next(error);
        }
    }

    /**
     * GET /admin/external-sync/providers
     * Get list of configured providers
     */
    async getProviders(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const configs = getProviderConfigs();
            res.json({
                success: true,
                data: configs.map(c => ({
                    id: c.id,
                    name: c.name,
                    enabled: c.enabled,
                    auth_type: c.auth_type,
                    issuer_id: c.issuer_id,
                    base_url: c.base_url,
                })),
            });
        } catch (error) {
            next(error);
        }
    }
}

export const externalCredentialSyncController = new ExternalCredentialSyncController();
