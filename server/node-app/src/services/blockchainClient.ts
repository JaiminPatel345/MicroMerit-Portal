import axios from 'axios';
import { logger } from '../utils/logger';
import { queueBlockchainWrite, getBlockchainJobStatus } from './blockchainQueue';

const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3001';

export interface BlockchainWriteResult {
    tx_hash: string;
    network: string;
    contract_address: string;
    timestamp: Date;
}

/**
 * Write credential data to blockchain via queue (recommended for production)
 * This queues the blockchain write job and returns immediately
 */
export async function writeToBlockchainQueued(
    credential_id: string,
    data_hash: string,
    ipfs_cid: string = ''
): Promise<string> {
    logger.info('Queueing blockchain write', {
        credential_id,
        has_ipfs: ipfs_cid && ipfs_cid.trim() !== '',
    });

    const jobId = await queueBlockchainWrite(credential_id, data_hash, ipfs_cid);

    logger.info('Blockchain write queued successfully', {
        credential_id,
        jobId,
    });

    return jobId;
}

/**
 * Write credential data to blockchain via blockchain service (synchronous)
 * @deprecated Use writeToBlockchainQueued for better performance and reliability
 * This method is kept for backward compatibility and testing
 */
export async function writeToBlockchain(
    credential_id: string,
    data_hash: string,
    ipfs_cid: string
): Promise<BlockchainWriteResult> {
    // For external credentials without IPFS uploads, use a placeholder
    // The blockchain still records the data hash for tamper detection
    const effectiveIpfsCid = (!ipfs_cid || ipfs_cid.trim() === '')
        ? 'external-credential-no-ipfs'
        : ipfs_cid;

    try {
        logger.info('Calling blockchain service - write (synchronous)', {
            credential_id,
            service_url: BLOCKCHAIN_SERVICE_URL,
            has_ipfs: ipfs_cid && ipfs_cid.trim() !== '',
        });

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
                timeout: 60000, // 60 second timeout for blockchain confirmation
            }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Blockchain write failed');
        }

        logger.info('Blockchain service write successful', {
            credential_id,
            tx_hash: response.data.data.tx_hash,
        });

        return response.data.data;
    } catch (error: any) {
        logger.error('Blockchain service write failed', {
            credential_id,
            error: error.message,
            service_url: BLOCKCHAIN_SERVICE_URL,
        });

        // If blockchain service is down or fails, throw error
        throw new Error(`Blockchain service error: ${error.message}`);
    }
}

/**
 * Get the status of a queued blockchain write job
 */
export async function getBlockchainWriteStatus(credential_id: string) {
    return await getBlockchainJobStatus(credential_id);
}

/**
 * Verify blockchain transaction via blockchain service
 */
export async function verifyBlockchainTransaction(tx_hash: string): Promise<boolean> {
    try {
        logger.info('Calling blockchain service - verify', {
            tx_hash,
            service_url: BLOCKCHAIN_SERVICE_URL,
        });

        const response = await axios.get(
            `${BLOCKCHAIN_SERVICE_URL}/blockchain/verify/${tx_hash}`,
            {
                timeout: 30000, // 30 second timeout
            }
        );

        if (!response.data.success) {
            logger.warn('Blockchain verification returned failure', {
                tx_hash,
                error: response.data.error,
            });
            return false;
        }

        const verified = response.data.data.verified;

        logger.info('Blockchain service verification complete', {
            tx_hash,
            verified,
        });

        return verified;
    } catch (error: any) {
        logger.error('Blockchain service verification failed', {
            tx_hash,
            error: error.message,
            service_url: BLOCKCHAIN_SERVICE_URL,
        });

        // Return false instead of throwing to allow graceful degradation
        return false;
    }
}
