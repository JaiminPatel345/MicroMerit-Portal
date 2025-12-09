import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import Redis from 'ioredis';
import { logger } from '../utils/logger';
import axios from 'axios';
import { credentialIssuanceRepository } from '../modules/credential-issuance/repository';

const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3001';

// Redis connection configuration
const redisConnection = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null, // Required for BullMQ
    enableReadyCheck: false,
});

export interface BlockchainJobData {
    credential_id: string;
    data_hash: string;
    ipfs_cid: string;
}

export interface BlockchainWriteResult {
    tx_hash: string;
    network: string;
    contract_address: string;
    timestamp: Date;
}

// Create the blockchain queue
export const blockchainQueue = new Queue<BlockchainJobData>('blockchain-writes', {
    connection: redisConnection,
    defaultJobOptions: {
        attempts: 3, // Retry up to 3 times on failure
        backoff: {
            type: 'exponential',
            delay: 5000, // Start with 5 second delay, then exponentially increase
        },
        removeOnComplete: {
            age: 86400, // Keep completed jobs for 24 hours
            count: 1000, // Keep max 1000 completed jobs
        },
        removeOnFail: {
            age: 604800, // Keep failed jobs for 7 days
        },
    },
});

// Create queue events listener for monitoring
const queueEvents = new QueueEvents('blockchain-writes', {
    connection: redisConnection.duplicate(),
});

// Monitor queue events
queueEvents.on('completed', ({ jobId }) => {
    logger.info('Blockchain job completed', { jobId });
});

queueEvents.on('failed', ({ jobId, failedReason }) => {
    logger.error('Blockchain job failed', { jobId, failedReason });
});

/**
 * Process blockchain write jobs
 */
async function processBlockchainJob(job: Job<BlockchainJobData>): Promise<BlockchainWriteResult> {
    const { credential_id, data_hash, ipfs_cid } = job.data;

    // For external credentials without IPFS uploads, use a placeholder
    const effectiveIpfsCid = (!ipfs_cid || ipfs_cid.trim() === '')
        ? 'external-credential-no-ipfs'
        : ipfs_cid;

    logger.info('Processing blockchain job', {
        jobId: job.id,
        credential_id,
        attempt: job.attemptsMade + 1,
        maxAttempts: job.opts.attempts,
    });

    try {
        const response = await axios.post(
            `${BLOCKCHAIN_SERVICE_URL}/blockchain/write`,
            {
                credential_id,
                data_hash,
                ipfs_cid: effectiveIpfsCid,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                },
                timeout: 60000, // 60 second timeout
            }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Blockchain write failed');
        }

        const result: BlockchainWriteResult = response.data.data;

        logger.info('Blockchain write successful', {
            jobId: job.id,
            credential_id,
            tx_hash: result.tx_hash,
        });

        // Update credential with blockchain info
        await credentialIssuanceRepository.updateCredential(credential_id, {
            tx_hash: result.tx_hash,
            metadata: {
                blockchain_status: 'confirmed',
            },
        });

        logger.info('Credential updated with blockchain info', {
            jobId: job.id,
            credential_id,
            tx_hash: result.tx_hash,
        });

        return result;

    } catch (error: any) {
        logger.error('Blockchain job processing failed', {
            jobId: job.id,
            credential_id,
            error: error.message,
            attempt: job.attemptsMade + 1,
        });

        // If this was the last attempt, update credential status to failed
        if (job.attemptsMade + 1 >= (job.opts.attempts || 1)) {
            try {
                await credentialIssuanceRepository.updateCredential(credential_id, {
                    metadata: {
                        blockchain_status: 'failed',
                        blockchain_error: error.message,
                    },
                });
                logger.error('Credential blockchain status set to failed after max retries', {
                    credential_id,
                });
            } catch (updateError: any) {
                logger.error('Failed to update credential status to failed', {
                    credential_id,
                    error: updateError.message,
                });
            }
        }

        throw error; // Re-throw to let BullMQ handle retries
    }
}

// Create the worker to process jobs
export const blockchainWorker = new Worker<BlockchainJobData, BlockchainWriteResult>(
    'blockchain-writes',
    processBlockchainJob,
    {
        connection: redisConnection.duplicate(),
        concurrency: 5, // Process up to 5 jobs concurrently
        limiter: {
            max: 10, // Maximum 10 jobs
            duration: 1000, // per second
        },
    }
);

// Worker event handlers
blockchainWorker.on('completed', (job) => {
    logger.info('Worker completed job', {
        jobId: job.id,
        credential_id: job.data.credential_id,
    });
});

blockchainWorker.on('failed', (job, err) => {
    logger.error('Worker failed job', {
        jobId: job?.id,
        credential_id: job?.data.credential_id,
        error: err.message,
    });
});

blockchainWorker.on('error', (err) => {
    logger.error('Worker error', { error: err.message });
});

/**
 * Add a blockchain write job to the queue
 */
export async function queueBlockchainWrite(
    credential_id: string,
    data_hash: string,
    ipfs_cid: string = ''
): Promise<string> {
    try {
        const job = await blockchainQueue.add(
            'write',
            {
                credential_id,
                data_hash,
                ipfs_cid,
            },
            {
                jobId: `blockchain-${credential_id}`, // Use credential_id as jobId to prevent duplicates
            }
        );

        logger.info('Blockchain write job queued', {
            jobId: job.id,
            credential_id,
            queueSize: await blockchainQueue.count(),
        });

        return job.id || credential_id;

    } catch (error: any) {
        logger.error('Failed to queue blockchain write', {
            credential_id,
            error: error.message,
        });
        throw error;
    }
}

/**
 * Get job status by credential ID
 */
export async function getBlockchainJobStatus(credential_id: string): Promise<{
    status: string;
    progress?: number;
    result?: BlockchainWriteResult;
    error?: string;
}> {
    const jobId = `blockchain-${credential_id}`;
    const job = await blockchainQueue.getJob(jobId);

    if (!job) {
        return { status: 'not_found' };
    }

    const state = await job.getState();
    const progress = job.progress;

    if (state === 'completed') {
        return {
            status: 'completed',
            result: job.returnvalue,
        };
    } else if (state === 'failed') {
        return {
            status: 'failed',
            error: job.failedReason,
        };
    } else {
        return {
            status: state,
            progress: typeof progress === 'number' ? progress : undefined,
        };
    }
}

/**
 * Gracefully shutdown queue and worker
 */
export async function shutdownBlockchainQueue(): Promise<void> {
    logger.info('Shutting down blockchain queue and worker...');
    
    await blockchainWorker.close();
    await blockchainQueue.close();
    await queueEvents.close();
    
    redisConnection.disconnect();
    
    logger.info('Blockchain queue shutdown complete');
}

// Handle process termination
process.on('SIGTERM', async () => {
    await shutdownBlockchainQueue();
});

process.on('SIGINT', async () => {
    await shutdownBlockchainQueue();
});

logger.info('Blockchain queue service initialized', {
    redisHost: process.env.REDIS_HOST || 'localhost',
    redisPort: process.env.REDIS_PORT || '6379',
});
