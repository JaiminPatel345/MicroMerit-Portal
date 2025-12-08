/**
 * External Credential Sync Scheduler
 * Runs sync jobs at configured intervals
 */

import { externalCredentialSyncService } from './service';
import { getAllEnabledConnectors } from './connector.factory';
import { logger } from '../../utils/logger';

class ExternalCredentialSyncScheduler {
    private intervalId: NodeJS.Timeout | null = null;
    private isRunning: boolean = false;
    private pollIntervalHours: number;
    private lastSyncAt: Date | null = null;
    private startedAt: Date | null = null;

    constructor() {
        this.pollIntervalHours = parseFloat(process.env.POLL_INTERVAL_HOURS || '1');
    }

    /**
     * Start the scheduler
     */
    start(): void {
        if (this.intervalId) {
            logger.warn('Scheduler already running');
            return;
        }

        const intervalMs = this.pollIntervalHours * 60 * 60 * 1000;
        this.startedAt = new Date();

        logger.info(`Starting external credential sync scheduler`, {
            interval_hours: this.pollIntervalHours,
            interval_ms: intervalMs,
        });

        // Run initial sync after a short delay
        setTimeout(() => {
            this.runSyncJob();
        }, 5000);

        // Schedule recurring syncs
        this.intervalId = setInterval(() => {
            this.runSyncJob();
        }, intervalMs);

        logger.info('Scheduler started');
    }

    /**
     * Stop the scheduler
     */
    stop(): void {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
            this.startedAt = null;
            logger.info('Scheduler stopped');
        }
    }

    /**
     * Run a sync job for all providers
     */
    async runSyncJob(): Promise<void> {
        if (this.isRunning) {
            logger.warn('Sync job already running, skipping');
            return;
        }

        const connectors = getAllEnabledConnectors();
        if (connectors.length === 0) {
            logger.info('No enabled connectors configured, skipping sync');
            return;
        }

        this.isRunning = true;
        logger.info(`Starting scheduled sync job for ${connectors.length} providers`);

        try {
            const results = await externalCredentialSyncService.syncAll();
            this.lastSyncAt = new Date();

            const summary = {
                providers: results.length,
                total_processed: results.reduce((sum, r) => sum + r.credentials_processed, 0),
                total_created: results.reduce((sum, r) => sum + r.credentials_created, 0),
                total_skipped: results.reduce((sum, r) => sum + r.credentials_skipped, 0),
                total_errors: results.reduce((sum, r) => sum + r.errors.length, 0),
            };

            logger.info('Scheduled sync job completed', summary);
        } catch (error: any) {
            logger.error('Scheduled sync job failed', { error: error.message });
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Check if scheduler is running
     */
    isSchedulerRunning(): boolean {
        return this.intervalId !== null;
    }

    /**
     * Get next sync time
     */
    getNextSyncTime(): Date | null {
        if (!this.lastSyncAt || !this.isSchedulerRunning()) return null;
        return new Date(this.lastSyncAt.getTime() + this.pollIntervalHours * 60 * 60 * 1000);
    }

    /**
     * Get scheduler status
     */
    getStatus(): {
        running: boolean;
        interval_hours: number;
        is_syncing: boolean;
        last_sync_at: string | null;
        next_sync_at: string | null;
        started_at: string | null;
    } {
        const nextSync = this.getNextSyncTime();
        return {
            running: this.isSchedulerRunning(),
            interval_hours: this.pollIntervalHours,
            is_syncing: this.isRunning,
            last_sync_at: this.lastSyncAt?.toISOString() || null,
            next_sync_at: nextSync?.toISOString() || null,
            started_at: this.startedAt?.toISOString() || null,
        };
    }
}

export const externalCredentialSyncScheduler = new ExternalCredentialSyncScheduler();

