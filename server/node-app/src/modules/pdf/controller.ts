import { Request, Response, NextFunction } from 'express';
import { PdfService } from './service';
import { PdfRepository } from './repository';
import { GeneratePdfInput } from './schema';
import { sendSuccess } from '../../utils/response';

const repository = new PdfRepository();
const service = new PdfService(repository);

/**
 * Controller: Generate PDF Certificate
 * POST /pdf/generate
 */
export const generatePdf = async (
  req: Request<{}, {}, GeneratePdfInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await service.generatePdfCertificate(req.body);
    sendSuccess(res, result, 'PDF certificate generated successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get PDF Certificate Details
 * GET /pdf/:credentialUid
 */
export const getPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { credentialUid } = req.params;
    if (!credentialUid) {
      throw new Error('Credential UID is required');
    }
    const result = await service.getPdfCertificate(credentialUid);
    sendSuccess(res, result, 'PDF certificate retrieved successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Download PDF Certificate
 * GET /pdf/:credentialUid/download
 */
export const downloadPdf = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { credentialUid } = req.params;
    if (!credentialUid) {
      throw new Error('Credential UID is required');
    }
    
    const { buffer, filename } = await service.downloadPdf(credentialUid);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};
