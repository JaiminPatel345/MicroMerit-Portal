import { Router } from 'express';
import { credentialIssuanceController } from './controller';
import { asyncHandler } from '../../middleware/error';
import { uploadPdf } from '../../utils/pdfUpload';
import { authenticateIssuer } from '../../middleware/auth';
import { validateApiKey } from '../../middleware/apiKey';

const router = Router();

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

export default router;
