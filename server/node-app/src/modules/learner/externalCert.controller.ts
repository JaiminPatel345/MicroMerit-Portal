import { Request, Response, NextFunction } from 'express';
import { onDemandCertService } from '../external-credential-sync/ondemand.service';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

export class ExternalCertController {
  /**
   * GET /learner/external-issuers
   * Returns list of issuers that have on-demand sync configured.
   * Used to populate the dropdown in the "Add Certificate" modal.
   */
  async getExternalIssuers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const issuers = onDemandCertService.getAvailableIssuers();
      sendSuccess(res, issuers, 'External issuers retrieved');
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /learner/add-certificate
   * Body: { issuer_id: number, credential_id: string }
   *
   * Fetches credential from external issuer, verifies learner ownership,
   * runs full issuance pipeline, and returns immediately with pending statuses.
   */
  async addCertificate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { issuer_id, credential_id } = req.body;

      if (!issuer_id || !credential_id) {
        sendError(res, 'MISSING_FIELDS', 'issuer_id and credential_id are required', 400);
        return;
      }

      if (!req.user?.email) {
        sendError(res, 'UNAUTHENTICATED', 'User not authenticated', 401);
        return;
      }

      logger.info('[ExternalCert] Add certificate request', {
        issuer_id,
        credential_id,
        learner: req.user.email,
      });

      const result = await onDemandCertService.addCertificate({
        issuer_id: Number(issuer_id),
        credential_id: String(credential_id),
        logged_in_email: req.user.email,
      });

      sendSuccess(res, result, 'Certificate added successfully. Blockchain and IPFS processing in progress.', 201);
    } catch (err: any) {
      // All typed errors (NotFoundError, ForbiddenError, ValidationError) are handled
      // by the global error middleware — just pass them through.
      logger.error('[ExternalCert] Add certificate failed', {
        error: err.message,
        code: err.code,
        status: err.statusCode,
      });
      next(err);
    }
  }
}

export const externalCertController = new ExternalCertController();
