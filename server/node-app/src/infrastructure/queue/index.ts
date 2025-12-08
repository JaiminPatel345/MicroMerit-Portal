/**
 * Redis and BullMQ Queue Configuration
 * Handles job queues for credential processing, polling, and reconciliation
 */

import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { redisConfig } from '../config/feature-flags';
import { logger } from '../../utils/logger';

// Redis connection instance
let redisConnection: Redis | null = null;

/**
 * Get or create Redis connection
 */
export function getRedisConnection(): Redis {
    if (!redisConnection) {
        redisConnection = new Redis(redisConfig.url, {
            maxRetriesPerRequest: null, // Required for BullMQ
            enableReadyCheck: false,
        });

        redisConnection.on('error', (err: Error) => {
            logger.error('Redis connection error:', err);
        });

        redisConnection.on('connect', () => {
            logger.info('Redis connected successfully');
        });
    }
    return redisConnection;
}

/**
 * Queue names for external credential sync
 */
export const QUEUE_NAMES = {
    CREDENTIAL_PROCESSING: 'external-credential-processing',
    REGISTRY_WATCHER: 'registry-watcher',
    CREDENTIAL_POLLING: 'credential-polling',
    RECONCILIATION: 'reconciliation',
    BLOCKCHAIN_ANCHOR: 'blockchain-anchor',
} as const;

/**
 * Job types for credential processing
 */
export interface CredentialProcessingJob {
    type: 'webhook' | 'poll';
    provider: string;
    issuerId: number;
    payload: unknown;
    idempotencyKey: string;
    signatureHeader?: string;
}

export interface PollingJob {
    issuerId: number;
    provider: string;
    cursor?: string;
    since?: string;
    fullSync?: boolean;
}

export interface ReconciliationJob {
    issuerId?: number; // If not provided, reconcile all stale issuers
}

export interface BlockchainAnchorJob {
    externalCredentialId: string;
    dataHash: string;
    anchorKey: string;
}

// Queue instances
let credentialProcessingQueue: Queue<CredentialProcessingJob> | null = null;
let pollingQueue: Queue<PollingJob> | null = null;
let reconciliationQueue: Queue<ReconciliationJob> | null = null;
let blockchainAnchorQueue: Queue<BlockchainAnchorJob> | null = null;

/**
 * Initialize all queues
 */
export function initializeQueues(): {
    credentialProcessing: Queue<CredentialProcessingJob>;
    polling: Queue<PollingJob>;
    reconciliation: Queue<ReconciliationJob>;
    blockchainAnchor: Queue<BlockchainAnchorJob>;
} {
    const connection = getRedisConnection();

    if (!credentialProcessingQueue) {
        credentialProcessingQueue = new Queue<CredentialProcessingJob>(
            QUEUE_NAMES.CREDENTIAL_PROCESSING,
            { connection }
        );
    }

    if (!pollingQueue) {
        pollingQueue = new Queue<PollingJob>(QUEUE_NAMES.CREDENTIAL_POLLING, {
            connection,
        });
    }

    if (!reconciliationQueue) {
        reconciliationQueue = new Queue<ReconciliationJob>(
            QUEUE_NAMES.RECONCILIATION,
            { connection }
        );
    }

    if (!blockchainAnchorQueue) {
        blockchainAnchorQueue = new Queue<BlockchainAnchorJob>(
            QUEUE_NAMES.BLOCKCHAIN_ANCHOR,
            { connection }
        );
    }

    logger.info('BullMQ queues initialized');

    return {
        credentialProcessing: credentialProcessingQueue,
        polling: pollingQueue,
        reconciliation: reconciliationQueue,
        blockchainAnchor: blockchainAnchorQueue,
    };
}

/**
 * Get credential processing queue
 */
export function getCredentialProcessingQueue(): Queue<CredentialProcessingJob> {
    if (!credentialProcessingQueue) {
        initializeQueues();
    }
    return credentialProcessingQueue!;
}

/**
 * Get polling queue
 */
export function getPollingQueue(): Queue<PollingJob> {
    if (!pollingQueue) {
        initializeQueues();
    }
    return pollingQueue!;
}

/**
 * Get reconciliation queue
 */
export function getReconciliationQueue(): Queue<ReconciliationJob> {
    if (!reconciliationQueue) {
        initializeQueues();
    }
    return reconciliationQueue!;
}

/**
 * Get blockchain anchor queue
 */
export function getBlockchainAnchorQueue(): Queue<BlockchainAnchorJob> {
    if (!blockchainAnchorQueue) {
        initializeQueues();
    }
    return blockchainAnchorQueue!;
}

/**
 * Schedule recurring jobs (polling, reconciliation)
 */
export async function scheduleRecurringJobs(): Promise<void> {
    const pollingQ = getPollingQueue();
    const reconciliationQ = getReconciliationQueue();

    // Schedule daily reconciliation at 3 AM
    await reconciliationQ.add(
        'daily-reconciliation',
        {},
        {
            repeat: {
                pattern: '0 3 * * *', // Cron: 3 AM daily
            },
            jobId: 'daily-reconciliation',
        }
    );

    logger.info('Recurring jobs scheduled');
}

/**
 * Close all queue connections
 */
export async function closeQueues(): Promise<void> {
    const queues = [
        credentialProcessingQueue,
        pollingQueue,
        reconciliationQueue,
        blockchainAnchorQueue,
    ];

    await Promise.all(
        queues.filter(Boolean).map((q) => q!.close())
    );

    if (redisConnection) {
        await redisConnection.quit();
        redisConnection = null;
    }

    logger.info('All queues closed');
}
