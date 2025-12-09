import { Router } from 'express';
import { credentialVerificationController } from './controller';
import { asyncHandler } from '../../middleware/error';
import { documentUpload } from '../../utils/multerConfig';

const router = Router();

/**
 * POST /credentials/verify
 * Verify a credential (public endpoint)
 */
router.post(
    '/verify',
    asyncHandler(credentialVerificationController.verifyCredential.bind(credentialVerificationController))
);

/**
 * POST /credentials/extract-id
 * Extract credential ID from document (public endpoint)
 */
router.post(
    '/extract-id',
    documentUpload.single('file'),
    asyncHandler(credentialVerificationController.extractCredentialId.bind(credentialVerificationController))
);

export default router;
