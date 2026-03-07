import { credentialVerificationRepository } from './repository';
import { buildCanonicalJson, computeDataHash } from '../../utils/canonicalJson';
import { verifyBlockchainTransaction } from '../../services/blockchainClient';
import { extractCredentialId, computePdfChecksum } from '../../utils/pdfMetadata';
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
            // ipfs_cid, pdf_url, tx_hash, and data_hash were all null at issuance time
            // when the hash was computed, so they must be null here too.
            const canonicalJson = buildCanonicalJson({
                credential_id: credential.credential_id,
                learner_id: credential.learner_id,
                learner_email: credential.learner_email,
                issuer_id: credential.issuer_id,
                certificate_title: credential.certificate_title,
                issued_at: new Date(credential.issued_at),
                network,
                contract_address,
                ipfs_cid: null,  // null at hash-computation time
                pdf_url: null,   // null at hash-computation time
                tx_hash: null,   // null at hash-computation time
                data_hash: null, // always null when computing hash
            });

            logger.info('Rebuilt canonical JSON for verification', {
                credential_id: credential.credential_id,
                canonical_json: canonicalJson,
                db_learner_id: credential.learner_id,
                db_issuer_id: credential.issuer_id,
                db_issued_at: credential.issued_at,
                issued_at_iso: new Date(credential.issued_at).toISOString(),
            });

            // Step 4: Recompute hash and verify it matches
            const recomputedHash = computeDataHash(canonicalJson);
            const hashMatch = recomputedHash === credential.data_hash;

            logger.info('Hash verification result', {
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
     * New simplified flow:
     * 1. Extract credential_id from PDF Keywords field
     * 2. Compute SHA-256 checksum of the ENTIRE PDF as-is (no stripping)
     * 3. Look up credential in DB by credential_id
     * 4. Compare checksum with stored value
     * 5. Verify blockchain tx_hash from DB
     * 6. Return result
     */
    async verifyCredentialFromPdf(pdfBuffer: Buffer): Promise<VerificationResult> {
        try {
            // Step 1: Extract credential_id from PDF Keywords
            const credentialId = await extractCredentialId(pdfBuffer);

            if (!credentialId) {
                return {
                    status: 'INVALID',
                    reason: 'No MicroMerit credential ID found in PDF. This PDF may not be a credential issued by our platform.',
                    verified_fields: {
                        hash_match: false,
                        blockchain_verified: false,
                        ipfs_cid_match: false,
                        checksum_match: false,
                    },
                };
            }

            logger.info('Extracted credential_id from PDF', { credential_id: credentialId });

            // Step 2: Compute checksum of the entire PDF as-is (no stripping needed)
            const recomputedChecksum = computePdfChecksum(pdfBuffer);

            logger.info('Computed PDF checksum for verification', {
                credential_id: credentialId,
                recomputed_checksum: recomputedChecksum,
                pdf_size: pdfBuffer.length,
            });

            // Step 3: Look up credential in DB
            const credential = await credentialVerificationRepository.findByCredentialId(credentialId);

            if (!credential) {
                return {
                    status: 'INVALID',
                    reason: `Credential with ID ${credentialId} not found in the database.`,
                    verified_fields: {
                        hash_match: false,
                        blockchain_verified: false,
                        ipfs_cid_match: false,
                        checksum_match: false,
                    },
                };
            }

            // Step 4: Compare checksum with stored value
            const storedChecksum = (credential.metadata as any)?.checksum;
            const checksumMatch = recomputedChecksum === storedChecksum;

            logger.info('PDF checksum verification', {
                credential_id: credentialId,
                stored_checksum: storedChecksum,
                recomputed_checksum: recomputedChecksum,
                match: checksumMatch,
            });

            if (!checksumMatch) {
                return {
                    status: 'INVALID',
                    reason: 'PDF checksum mismatch — the file has been modified after issuance.',
                    credential: {
                        credential_id: credential.credential_id,
                        certificate_title: credential.certificate_title,
                        tx_hash: credential.tx_hash,
                    },
                    verified_fields: {
                        hash_match: false,
                        blockchain_verified: false,
                        ipfs_cid_match: false,
                        checksum_match: false,
                    },
                };
            }

            // Step 5: Verify blockchain transaction
            let blockchainVerified = false;
            if (credential.tx_hash) {
                blockchainVerified = await verifyBlockchainTransaction(credential.tx_hash);
                logger.info('Blockchain verification result', {
                    credential_id: credentialId,
                    tx_hash: credential.tx_hash,
                    verified: blockchainVerified,
                });
            } else {
                logger.warn('No tx_hash in DB — blockchain pending or failed', {
                    credential_id: credentialId,
                });
            }

            // Step 6: Build result
            const credentialDetails = {
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
            };

            const overallValid = checksumMatch && blockchainVerified;

            logger.info('PDF verification summary', {
                credential_id: credentialId,
                checksum_match: checksumMatch,
                blockchain_verified: blockchainVerified,
                overall: overallValid ? 'VALID' : 'INVALID',
            });

            if (overallValid) {
                return {
                    status: 'VALID',
                    credential: credentialDetails,
                    verified_fields: {
                        hash_match: true,
                        blockchain_verified: true,
                        ipfs_cid_match: true,
                        checksum_match: true,
                    },
                };
            } else {
                const reason = !blockchainVerified
                    ? 'Blockchain verification failed — transaction not found or pending'
                    : 'Verification failed';
                return {
                    status: 'INVALID',
                    reason,
                    credential: credentialDetails,
                    verified_fields: {
                        hash_match: true,
                        blockchain_verified: blockchainVerified,
                        ipfs_cid_match: true,
                        checksum_match: true,
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
