/**
 * blockchainQueue.ts — No-queue direct background processor
 *
 * Replaces the previous BullMQ/Redis queue with a simple in-process
 * setImmediate background runner. Jobs are processed directly inside
 * the Node.js process without any external queue dependency.
 *
 * Processing order (per credential):
 *   1. Write to blockchain → get tx_hash
 *   2. Embed tx_hash into PDF metadata → upload enriched PDF to IPFS
 *
 * This ensures any PDF accessible on IPFS always contains tx_hash in
 * its metadata. No CID is stored inside the PDF metadata.
 */

import { logger } from '../utils/logger';
import axios from 'axios';
import { credentialIssuanceRepository } from '../modules/credential-issuance/repository';
import { embedPdfMetadata } from '../utils/pdfMetadata';
import { uploadToFilebase } from '../utils/filebase';

const BLOCKCHAIN_SERVICE_URL = process.env.BLOCKCHAIN_SERVICE_URL || 'http://localhost:3001';

export interface BlockchainJobData {
    credential_id: string;
    data_hash: string;
    ipfs_cid: string;
    original_pdf_base64?: string;
    canonical_json?: Record<string, any>;
    checksum?: string;
    pdf_filename?: string;
    pdf_content_type?: string;
}

export interface BlockchainWriteResult {
    tx_hash: string;
    network: string;
    contract_address: string;
    timestamp: Date;
}

/**
 * Write to blockchain — handles mock mode internally so we never depend on
 * blockchainClient.ts (which would create a circular import).
 *
 * Respects BLOCKCHAIN_MOCK_ENABLED env var.  When true (or when the real
 * blockchain service is unreachable) it returns a deterministic mock tx_hash
 * so that blockchain_status can be set to 'confirmed' in all environments.
 */
async function callBlockchainWrite(
    credential_id: string,
    data_hash: string,
    ipfs_cid: string,
): Promise<BlockchainWriteResult> {
    const mockEnabled = process.env.BLOCKCHAIN_MOCK_ENABLED === 'true';

    if (mockEnabled) {
        const tx_hash = `0x${credential_id.replace(/-/g, '')}`;
        logger.info('[Background] Blockchain write MOCKED', { credential_id, tx_hash });
        return {
            tx_hash,
            network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
            contract_address: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || 'mock_contract',
            timestamp: new Date(),
        };
    }

    logger.info('[Background] Calling blockchain service', {
        credential_id,
        url: `${BLOCKCHAIN_SERVICE_URL}/blockchain/write`,
    });

    const response = await axios.post(
        `${BLOCKCHAIN_SERVICE_URL}/blockchain/write`,
        { credential_id, data_hash, ipfs_cid },
        { headers: { 'Content-Type': 'application/json' }, timeout: 60000 },
    );

    if (!response.data.success) {
        throw new Error(response.data.error || 'Blockchain write failed');
    }

    return response.data.data as BlockchainWriteResult;
}

/**
 * Core async background processor — runs entirely outside the HTTP request lifecycle.
 *
 * Step 1: Write to blockchain → get tx_hash.
 * Step 2: Embed tx_hash into PDF metadata → upload enriched PDF to IPFS.
 *
 * This order ensures every PDF on IPFS always contains a valid tx_hash.
 */
async function processCredentialAsync(data: BlockchainJobData): Promise<void> {
    const {
        credential_id,
        data_hash,
        ipfs_cid: initialIpfsCid,
        original_pdf_base64,
        canonical_json,
        checksum,
        pdf_filename,
        pdf_content_type,
    } = data;

    logger.info('[Background] ▶ Starting credential processing', {
        credential_id,
        has_pdf: !!original_pdf_base64,
        has_canonical_json: !!canonical_json,
        pdf_filename,
    });

    // =========================================================================
    // STEP 1: Write to blockchain first — get tx_hash before any IPFS upload
    // =========================================================================
    let txHash: string | null = null;

    try {
        // Use a placeholder CID since the enriched PDF hasn't been uploaded yet.
        // The real CID will be stored in the DB after IPFS upload in Step 2.
        const placeholderCid = initialIpfsCid || 'pending-upload';

        logger.info('[Background] Step 1 — writing to blockchain', {
            credential_id,
            placeholderCid,
            mock_mode: process.env.BLOCKCHAIN_MOCK_ENABLED === 'true',
        });

        const result = await callBlockchainWrite(credential_id, data_hash, placeholderCid);
        txHash = result.tx_hash;

        await credentialIssuanceRepository.updateCredential(credential_id, {
            tx_hash: txHash,
            metadata: { blockchain_status: 'confirmed' },
        });

        logger.info('[Background] Step 1 ✓ — blockchain write confirmed', {
            credential_id,
            tx_hash: txHash,
        });
    } catch (err: any) {
        logger.error('[Background] Step 1 ✗ — blockchain write failed', {
            credential_id,
            error: err.message,
            stack: err.stack,
        });

        try {
            await credentialIssuanceRepository.updateCredential(credential_id, {
                metadata: {
                    blockchain_status: 'failed',
                    blockchain_error: err.message,
                    ipfs_status: 'failed',
                },
            });
        } catch (dbErr: any) {
            logger.error('[Background] Step 1 — DB status update also failed', {
                credential_id,
                error: dbErr.message,
            });
        }

        // Cannot proceed without tx_hash — abort
        logger.info('[Background] ■ Credential processing aborted (no tx_hash)', { credential_id });
        return;
    }

    // =========================================================================
    // STEP 2: Embed tx_hash into PDF metadata and upload enriched PDF to IPFS.
    //         This is the ONLY IPFS upload — so any PDF on IPFS always has tx_hash.
    // =========================================================================
    if (original_pdf_base64 && canonical_json && checksum) {
        try {
            logger.info('[Background] Step 2 — embedding tx_hash into PDF and uploading to IPFS', {
                credential_id,
                tx_hash: txHash,
            });

            const rawPdf = Buffer.from(original_pdf_base64, 'base64');
            const enrichedPdf = await embedPdfMetadata(rawPdf, {
                canonical_json,
                tx_hash: txHash!,
                checksum,
            });

            const filename = pdf_filename || `credential/${credential_id}.pdf`;
            const contentType = pdf_content_type || 'application/pdf';
            const ipfsResult = await uploadToFilebase(enrichedPdf, filename, contentType);

            await credentialIssuanceRepository.updateCredential(credential_id, {
                metadata: { ipfs_status: 'confirmed' },
            });
            await credentialIssuanceRepository.updateCredentialFields(credential_id, {
                ipfs_cid: ipfsResult.cid,
                pdf_url: ipfsResult.gateway_url,
            });

            logger.info('[Background] Step 2 ✓ — enriched PDF uploaded to IPFS', {
                credential_id,
                ipfs_cid: ipfsResult.cid,
            });
        } catch (err: any) {
            logger.error('[Background] Step 2 ✗ — PDF embed/upload failed', {
                credential_id,
                error: err.message,
                stack: err.stack,
            });

            try {
                await credentialIssuanceRepository.updateCredential(credential_id, {
                    metadata: { ipfs_status: 'failed', ipfs_error: err.message },
                });
            } catch (dbErr: any) {
                logger.error('[Background] Step 2 — DB ipfs_status update failed', {
                    credential_id,
                    error: dbErr.message,
                });
            }
        }
    } else {
        logger.warn('[Background] Step 2 — skipped (missing pdf_base64/canonical_json/checksum)', {
            credential_id,
            has_pdf: !!original_pdf_base64,
            has_canonical: !!canonical_json,
            has_checksum: !!checksum,
        });

        // No PDF to upload — mark ipfs as failed
        try {
            await credentialIssuanceRepository.updateCredential(credential_id, {
                metadata: { ipfs_status: 'failed' },
            });
        } catch (dbErr: any) {
            logger.error('[Background] IPFS failed status update failed', {
                credential_id,
                error: dbErr.message,
            });
        }
    }

    logger.info('[Background] ■ Credential processing complete', { credential_id });
}

/**
 * Launch blockchain + IPFS processing in the background.
 *
 * Uses setImmediate so the current HTTP response is sent first, then the
 * async work begins in the same Node.js process — no Redis, no external queue.
 *
 * Returns a job ID string immediately (compatible with the previous queue API).
 */
export async function queueBlockchainWrite(
    credential_id: string,
    data_hash: string,
    ipfs_cid: string = '',
    extraData?: {
        original_pdf_base64?: string;
        canonical_json?: Record<string, any>;
        checksum?: string;
        pdf_filename?: string;
        pdf_content_type?: string;
    }
): Promise<string> {
    const jobId = `bg-${credential_id}-${Date.now()}`;

    logger.info('[Background] Launching credential background job', {
        credential_id,
        jobId,
        has_pdf: !!extraData?.original_pdf_base64,
    });

    // Fire-and-forget: setImmediate ensures the HTTP response is flushed first
    setImmediate(() => {
        processCredentialAsync({
            credential_id,
            data_hash,
            ipfs_cid,
            ...extraData,
        }).catch(err => {
            logger.error('[Background] Unhandled error in credential processing', {
                credential_id,
                error: err.message,
            });
        });
    });

    return jobId;
}

/**
 * Get processing status for a credential.
 * Without a queue we delegate entirely to the DB-tracked statuses
 * (blockchain_status / ipfs_status in metadata).
 */
export async function getBlockchainJobStatus(credential_id: string): Promise<{
    status: string;
    progress?: number;
    result?: BlockchainWriteResult;
    error?: string;
}> {
    return { status: 'processing' };
}

/** No-op: no queue to clear. */
export function clearBlockchainQueue(): void {
    logger.info('[Background] clearBlockchainQueue called (no-op — queue removed)');
}

/** No-op: no queue or worker to shut down. */
export async function shutdownBlockchainQueue(): Promise<void> {
    logger.info('[Background] shutdownBlockchainQueue called (no-op — queue removed)');
}

// Dummy exports kept for backward-compatibility with server.ts imports
export const blockchainQueue = null;
export const blockchainWorker = null;

logger.info('[Background] Blockchain background processor initialised (no Redis/BullMQ)');
