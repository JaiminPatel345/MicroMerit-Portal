/**
 * blockchainQueue.ts — No-queue direct background processor
 *
 * Replaces the previous BullMQ/Redis queue with a simple in-process
 * setImmediate background runner. Jobs are processed directly inside
 * the Node.js process without any external queue dependency.
 *
 * Processing order (per credential):
 *   1. Upload raw PDF to IPFS → update DB (pdf_url available to user immediately)
 *   2. Write to blockchain → update DB (tx_hash + blockchain_status: confirmed)
 *   3. Embed tx_hash into PDF metadata → re-upload enriched PDF → update DB
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
 * Core async background processor — runs entirely outside the HTTP request lifecycle.
 *
 * Step 1: Upload raw PDF to IPFS first so pdf_url is available to the user ASAP.
 * Step 2: Write to blockchain.
 * Step 3: Embed tx_hash into PDF metadata and re-upload enriched version.
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

    logger.info('[Background] Starting blockchain+IPFS processing', { credential_id });

    // =========================================================================
    // STEP 1: Upload raw PDF to IPFS immediately — gives user access to the PDF
    //         before blockchain confirmation.
    // =========================================================================
    let rawCid: string | null = null;
    let rawPdfUrl: string | null = null;

    if (original_pdf_base64 && pdf_filename) {
        try {
            const rawPdf = Buffer.from(original_pdf_base64, 'base64');
            const filename = pdf_filename;
            const contentType = pdf_content_type || 'application/pdf';

            const ipfsResult = await uploadToFilebase(rawPdf, filename, contentType);
            rawCid = ipfsResult.cid;
            rawPdfUrl = ipfsResult.gateway_url;

            // Update DB so the user can access the PDF right away
            await credentialIssuanceRepository.updateCredentialFields(credential_id, {
                ipfs_cid: rawCid,
                pdf_url: rawPdfUrl,
            });

            logger.info('[Background] Raw PDF uploaded — pdf_url now available', {
                credential_id,
                ipfs_cid: rawCid,
            });
        } catch (err: any) {
            logger.error('[Background] Initial PDF upload failed', {
                credential_id,
                error: err.message,
            });
            // Continue — we still attempt the blockchain write
        }
    }

    // =========================================================================
    // STEP 2: Write to blockchain
    // =========================================================================
    let txHash: string | null = null;

    try {
        const effectiveIpfsCid = rawCid || initialIpfsCid || 'pending-issuance';

        const response = await axios.post(
            `${BLOCKCHAIN_SERVICE_URL}/blockchain/write`,
            { credential_id, data_hash, ipfs_cid: effectiveIpfsCid },
            { headers: { 'Content-Type': 'application/json' }, timeout: 60000 }
        );

        if (!response.data.success) {
            throw new Error(response.data.error || 'Blockchain write failed');
        }

        txHash = response.data.data.tx_hash;

        await credentialIssuanceRepository.updateCredential(credential_id, {
            tx_hash: txHash,
            metadata: { blockchain_status: 'confirmed' },
        });

        logger.info('[Background] Blockchain write confirmed', {
            credential_id,
            tx_hash: txHash,
        });
    } catch (err: any) {
        logger.error('[Background] Blockchain write failed', {
            credential_id,
            error: err.message,
        });

        await credentialIssuanceRepository.updateCredential(credential_id, {
            metadata: {
                blockchain_status: 'failed',
                blockchain_error: err.message,
            },
        }).catch(() => {});
    }

    // =========================================================================
    // STEP 3: If blockchain write succeeded, embed tx_hash into PDF metadata
    //         and re-upload the enriched version to IPFS.
    // =========================================================================
    if (txHash && original_pdf_base64 && canonical_json && checksum) {
        try {
            const rawPdf = Buffer.from(original_pdf_base64, 'base64');

            const enrichedPdf = await embedPdfMetadata(rawPdf, {
                canonical_json,
                tx_hash: txHash,
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

            logger.info('[Background] Enriched PDF uploaded to IPFS', {
                credential_id,
                ipfs_cid: ipfsResult.cid,
            });
        } catch (err: any) {
            logger.error('[Background] Enriched PDF IPFS upload failed', {
                credential_id,
                error: err.message,
            });

            // Keep the raw PDF url that was set in step 1; mark ipfs as failed
            await credentialIssuanceRepository.updateCredential(credential_id, {
                metadata: { ipfs_status: 'failed', ipfs_error: err.message },
            }).catch(() => {});
        }
    } else if (!txHash) {
        // Blockchain failed — we cannot embed tx_hash; mark IPFS failed only if
        // we also never managed to upload the raw PDF.
        if (!rawCid) {
            await credentialIssuanceRepository.updateCredential(credential_id, {
                metadata: { ipfs_status: 'failed' },
            }).catch(() => {});
        }
        // If rawCid is set the PDF is already reachable; ipfs_status stays 'pending'
        // and can be retried manually if needed.
    }

    logger.info('[Background] Credential processing complete', { credential_id });
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
