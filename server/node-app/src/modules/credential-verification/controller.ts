import { Request, Response } from 'express';
import { credentialVerificationService } from './service';
import { verifyCredentialSchema } from './schema';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

/**
 * Controller for credential verification operations
 */

export class CredentialVerificationController {
    /**
     * Verify a credential
     * POST /credentials/verify
     */
    async verifyCredential(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = verifyCredentialSchema.parse(req.body);

            const result = await credentialVerificationService.verifyCredential(validatedData);

            if (result.status === 'VALID') {
                sendSuccess(res, result, 'Credential verified successfully', 200);
            } else {
                sendSuccess(res, result, 'Credential verification failed', 200);
            }
        } catch (error: any) {
            logger.error('Credential verification request failed', { error: error.message });

            if (error.statusCode) {
                sendError(res, error.code || error.message, error.message, error.statusCode);
            } else {
                sendError(res, error.message, 'Failed to verify credential', 500);
            }
        }
    }

    /**
     * Extract Credential ID from a PDF (Public)
     * POST /credentials/extract-id
     */
    async extractCredentialId(req: Request, res: Response) {
        try {
            if (!req.file) return sendError(res, 'No file uploaded', 'Validation Error', 400);

            // Import dynamically
            const { aiService } = await import('../ai/ai.service');
            
            const result = await aiService.extractCredentialId(req.file.buffer, req.file.originalname);
            sendSuccess(res, result, 'Extraction Complete');
        } catch (error: any) {
            sendError(res, error.message, 'Extraction Failed', 500);
        }
    }

    /**
     * Verify a credential from an uploaded PDF file
     * POST /credentials/verify-pdf
     */
    async verifyCredentialFromPdf(req: Request, res: Response): Promise<void> {
        try {
            if (!req.file) {
                sendError(res, 'No PDF file uploaded', 'Validation Error', 400);
                return;
            }

            const result = await credentialVerificationService.verifyCredentialFromPdf(req.file.buffer);

            if (result.status === 'VALID') {
                sendSuccess(res, result, 'Credential verified successfully from PDF', 200);
            } else {
                sendSuccess(res, result, 'Credential verification from PDF failed', 200);
            }
        } catch (error: any) {
            logger.error('PDF credential verification request failed', { error: error.message });
            sendError(res, error.message, 'Failed to verify credential from PDF', 500);
        }
    }
}

export const credentialVerificationController = new CredentialVerificationController();
