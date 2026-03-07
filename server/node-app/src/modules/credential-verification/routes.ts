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

/**
 * POST /credentials/verify-pdf
 * Verify a credential from an uploaded PDF (public endpoint)
 */
router.post(
    '/verify-pdf',
    documentUpload.single('file'),
    asyncHandler(credentialVerificationController.verifyCredentialFromPdf.bind(credentialVerificationController))
);

/**
 * POST /credentials/ai-compare
 * AI-powered document comparison using Google Gemini (public endpoint)
 * Accepts image or PDF and compares core data against the original IPFS credential PDF.
 */
router.post(
    '/ai-compare',
    documentUpload.single('file'),
    asyncHandler(credentialVerificationController.aiCompareVerify.bind(credentialVerificationController))
);

export default router;
