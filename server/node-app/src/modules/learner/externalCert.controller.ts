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
        sendError(res, 'issuer_id and credential_id are required', 'Bad request', 400);
        return;
      }

      if (!req.user?.email) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
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
      logger.error('[ExternalCert] Add certificate failed', { error: err.message });

      // Distinguish between ownership errors and server errors
      if (err.message?.includes('Email mismatch') || err.message?.includes('not found')) {
        sendError(res, err.message, 'Certificate not linked to your account', 403);
      } else if (err.message?.includes('No on-demand connector')) {
        sendError(res, err.message, 'Issuer not supported for on-demand sync', 400);
      } else {
        next(err);
      }
    }
  }
}

export const externalCertController = new ExternalCertController();
