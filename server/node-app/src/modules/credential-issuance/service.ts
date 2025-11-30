import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { credentialIssuanceRepository } from './repository';
import { skillKnowledgeBaseRepository } from '../skill-knowledge-base/repository';
import { uploadToFilebase } from '../../utils/filebase';
import { writeToBlockchain } from '../../utils/blockchain';
import { buildCanonicalJson, computeDataHash } from '../../utils/canonicalJson';
import { NotFoundError, ValidationError } from '../../utils/errors';
import { logger } from '../../utils/logger';

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
}

export interface IssueCredentialResult {
    credential_id: string;
    learner_id: number | null;
    learner_email: string;
    certificate_title: string;
    ipfs_cid: string;
    tx_hash: string;
    data_hash: string;
    pdf_url: string;
    status: string;
    issued_at: Date;
}

export class CredentialIssuanceService {
    /**
     * Issue a new credential
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
            verification_status
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

        // Step 4: Upload PDF to Filebase (IPFS) first
        // Generate unique filename: credential/{user_id || email}/{certificate_title}-{4 random letters}
        const identifier = learner_id ? learner_id.toString() : learner_email.replace(/[^a-zA-Z0-9]/g, '_');
        const sanitizedTitle = certificate_title.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const randomSuffix = crypto.randomBytes(2).toString('hex'); // 4 random hex characters
        const extension = original_pdf_filename.split('.').pop() || 'pdf';

        const uniqueFileName = `credential/${identifier}/${sanitizedTitle}-${randomSuffix}.${extension}`;

        let ipfs_cid: string;
        let pdf_url: string;

        if (process.env.BLOCKCHAIN_MOCK_ENABLED === 'true') {
            logger.info('Mocking Filebase upload (BLOCKCHAIN_MOCK_ENABLED=true)');
            ipfs_cid = `mock-cid-${uuidv4()}`;
            pdf_url = `https://mock-ipfs-gateway.com/${ipfs_cid}`;
        } else {
            const result = await uploadToFilebase(
                original_pdf,
                uniqueFileName,
                mimetype || 'application/pdf'
            );
            ipfs_cid = result.cid;
            pdf_url = result.gateway_url;
            logger.info('Uploaded to IPFS', { credential_id, ipfs_cid, pdf_url });
        }

        // Step 5: Build canonical JSON with IPFS data but before blockchain (tx_hash and data_hash still null)
        let canonicalJson = buildCanonicalJson({
            credential_id,
            learner_id,
            learner_email,
            issuer_id,
            certificate_title,
            issued_at,
            ipfs_cid,
            pdf_url,
            tx_hash: null,
            data_hash: null,
        });

        // Step 6: Compute SHA256 hash (data_hash) - this will be computed with tx_hash as null
        const data_hash = computeDataHash(canonicalJson);
        logger.info('Computed data hash', { credential_id, data_hash });

        // Step 7: Write to blockchain
        const { tx_hash } = await writeToBlockchain(credential_id, data_hash, ipfs_cid);
        logger.info('Blockchain write complete', { credential_id, tx_hash });

        // Step 8: Final canonical JSON with all data including the computed data_hash
        canonicalJson = buildCanonicalJson({
            credential_id,
            learner_id,
            learner_email,
            issuer_id,
            certificate_title,
            issued_at,
            ipfs_cid,
            pdf_url,
            tx_hash,
            data_hash,
        });

        // Step 9: Store in database
        // If pre-verified data is provided, use it. Otherwise, initialize empty and trigger async OCR.
        let initialMetadata: any = {
            ...canonicalJson,
            issuer_name: issuer.name,
            ai_extracted: {}
        };

        if (ai_extracted_data) {
            // If verification status is provided, merge it into nsqf_alignment
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
            ipfs_cid,
            pdf_url,
            tx_hash,
            data_hash,
            metadata: initialMetadata,
            status,
        });

        logger.info('Credential issued successfully', {
            credential_id,
            learner_id,
            learner_email,
            status,
            pre_verified: !!ai_extracted_data
        });

        // Step 10: Process OCR asynchronously ONLY if not pre-verified
        if (!ai_extracted_data) {
            this.processOCRAsync(
                credential_id,
                original_pdf,
                original_pdf_filename,
                learner_email,
                certificate_title,
                issuer.name
            ).catch(error => {
                logger.error('Async OCR processing failed', {
                    credential_id,
                    error: error.message
                });
            });
        }

        return {
            credential_id,
            learner_id,
            learner_email,
            certificate_title,
            ipfs_cid,
            tx_hash,
            data_hash,
            pdf_url,
            status,
            issued_at,
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
     * This runs in background and doesn't block the response to user
     */
    private async processOCRAsync(
        credential_id: string,
        original_pdf: Buffer,
        original_pdf_filename: string,
        learner_email: string,
        certificate_title: string,
        issuer_name: string
    ): Promise<void> {
        try {
            logger.info('Starting async OCR processing', { credential_id, certificate_title });

            const { aiService } = await import('../ai/ai.service');

            // Fetch relevant NSQF context
            const nsqfContext = await skillKnowledgeBaseRepository.search(certificate_title);
            logger.info('Fetched NSQF context', { count: nsqfContext.length, query: certificate_title });

            const ocrResult = await aiService.processOCR(
                original_pdf,
                original_pdf_filename,
                learner_email,
                certificate_title,
                issuer_name,
                nsqfContext // Pass context to AI service
            );

            const ai_extracted_data = {
                skills: ocrResult.skills || [],
                nsqf: ocrResult.nsqf || { level: 1, confidence: 0.0, reasoning: '' },
                keywords: ocrResult.keywords || [],
                certificate_metadata: ocrResult.certificate_metadata || {},
                description: ocrResult.description || '',
                extracted_text_preview: ocrResult.extracted_text?.substring(0, 500) || '',
                processed_at: new Date().toISOString()
            };

            // Update the credential with AI-extracted data
            await credentialIssuanceRepository.updateCredentialMetadata(
                credential_id,
                ai_extracted_data
            );

            logger.info('Async OCR processing complete and DB updated', {
                credential_id,
                skills_count: ai_extracted_data.skills.length,
                keywords_count: ai_extracted_data.keywords.length,
                nsqf_level: ai_extracted_data.nsqf.level
            });
        } catch (error: any) {
            logger.error('Async OCR processing failed', {
                credential_id,
                error: error.message,
                stack: error.stack
            });
            // Don't throw - this is fire-and-forget
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

        // Transform to friendly format
        return recipients.map(r => ({
            id: r.learner_email, // Use email as unique ID for grouping
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
        // Verify credential belongs to issuer
        const credential = await credentialIssuanceRepository.findCredentialById(credentialId);

        if (!credential) {
            throw new NotFoundError('Credential not found', 404, 'CREDENTIAL_NOT_FOUND');
        }

        if (credential.issuer_id !== issuerId) {
            throw new ValidationError('Unauthorized to verify this credential', 403, 'UNAUTHORIZED');
        }

        // Update metadata with verification status
        const currentMetadata = credential.metadata as any;
        const updatedMetadata = {
            ...currentMetadata,
            ai_extracted: {
                ...currentMetadata.ai_extracted,
                nsqf_alignment: {
                    ...currentMetadata.ai_extracted?.nsqf_alignment,
                    ...verificationData,
                    verified_at: new Date().toISOString(),
                    verified_by_issuer: true
                }
            }
        };

        return await credentialIssuanceRepository.updateCredentialMetadata(credentialId, updatedMetadata.ai_extracted);
    }
}

export const credentialIssuanceService = new CredentialIssuanceService();
