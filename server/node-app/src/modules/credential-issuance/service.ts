import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { credentialIssuanceRepository } from './repository';
import { skillKnowledgeBaseRepository } from '../skill-knowledge-base/repository';
import { writeToBlockchainQueued } from '../../services/blockchainClient';
import { buildCanonicalJson, computeDataHash } from '../../utils/canonicalJson';
import { computePdfChecksum, embedCredentialId } from '../../utils/pdfMetadata';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { sendCredentialIssuedEmail } from '../../utils/notification';

/**
 * Service for credential issuance operations
 */

export interface IssueCredentialParams {
    learner_email: string;
    issuer_id: number;
    certificate_title: string;
    issued_at: Date;
    original_pdf: Buffer;
    original_pdf_filename: string;
    mimetype?: string;
    ai_extracted_data?: any; // Optional pre-verified data
    verification_status?: any; // Optional verification status
    skip_ai?: boolean; // If true, skip all AI processing (OCR, enrichment, profile update)
}

export interface IssueCredentialResult {
    id: string;            // Prisma primary key — use this for GET /learner/credentials/:id
    credential_id: string;
    learner_id: number | null;
    learner_email: string;
    certificate_title: string;
    ipfs_cid: string | null;
    tx_hash: string | null; // Null when blockchain confirmation is pending
    data_hash: string;
    checksum: string;
    pdf_url: string | null;
    status: string;
    issued_at: Date;
    blockchain_status: 'pending' | 'confirmed' | 'failed';
    ipfs_status: 'pending' | 'confirmed' | 'failed';
}

export class CredentialIssuanceService {
    /**
     * Issue a new credential
     * 
     * New flow:
     * 1. Validate issuer, resolve learner
     * 2. Compute PDF checksum (SHA-256 of original bytes)
     * 3. Generate credential_id
     * 4. Build canonical JSON (checksum, issuer_id, learner_email, credential_id, issued_at)
     * 5. Compute data_hash = SHA-256(canonical JSON)
     * 6. Store in DB with pending statuses
     * 7. Queue background job (blockchain → embed metadata → IPFS → update DB)
     * 8. Return immediately with pending statuses
     */
    async issueCredential(params: IssueCredentialParams): Promise<IssueCredentialResult> {
        const {
            learner_email,
            issuer_id,
            certificate_title,
            issued_at,
            original_pdf,
            original_pdf_filename,
            mimetype,
            ai_extracted_data,
            verification_status,
            skip_ai
        } = params;

        // Step 1: Validate issuer exists and is approved
        const issuer = await credentialIssuanceRepository.findIssuerById(issuer_id);
        if (!issuer) {
            throw new NotFoundError('Issuer not found', 404, 'ISSUER_NOT_FOUND');
        }

        if (issuer.status !== 'approved') {
            throw new ValidationError('Issuer is not approved to issue credentials', 403, 'ISSUER_NOT_APPROVED');
        }

        // Step 2: Resolve learner by email
        let learner = await credentialIssuanceRepository.findLearnerByEmail(learner_email);

        if (!learner) {
            // Try to find by other_emails
            learner = await credentialIssuanceRepository.findLearnerByOtherEmail(learner_email);
        }

        const learner_id = learner ? learner.id : null;
        const status = learner ? 'issued' : 'unclaimed';

        logger.info('Issuing credential', {
            learner_email,
            learner_id,
            issuer_id,
            status,
        });

        // Step 3: Generate credential_id
        const credential_id = uuidv4();

        // Step 4: Embed credential_id into PDF Keywords.
        // The checksum is computed on the PDF WITH the credential_id embedded,
        // so verification can just SHA-256 the file as-is — no stripping needed.
        const pdfWithId = await embedCredentialId(original_pdf, credential_id);
        const checksum = computePdfChecksum(pdfWithId);
        logger.info('Embedded credential_id in PDF & computed checksum', {
            credential_id,
            checksum,
            pdf_size: pdfWithId.length,
        });

        // Step 5: Build canonical JSON (all pending fields = null)
        const network = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
        const contract_address = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '';

        const canonicalJson = buildCanonicalJson({
            credential_id,
            learner_id,
            learner_email,
            issuer_id,
            certificate_title,
            issued_at,
            network,
            contract_address,
            ipfs_cid: null,
            pdf_url: null,
            tx_hash: null,
            data_hash: null,
        });

        // Step 6: Compute data_hash
        const data_hash = computeDataHash(canonicalJson);
        logger.info('Computed data hash', {
            credential_id,
            data_hash,
            canonical_json: canonicalJson,
        });

        // Step 7: Generate unique filename for IPFS upload
        const identifier = learner_id ? learner_id.toString() : learner_email.replace(/[^a-zA-Z0-9]/g, '_');
        const sanitizedTitle = certificate_title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const randomSuffix = crypto.randomBytes(2).toString('hex');
        const extension = original_pdf_filename.split('.').pop() || 'pdf';
        const uniqueFileName = `credential/${identifier}/${sanitizedTitle}-${randomSuffix}.${extension}`;

        // Step 8: Store in database with pending statuses
        let initialMetadata: any = {
            ...canonicalJson,
            checksum,
            issuer_name: issuer.name,
            ai_extracted: {},
            blockchain_status: 'pending',
            ipfs_status: 'pending',
        };

        if (ai_extracted_data) {
            if (verification_status && ai_extracted_data.nsqf_alignment) {
                ai_extracted_data.nsqf_alignment = {
                    ...ai_extracted_data.nsqf_alignment,
                    ...verification_status,
                    verified_at: new Date().toISOString(),
                    verified_by_issuer: true
                };
            }
            initialMetadata.ai_extracted = ai_extracted_data;
        }

        const credential = await credentialIssuanceRepository.createCredential({
            credential_id,
            learner_id,
            learner_email,
            issuer_id,
            certificate_title,
            issued_at,
            ipfs_cid: null,
            pdf_url: null,
            tx_hash: null,
            data_hash,
            metadata: initialMetadata,
            status,
        });

        logger.info('Credential stored in DB (blockchain & IPFS pending)', {
            credential_id,
            db_id: credential.id,
            learner_id,
            learner_email,
            status,
            checksum,
        });

        // Step 9: Queue background job (blockchain → IPFS upload)
        // The PDF already has credential_id embedded. The background job
        // uploads these EXACT bytes to IPFS — the checksum matches the file.
        try {
            await writeToBlockchainQueued(credential_id, data_hash, {
                original_pdf_base64: pdfWithId.toString('base64'),
                checksum,
                pdf_filename: uniqueFileName,
                pdf_content_type: mimetype || 'application/pdf',
            });
            logger.info('Blockchain + IPFS job queued successfully', { credential_id });
        } catch (error: any) {
            logger.error('Failed to queue blockchain + IPFS job', {
                credential_id,
                error: error.message
            });
        }

        // Step 10: Process AI tasks asynchronously (skip if issuer opted out)
        if (skip_ai) {
            logger.info('AI processing skipped by issuer preference', { credential_id });
        } else if (!ai_extracted_data) {
            this.processOCRAsync(
                credential_id,
                original_pdf,
                original_pdf_filename,
                learner_email,
                certificate_title,
                issuer.name,
                learner_id
            ).catch(error => {
                logger.error('Async OCR processing failed', {
                    credential_id,
                    error: error.message
                });
            });
        } else {
            this.postIssuanceAIAsync(
                credential_id,
                certificate_title,
                ai_extracted_data,
                learner_id
            ).catch(error => {
                logger.error('Post-issuance AI processing failed', {
                    credential_id,
                    error: error.message
                });
            });
        }

        // Step 11: Send email notification
        sendCredentialIssuedEmail(
            learner_email,
            (learner && learner.name) ? learner.name : 'Learner',
            issuer.name,
            credential.id,
            certificate_title
        ).catch(err => logger.error('Failed to send credential email', { error: err }));

        return {
            id: credential.id,     // Prisma PK — for /learner/credentials/:id lookup
            credential_id,
            learner_id,
            learner_email,
            certificate_title,
            ipfs_cid: null,        // Not available yet — IPFS upload after blockchain
            tx_hash: null,         // Not available yet — blockchain pending
            data_hash,
            checksum,
            pdf_url: null,         // Not available yet
            status,
            issued_at,
            blockchain_status: 'pending',
            ipfs_status: 'pending',
        };
    }

    /**
     * Analyze credential using AI without issuing
     * Used for pre-issuance verification
     */
    async analyzeCredential(
        fileBuffer: Buffer,
        filename: string,
        learnerEmail: string,
        certificateTitle: string,
        issuerId: number
    ): Promise<any> {
        const issuer = await credentialIssuanceRepository.findIssuerById(issuerId);
        if (!issuer) {
            throw new NotFoundError('Issuer not found', 404, 'ISSUER_NOT_FOUND');
        }

        const { aiService } = await import('../ai/ai.service');

        // Fetch relevant NSQF context
        const nsqfContext = await skillKnowledgeBaseRepository.search(certificateTitle);

        // Process with AI
        const ocrResult = await aiService.processOCR(
            fileBuffer,
            filename,
            learnerEmail,
            certificateTitle,
            issuer.name,
            nsqfContext
        );

        return {
            ...ocrResult,
            nsqf_context_used: nsqfContext.length > 0
        };
    }

    /**
     * Process OCR asynchronously and update credential metadata when complete
     */
    private async processOCRAsync(
        credential_id: string,
        original_pdf: Buffer,
        original_pdf_filename: string,
        learner_email: string,
        certificate_title: string,
        issuer_name: string,
        learner_id?: number | null
    ): Promise<void> {
        try {
            logger.info('Starting async OCR processing', { credential_id, certificate_title, learner_id });

            const { aiService } = await import('../ai/ai.service');
            const { learnerService } = await import('../learner/service');

            const nsqfContext = await skillKnowledgeBaseRepository.search(certificate_title);
            logger.info('Fetched NSQF context', { count: nsqfContext.length, query: certificate_title });

            logger.info('Calling AI Service processOCR', { credential_id });
            const ocrResult = await aiService.processOCR(
                original_pdf,
                original_pdf_filename,
                learner_email,
                certificate_title,
                issuer_name,
                nsqfContext
            );
            logger.info('AI Service processOCR completed', { credential_id });

            let enrichedMetadata = {};
            try {
                logger.info('Calling AI Service enrichCredentialMetadata', { credential_id });
                const nosDataForEnrichment = nsqfContext.length > 0 ? nsqfContext[0] : {};
                enrichedMetadata = await aiService.enrichCredentialMetadata(certificate_title, nosDataForEnrichment);
                logger.info('AI Service enrichCredentialMetadata completed', { credential_id, hasData: !!enrichedMetadata });
            } catch (enrichError) {
                logger.error('Credential enrichment failed', { credential_id, error: enrichError });
            }

            const ai_extracted = {
                skills: ocrResult.skills || [],
                nsqf: ocrResult.nsqf || { level: 1, confidence: 0.0, reasoning: '' },
                keywords: ocrResult.keywords || [],
                certificate_metadata: ocrResult.certificate_metadata || {},
                description: ocrResult.description || '',
                extracted_text_preview: ocrResult.extracted_text?.substring(0, 500) || '',
                processed_at: new Date().toISOString(),
            };

            await credentialIssuanceRepository.updateCredentialMetadata(
                credential_id,
                {
                    ai_extracted,
                    ...enrichedMetadata
                }
            );

            const ai_extracted_data = { ...ai_extracted, ...enrichedMetadata };

            logger.info('Async OCR processing complete and DB updated', {
                credential_id,
                skills_count: ai_extracted_data.skills.length,
                keywords_count: ai_extracted_data.keywords.length,
                nsqf_level: ai_extracted_data.nsqf.level
            });

            if (learner_id) {
                logger.info('Calling learnerService.updateLearnerAIProfile', { learner_id });
                await learnerService.updateLearnerAIProfile(learner_id);
                logger.info('Triggered learner AI profile update', { learner_id });
            } else {
                logger.warn('Skipping learner AI profile update: learner_id is missing', { credential_id });
            }

        } catch (error: any) {
            logger.error('Async OCR processing failed', {
                credential_id,
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Handle post-issuance AI tasks for pre-verified credentials
     */
    private async postIssuanceAIAsync(
        credential_id: string,
        certificate_title: string,
        current_metadata: any,
        learner_id?: number | null
    ): Promise<void> {
        try {
            logger.info('Starting post-issuance AI processing', { credential_id, learner_id });
            const { aiService } = await import('../ai/ai.service');
            const { learnerService } = await import('../learner/service');

            if (!current_metadata.job_recommendations || !current_metadata.nos_data) {
                logger.info('Enriching pre-verified credential', { credential_id });

                const nsqfContext = await skillKnowledgeBaseRepository.search(certificate_title);
                const nosDataForEnrichment = nsqfContext.length > 0 ? nsqfContext[0] : {};

                logger.info('Calling AI Service enrichCredentialMetadata (post-issuance)', { credential_id });
                const enrichedMetadata = await aiService.enrichCredentialMetadata(certificate_title, nosDataForEnrichment);
                logger.info('AI Service enrichCredentialMetadata completed (post-issuance)', { credential_id });

                await credentialIssuanceRepository.updateCredentialMetadata(
                    credential_id,
                    enrichedMetadata
                );
                logger.info('Enriched pre-verified credential metadata', { credential_id });
            } else {
                logger.info('Skipping enrichment: metadata already present', { credential_id });
            }

            if (learner_id) {
                logger.info('Calling learnerService.updateLearnerAIProfile (post-issuance)', { learner_id });
                await learnerService.updateLearnerAIProfile(learner_id);
                logger.info('Triggered learner AI profile update (post-issuance)', { learner_id });
            } else {
                logger.warn('Skipping learner AI profile update: learner_id is missing (post-issuance)', { credential_id });
            }
        } catch (error: any) {
            logger.error('Post-issuance AI processing failed', {
                credential_id,
                error: error.message,
                stack: error.stack
            });
        }
    }

    /**
     * Get credentials issued by an issuer
     */
    async getIssuerCredentials(issuerId: number, limit?: number) {
        return await credentialIssuanceRepository.findCredentialsByIssuerId(issuerId, limit);
    }
    /**
     * Get aggregated recipients for an issuer
     */
    async getIssuerRecipients(issuerId: number) {
        const recipients = await credentialIssuanceRepository.findRecipientsByIssuerId(issuerId);

        return recipients.map(r => ({
            id: r.learner_email,
            name: r.learner?.name || 'Unclaimed',
            email: r.learner_email,
            issued: r._count.id,
            last_issued: r._max.issued_at
        }));
    }

    /**
     * Get latest credentials for public display (e.g., home page widget)
     */
    async getLatestCredentials() {
        return await credentialIssuanceRepository.getLatestCredentials(3);
    }

    /**
     * Verify NSQF alignment for a credential
     */
    async verifyNSQFAlignment(credentialId: string, issuerId: number, verificationData: any) {
        const credential = await credentialIssuanceRepository.findCredentialById(credentialId);

        if (!credential) {
            throw new NotFoundError('Credential not found', 404, 'CREDENTIAL_NOT_FOUND');
        }

        if (credential.issuer_id !== issuerId) {
            throw new ValidationError('Unauthorized to verify this credential', 403, 'UNAUTHORIZED');
        }

        const { status, job_role, qp_code, nsqf_level, skills, reasoning } = verificationData;
        const currentMetadata = credential.metadata as any;

        let updatedMetadata: any;

        if (status === 'approved') {
            updatedMetadata = {
                ...currentMetadata,
                ai_extracted: {
                    ...currentMetadata.ai_extracted,
                    ...(skills && { skills }),
                    nsqf_alignment: {
                        ...currentMetadata.ai_extracted?.nsqf_alignment,
                        job_role: job_role || currentMetadata.ai_extracted?.nsqf_alignment?.job_role,
                        qp_code: qp_code || currentMetadata.ai_extracted?.nsqf_alignment?.qp_code,
                        nsqf_level: nsqf_level || currentMetadata.ai_extracted?.nsqf_alignment?.nsqf_level,
                        reasoning: reasoning || currentMetadata.ai_extracted?.nsqf_alignment?.reasoning,
                        verified_at: new Date().toISOString(),
                        verified_by_issuer: true,
                        verification_status: 'approved'
                    }
                }
            };
        } else {
            updatedMetadata = {
                ...currentMetadata,
                ai_extracted: {
                    ...currentMetadata.ai_extracted,
                    nsqf_alignment: {
                        ...currentMetadata.ai_extracted?.nsqf_alignment,
                        verified_at: new Date().toISOString(),
                        verified_by_issuer: true,
                        verification_status: 'rejected',
                        rejection_reasoning: reasoning || 'Issuer rejected AI mapping'
                    }
                }
            };
        }

        return await credentialIssuanceRepository.updateCredentialMetadata(
            credentialId,
            { ai_extracted: updatedMetadata.ai_extracted }
        );
    }

    /**
     * Get public credential details
     */
    async getPublicCredential(credentialId: string) {
        const credential = await credentialIssuanceRepository.findPublicCredentialById(credentialId);

        if (!credential) {
            throw new NotFoundError('Credential not found', 404, 'CREDENTIAL_NOT_FOUND');
        }

        return credential;
    }

    /**
     * Get top issuers
     */
    async getTopIssuers(limit: number = 5) {
        return await credentialIssuanceRepository.getTopIssuers(limit);
    }
}

export const credentialIssuanceService = new CredentialIssuanceService();
