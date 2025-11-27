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

            const result = await credentialIssuanceService.issueCredential({
                learner_email: validatedData.learner_email,
                issuer_id,
                certificate_title: validatedData.certificate_title,
                issued_at,
                original_pdf: req.file.buffer,
                original_pdf_filename: req.file.originalname,
            });

            sendSuccess(res, result, 'Credential issued successfully', 201);
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
}

export const credentialIssuanceController = new CredentialIssuanceController();
