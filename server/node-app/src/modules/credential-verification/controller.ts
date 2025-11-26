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
}

export const credentialVerificationController = new CredentialVerificationController();
