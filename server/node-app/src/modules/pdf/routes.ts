import { Router } from 'express';
import { validate } from '../../middleware/validate';
import { authenticateToken } from '../../middleware/auth';
import { requireIssuer } from '../../middleware/role';
import { generatePdfSchema, getPdfSchema } from './schema';
import { generatePdf, getPdf, downloadPdf } from './controller';

const router = Router();

/**
 * @route   POST /pdf/generate
 * @desc    Generate PDF certificate for a credential
 * @access  Issuer or Admin
 */
router.post(
  '/generate',
  authenticateToken,
  requireIssuer,
  validate(generatePdfSchema),
  generatePdf
);

/**
 * @route   GET /pdf/:credentialUid
 * @desc    Get PDF certificate details
 * @access  Public
 */
router.get(
  '/:credentialUid',
  validate(getPdfSchema),
  getPdf
);

/**
 * @route   GET /pdf/:credentialUid/download
 * @desc    Download PDF certificate
 * @access  Public
 */
router.get(
  '/:credentialUid/download',
  validate(getPdfSchema),
  downloadPdf
);

export default router;
