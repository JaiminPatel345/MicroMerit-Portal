import { Router } from 'express';
import multer from 'multer';
import { VerificationController } from './controller';
import { validate } from '../../middleware/validate';
import { verifyCredentialSchema } from './schema';

const router = Router();
const controller = new VerificationController();

// Configure multer for memory storage (we'll process the file in memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

/**
 * @route GET /verify/:credential_uid
 * @desc Verify credential by UID
 * @access Public
 */
router.get(
  '/:credential_uid',
  validate(verifyCredentialSchema),
  controller.verifyByUid
);

/**
 * @route POST /verify/pdf
 * @desc Verify credential by uploading PDF
 * @access Public
 */
router.post(
  '/pdf',
  upload.single('pdf_file') as any,
  controller.verifyByPdf
);

export default router;
