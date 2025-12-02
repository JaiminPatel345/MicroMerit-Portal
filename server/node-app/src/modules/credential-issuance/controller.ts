import { Request, Response, NextFunction } from 'express';
import { credentialIssuanceService } from './service';
import { issueCredentialSchema, aiExtractedDataSchema, verificationStatusSchema, nsqfVerificationSchema } from './schema';
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
                    const parsed = JSON.parse(ai_extracted_data);
                    ai_extracted_data = aiExtractedDataSchema.parse(parsed);
                } catch (e) {
                    logger.warn('Failed to parse or validate ai_extracted_data', { error: e });
                    // Fallback to empty object or handle error? 
                    // For now, if validation fails, we might want to proceed with what we have or error out.
                    // Given "full integration with validation", let's error out if it's invalid JSON but maybe be lenient on schema?
                    // Actually, let's just log and keep the parsed object if schema fails, OR enforce schema.
                    // Let's enforce schema but catch the error to provide a better message if needed.
                    // If JSON.parse fails, it's definitely bad.
                    // If Zod fails, it throws.
                    if (e instanceof SyntaxError) {
                        sendError(res, 'Invalid JSON in ai_extracted_data', 'JSON Parse Error', 400);
                        return;
                    }
                    throw e; // Re-throw Zod errors to be caught by global handler
                }
            }

            if (typeof verification_status === 'string') {
                try {
                    const parsed = JSON.parse(verification_status);
                    verification_status = verificationStatusSchema.parse(parsed);
                } catch (e) {
                    logger.warn('Failed to parse or validate verification_status', { error: e });
                    if (e instanceof SyntaxError) {
                        sendError(res, 'Invalid JSON in verification_status', 'JSON Parse Error', 400);
                        return;
                    }
                    throw e;
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

            if (!issuer_id) {
                sendError(res, 'Unauthorized', 'Issuer ID missing from context', 401);
                return;
            }

            if (!credential_id) {
                sendError(res, 'Bad Request', 'Credential ID is required', 400);
                return;
            }

            // Validate the verification data using our schema
            const validatedData = nsqfVerificationSchema.parse(req.body);

            const result = await credentialIssuanceService.verifyNSQFAlignment(
                credential_id,
                issuer_id,
                validatedData
            );

            sendSuccess(res, result, 'NSQF alignment verified successfully');
        } catch (error: any) {
            next(error);
        }
    }
}

export const credentialIssuanceController = new CredentialIssuanceController();
