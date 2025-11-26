import { Router } from 'express';
import { credentialVerificationController } from './controller';
import { asyncHandler } from '../../middleware/error';

const router = Router();

/**
 * POST /credentials/verify
 * Verify a credential (public endpoint)
 */
router.post(
    '/verify',
    asyncHandler(credentialVerificationController.verifyCredential.bind(credentialVerificationController))
);

export default router;
