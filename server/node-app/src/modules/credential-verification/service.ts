import { credentialVerificationRepository } from './repository';
import { buildCanonicalJson, computeDataHash, verifyCredentialHash } from '../../utils/canonicalJson';
import { verifyBlockchainTransaction, getTransactionData } from '../../services/blockchainClient';
import { extractPdfMetadata, computePdfChecksum, stripPdfMetadata } from '../../utils/pdfMetadata';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

/**
 * Service for credential verification operations
 */

export interface VerifyCredentialParams {
    credential_id?: string;
    tx_hash?: string;
    ipfs_cid?: string;
}

export interface VerificationResult {
    status: 'VALID' | 'INVALID';
    credential?: any;
    reason?: string;
    verified_fields?: {
        hash_match: boolean;
        blockchain_verified: boolean;
        ipfs_cid_match: boolean;
        checksum_match?: boolean;
    };
}

export class CredentialVerificationService {
    /**
     * Verify a credential by any identifier (existing flow — kept)
     */
    async verifyCredential(params: VerifyCredentialParams): Promise<VerificationResult> {
        try {
            // Step 1: Determine identifier type and fetch credential
            let credential;
            let providedIpfsCid: string | undefined;
            let providedTxHash: string | undefined;

            if (params.credential_id) {
                credential = await credentialVerificationRepository.findByCredentialId(params.credential_id);
            } else if (params.tx_hash) {
                credential = await credentialVerificationRepository.findByTxHash(params.tx_hash);
                providedTxHash = params.tx_hash;
            } else if (params.ipfs_cid) {
                credential = await credentialVerificationRepository.findByIpfsCid(params.ipfs_cid);
                providedIpfsCid = params.ipfs_cid;
            }

            if (!credential) {
                throw new NotFoundError('Credential not found', 404, 'CREDENTIAL_NOT_FOUND');
            }

            logger.info('Verifying credential', {
                credential_id: credential.credential_id,
                method: params.credential_id ? 'credential_id' : params.tx_hash ? 'tx_hash' : 'ipfs_cid',
            });

            // Step 2: Get blockchain config from environment variables (same as issuance)
            const network = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
            const contract_address = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '';

            logger.info('Using blockchain config from environment', {
                credential_id: credential.credential_id,
                network,
                contract_address,
            });

            // Step 3: Rebuild canonical JSON from database fields
            const canonicalJson = buildCanonicalJson({
                credential_id: credential.credential_id,
                learner_id: credential.learner_id,
                learner_email: credential.learner_email,
                issuer_id: credential.issuer_id,
                certificate_title: credential.certificate_title,
                issued_at: new Date(credential.issued_at),
                network,
                contract_address,
                ipfs_cid: credential.ipfs_cid,
                pdf_url: credential.pdf_url,
                tx_hash: null, // tx_hash was null when hash was computed
                data_hash: null, // data_hash is always null when computing hash
            });

            // Step 4: Recompute hash and verify it matches
            const recomputedHash = computeDataHash(canonicalJson);
            const hashMatch = recomputedHash === credential.data_hash;

            logger.info('Hash verification', {
                credential_id: credential.credential_id,
                stored_hash: credential.data_hash,
                recomputed_hash: recomputedHash,
                match: hashMatch,
            });

            // Step 5: Verify blockchain transaction
            const blockchainVerified = await verifyBlockchainTransaction(credential.tx_hash || '');

            // Step 6: Verify IPFS CID if provided
            let ipfsCidMatch = true;
            if (providedIpfsCid) {
                ipfsCidMatch = providedIpfsCid === credential.ipfs_cid;
            }

            // Step 7: Determine overall validity
            if (hashMatch && blockchainVerified && ipfsCidMatch) {
                return {
                    status: 'VALID',
                    credential: {
                        credential_id: credential.credential_id,
                        learner: credential.learner ? {
                            id: credential.learner.id,
                            name: credential.learner.name,
                            email: credential.learner.email,
                        } : null,
                        learner_email: credential.learner_email,
                        issuer: {
                            id: credential.issuer.id,
                            name: credential.issuer.name,
                            type: credential.issuer.type,
                            website_url: credential.issuer.website_url,
                        },
                        certificate_title: credential.certificate_title,
                        issued_at: credential.issued_at,
                        ipfs_cid: credential.ipfs_cid,
                        pdf_url: credential.pdf_url,
                        tx_hash: credential.tx_hash,
                        data_hash: credential.data_hash,
                        status: credential.status,
                        metadata: credential.metadata,
                    },
                    verified_fields: {
                        hash_match: hashMatch,
                        blockchain_verified: blockchainVerified,
                        ipfs_cid_match: ipfsCidMatch,
                    },
                };
            } else {
                return {
                    status: 'INVALID',
                    reason: !hashMatch ? 'Hash mismatch' : !blockchainVerified ? 'Blockchain verification failed' : 'IPFS CID mismatch',
                    verified_fields: {
                        hash_match: hashMatch,
                        blockchain_verified: blockchainVerified,
                        ipfs_cid_match: ipfsCidMatch,
                    },
                };
            }
        } catch (error: any) {
            logger.error('Credential verification failed', {
                error: error.message,
                params,
            });
            throw error;
        }
    }

    /**
     * Verify a credential from an uploaded PDF file
     * 
     * Flow:
     * 1. Extract metadata from PDF Keywords field
     * 2. Strip metadata from PDF, compute checksum of clean PDF
     * 3. Verify checksum matches canonical_json.checksum from metadata
     * 4. Recompute hash of canonical JSON (with tx_hash=null, data_hash=null)
     * 5. Verify blockchain: call blockchain service to check tx_hash
     * 6. Return result
     */
    async verifyCredentialFromPdf(pdfBuffer: Buffer): Promise<VerificationResult> {
        try {
            // Step 1: Extract metadata from PDF
            const metadata = await extractPdfMetadata(pdfBuffer);

            if (!metadata) {
                return {
                    status: 'INVALID',
                    reason: 'No MicroMerit metadata found in PDF. This PDF may not be a credential issued by our platform.',
                    verified_fields: {
                        hash_match: false,
                        blockchain_verified: false,
                        ipfs_cid_match: false,
                        checksum_match: false,
                    },
                };
            }

            const { canonical_json, tx_hash, checksum: storedChecksum } = metadata;

            logger.info('Extracted PDF metadata for verification', {
                tx_hash,
                checksum: storedChecksum,
                credential_id: canonical_json?.credential_id,
            });

            // Step 2: Strip metadata from PDF and compute checksum of clean PDF
            const cleanPdf = await stripPdfMetadata(pdfBuffer);
            const recomputedChecksum = computePdfChecksum(cleanPdf);

            const checksumMatch = recomputedChecksum === storedChecksum;

            logger.info('Checksum verification', {
                stored_checksum: storedChecksum,
                recomputed_checksum: recomputedChecksum,
                match: checksumMatch,
            });

            if (!checksumMatch) {
                return {
                    status: 'INVALID',
                    reason: 'PDF checksum mismatch — the file has been modified after issuance.',
                    verified_fields: {
                        hash_match: false,
                        blockchain_verified: false,
                        ipfs_cid_match: false,
                        checksum_match: false,
                    },
                };
            }

            // Step 3: Verify blockchain transaction exists
            let blockchainVerified = false;
            if (tx_hash) {
                blockchainVerified = await verifyBlockchainTransaction(tx_hash);
            }

            // Step 4: Optionally look up credential in DB for additional info
            let credentialDetails = null;
            if (canonical_json?.credential_id) {
                try {
                    const credential = await credentialVerificationRepository.findByCredentialId(
                        canonical_json.credential_id
                    );
                    if (credential) {
                        credentialDetails = {
                            credential_id: credential.credential_id,
                            learner: credential.learner ? {
                                id: credential.learner.id,
                                name: credential.learner.name,
                                email: credential.learner.email,
                            } : null,
                            learner_email: credential.learner_email,
                            issuer: {
                                id: credential.issuer.id,
                                name: credential.issuer.name,
                                type: credential.issuer.type,
                                website_url: credential.issuer.website_url,
                            },
                            certificate_title: credential.certificate_title,
                            issued_at: credential.issued_at,
                            ipfs_cid: credential.ipfs_cid,
                            pdf_url: credential.pdf_url,
                            tx_hash: credential.tx_hash,
                            data_hash: credential.data_hash,
                            status: credential.status,
                        };
                    }
                } catch (dbError: any) {
                    logger.warn('Could not fetch credential from DB during PDF verification', {
                        credential_id: canonical_json.credential_id,
                        error: dbError.message,
                    });
                }
            }

            // Step 5: Overall result
            if (checksumMatch && blockchainVerified) {
                return {
                    status: 'VALID',
                    credential: credentialDetails || {
                        credential_id: canonical_json?.credential_id,
                        learner_email: canonical_json?.learner_email,
                        issuer_id: canonical_json?.issuer_id,
                        certificate_title: canonical_json?.certificate_title,
                        issued_at: canonical_json?.issued_at,
                        tx_hash,
                    },
                    verified_fields: {
                        hash_match: true,
                        blockchain_verified: true,
                        ipfs_cid_match: true,
                        checksum_match: true,
                    },
                };
            } else {
                return {
                    status: 'INVALID',
                    reason: !checksumMatch
                        ? 'PDF has been tampered with — checksum mismatch'
                        : 'Blockchain verification failed — transaction not found or invalid',
                    credential: credentialDetails || {
                        credential_id: canonical_json?.credential_id,
                        tx_hash,
                    },
                    verified_fields: {
                        hash_match: checksumMatch,
                        blockchain_verified: blockchainVerified,
                        ipfs_cid_match: true,
                        checksum_match: checksumMatch,
                    },
                };
            }
        } catch (error: any) {
            logger.error('PDF verification failed', {
                error: error.message,
                stack: error.stack,
            });
            throw error;
        }
    }
}

export const credentialVerificationService = new CredentialVerificationService();
