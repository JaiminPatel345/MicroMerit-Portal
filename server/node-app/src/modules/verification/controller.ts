import { Request, Response, NextFunction } from 'express';
import { VerificationService } from './service';
import { VerificationRepository } from './repository';
import { sendSuccess, sendError, sendNotFound } from '../../utils/response';
import { logger } from '../../utils/logger';

export class VerificationController {
  private service: VerificationService;

  constructor() {
    const repository = new VerificationRepository();
    this.service = new VerificationService(repository);
  }

  /**
   * GET /verify/:credential_uid
   * Verify credential by UID - public endpoint
   */
  verifyByUid = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { credential_uid } = req.params;

      if (!credential_uid) {
        return sendError(res, 'INVALID_PARAMS', 'Credential UID is required', 400);
      }

      const result = await this.service.verifyCredentialByUid(credential_uid);

      if (!result) {
        return sendNotFound(res, 'Credential not found');
      }

      return sendSuccess(res, result, 'Credential verified successfully');
    } catch (error) {
      logger.error('Error in verifyByUid:', error);
      next(error);
    }
  };

  /**
   * POST /verify/pdf
   * Verify PDF by uploading file - public endpoint
   */
  verifyByPdf = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Check if file exists (multer adds file to request)
      const file = (req as any).file;
      
      if (!file) {
        return sendError(res, 'NO_FILE', 'No PDF file uploaded. Upload a PDF file using the field name "pdf_file"', 400);
      }

      // Validate file type
      if (file.mimetype !== 'application/pdf') {
        return sendError(res, 'INVALID_FILE_TYPE', `Invalid file type: ${file.mimetype}. Expected: application/pdf`, 400);
      }

      // Validate file size (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return sendError(res, 'FILE_TOO_LARGE', `File size ${file.size} exceeds maximum ${maxSize} bytes (10MB)`, 400);
      }

      // Verify the PDF
      const result = await this.service.verifyPdfUpload(file.buffer);

      return sendSuccess(res, result, 'PDF verification completed');
    } catch (error) {
      logger.error('Error in verifyByPdf:', error);
      
      // Handle specific PDF parsing errors
      if (error instanceof Error && error.message.includes('Failed to parse')) {
        return sendError(res, 'INVALID_PDF', 'Invalid or corrupted PDF file. Please ensure you are uploading a valid PDF certificate', 400);
      }
      
      next(error);
    }
  };
}
