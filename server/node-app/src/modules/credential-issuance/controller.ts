import { Request, Response, NextFunction } from 'express';
import { credentialIssuanceService } from './service';
import { issueCredentialSchema } from './schema';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

/**
 * Controller for credential issuance operations
 */

export class CredentialIssuanceController {
    /**
     * Issue a new credential
     * POST /credentials/issue
     */
    async issueCredential(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Validate request body
            const validatedData = issueCredentialSchema.parse({
                ...req.body,
                issued_at: req.body.issued_at || new Date().toISOString(),
            });

            // Check for uploaded PDF
            if (!req.file) {
                sendError(res, 'PDF file is required', 'Missing original_pdf file', 400);
                return;
            }

            // Get issuer_id from authenticated user
            const issuer_id = req.user?.id;

            if (!issuer_id) {
                sendError(res, 'Unauthorized', 'Issuer ID missing from context', 401);
                return;
            }

            // Parse issued_at to Date
            const issued_at = typeof validatedData.issued_at === 'string'
                ? new Date(validatedData.issued_at)
                : validatedData.issued_at;

            // Parse JSON strings from FormData if present
            let ai_extracted_data = req.body.ai_extracted_data;
            let verification_status = req.body.verification_status;

            if (typeof ai_extracted_data === 'string') {
                try {
                    ai_extracted_data = JSON.parse(ai_extracted_data);
                } catch (e) {
                    logger.warn('Failed to parse ai_extracted_data JSON', { error: e });
                }
            }

            if (typeof verification_status === 'string') {
                try {
                    verification_status = JSON.parse(verification_status);
                } catch (e) {
                    logger.warn('Failed to parse verification_status JSON', { error: e });
                }
            }

            const result = await credentialIssuanceService.issueCredential({
                learner_email: validatedData.learner_email,
                issuer_id,
                certificate_title: validatedData.certificate_title,
                issued_at,
                original_pdf: req.file.buffer,
                original_pdf_filename: req.file.originalname,
                ai_extracted_data,
                verification_status
            });

            sendSuccess(res, result, 'Credential issued successfully', 201);
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * Analyze credential for pre-issuance verification
     * POST /credentials/analyze
     */
    async analyzeCredential(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            // Check for uploaded PDF
            if (!req.file) {
                sendError(res, 'PDF file is required', 'Missing original_pdf file', 400);
                return;
            }

            // Get issuer_id from authenticated user
            const issuer_id = req.user?.id;

            if (!issuer_id) {
                sendError(res, 'Unauthorized', 'Issuer ID missing from context', 401);
                return;
            }

            const { learner_email, certificate_title } = req.body;

            if (!learner_email || !certificate_title) {
                sendError(res, 'Missing required fields', 'learner_email and certificate_title are required', 400);
                return;
            }

            const result = await credentialIssuanceService.analyzeCredential(
                req.file.buffer,
                req.file.originalname,
                learner_email,
                certificate_title,
                issuer_id
            );

            sendSuccess(res, result, 'Credential analyzed successfully');
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * Get credentials issued by the authenticated issuer
     * GET /credentials/issuer/my-credentials
     */
    async getIssuerCredentials(req: Request, res: Response): Promise<void> {
        try {
            const issuer_id = req.user?.id;

            if (!issuer_id) {
                sendError(res, 'Unauthorized', 'Issuer ID missing from context', 401);
                return;
            }

            const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;

            const credentials = await credentialIssuanceService.getIssuerCredentials(issuer_id, limit);

            sendSuccess(res, credentials, 'Credentials retrieved successfully');
        } catch (error: any) {
            logger.error('Failed to fetch issuer credentials', { error: error.message });
            sendError(res, error.message, 'Failed to fetch credentials', 500);
        }
    }

    /**
     * Get recipients for the authenticated issuer
     * GET /credentials/issuer/recipients
     */
    async getIssuerRecipients(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const issuer_id = req.user?.id;

            if (!issuer_id) {
                sendError(res, 'Unauthorized', 'Issuer ID missing from context', 401);
                return;
            }

            const recipients = await credentialIssuanceService.getIssuerRecipients(issuer_id);

            sendSuccess(res, recipients, 'Recipients retrieved successfully');
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * Get latest credentials for public display
     * GET /credentials/latest
     */
    async getLatestCredentials(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const credentials = await credentialIssuanceService.getLatestCredentials();
            sendSuccess(res, credentials, 'Latest credentials retrieved successfully');
        } catch (error: any) {
            next(error);
        }
    }

    /**
     * Verify NSQF alignment for a credential
     * PUT /credentials/:id/nsqf-verification
     */
    async verifyNSQFAlignment(req: Request, res: Response, next: NextFunction): Promise<void> {
        try {
            const issuer_id = req.user?.id;
            const credential_id = req.params.id;
            const verificationData = req.body;

            if (!issuer_id) {
                sendError(res, 'Unauthorized', 'Issuer ID missing from context', 401);
                return;
            }

            if (!credential_id) {
                sendError(res, 'Bad Request', 'Credential ID is required', 400);
                return;
            }

            const result = await credentialIssuanceService.verifyNSQFAlignment(
                credential_id,
                issuer_id,
                verificationData
            );

            sendSuccess(res, result, 'NSQF alignment verified successfully');
        } catch (error: any) {
            next(error);
        }
    }
}

export const credentialIssuanceController = new CredentialIssuanceController();
