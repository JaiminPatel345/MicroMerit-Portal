import { Router } from 'express';
import { credentialIssuanceController } from './controller';
import { asyncHandler } from '../../middleware/error';
import { uploadPdf } from '../../utils/pdfUpload';
import { authenticateIssuer } from '../../middleware/auth';
import { validateApiKey } from '../../middleware/apiKey';

const router = Router();

/**
 * GET /credentials/issuer/recipients
 * Get aggregated recipients list for the authenticated issuer
 */
router.get(
    '/issuer/recipients',
    authenticateIssuer,
    asyncHandler(credentialIssuanceController.getIssuerRecipients.bind(credentialIssuanceController))
);

/**
 * GET /credentials/latest
 * Get the latest 3 credentials for public display (home page)
 */
router.get(
    '/latest',
    asyncHandler(credentialIssuanceController.getLatestCredentials.bind(credentialIssuanceController))
);

/**
 * POST /credentials/issue
 * Issue a new credential
 * Protected by issuer authentication or API key
 */
router.post(
    '/issue',
    // Either issuer auth or API key is required
    (req, res, next) => {
        // If API key is present, validate it
        if (req.headers['x-api-key']) {
            return validateApiKey(req, res, next);
        }
        // Otherwise, require issuer authentication
        return authenticateIssuer(req, res, next);
    },
    uploadPdf,
    asyncHandler(credentialIssuanceController.issueCredential.bind(credentialIssuanceController))
);

/**
 * POST /credentials/analyze
 * Analyze credential for pre-issuance verification
 */
router.post(
    '/analyze',
    authenticateIssuer,
    uploadPdf,
    asyncHandler(credentialIssuanceController.analyzeCredential.bind(credentialIssuanceController))
);

/**
 * GET /credentials/issuer/my-credentials
 * Get credentials issued by the authenticated issuer
 */
router.get(
    '/issuer/my-credentials',
    authenticateIssuer,
    asyncHandler(credentialIssuanceController.getIssuerCredentials.bind(credentialIssuanceController))
);



/**
 * PUT /credentials/:id/nsqf-verification
 * Verify NSQF alignment for a credential
 */
router.put(
    '/:id/nsqf-verification',
    authenticateIssuer,
    asyncHandler(credentialIssuanceController.verifyNSQFAlignment.bind(credentialIssuanceController))
);

export default router;
