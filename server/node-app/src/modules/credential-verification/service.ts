import { credentialVerificationRepository } from './repository';
import { buildCanonicalJson, computeDataHash, verifyCredentialHash } from '../../utils/canonicalJson';
import { verifyBlockchainTransaction } from '../../services/blockchainClient';
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
    };
}

export class CredentialVerificationService {
    /**
     * Verify a credential by any identifier
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

            // Step 2: Extract blockchain config from metadata
            // The metadata contains the canonical JSON from issuance which has blockchain info
            const metadata = credential.metadata as any;
            const network = metadata?.blockchain?.network || 'sepolia';
            const contract_address = metadata?.blockchain?.contract_address || 'mock_contract';

            logger.info('Using blockchain config from metadata', {
                credential_id: credential.credential_id,
                network,
                contract_address,
            });

            // Step 3: Rebuild canonical JSON from database fields
            // This is what the hash was computed from at issuance time
            // Note: tx_hash was null when the hash was computed
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
}

export const credentialVerificationService = new CredentialVerificationService();
