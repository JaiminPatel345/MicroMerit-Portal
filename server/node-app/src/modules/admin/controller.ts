import { Request, Response } from 'express';
import { adminService } from './service';
import {
  adminLoginSchema,
  approveIssuerSchema,
  rejectIssuerSchema,
  blockIssuerSchema,
  unblockIssuerSchema,
} from './schema';
import { refreshTokenSchema } from '../issuer/schema';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

export class AdminController {
  /**
   * Login an admin
   * POST /auth/admin/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = adminLoginSchema.parse(req.body);
      const result = await adminService.login(validatedData);

      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      logger.error('Admin login failed', { error: error.message });
      sendError(res, error.message, 'Login failed', 401);
    }
  }

  /**
   * Refresh access token
   * POST /auth/admin/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const tokens = await adminService.refresh(refreshToken);

      sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });
      sendError(res, error.message, 'Token refresh failed', 401);
    }
  }

  /**
   * Get current admin profile
   * GET /auth/admin/me
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const admin = await adminService.getProfile(req.user.id);
      sendSuccess(res, admin, 'Profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get profile failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve profile', 400);
    }
  }

  /**
   * Approve an issuer
   * POST /auth/admin/issuer/approve/:id
   */
  async approveIssuer(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const issuerId = parseInt(req.params.id || '0', 10);
      if (!issuerId) {
        sendError(res, 'Invalid issuer ID', 'Bad request', 400);
        return;
      }

      approveIssuerSchema.parse(req.body); // Validate but don't use notes for now
      const issuer = await adminService.approveIssuer(req.user.id, issuerId);

      sendSuccess(res, issuer, 'Issuer approved successfully');
    } catch (error: any) {
      logger.error('Issuer approval failed', { error: error.message });
      sendError(res, error.message, 'Failed to approve issuer', 400);
    }
  }

  /**
   * Reject an issuer
   * POST /auth/admin/issuer/reject/:id
   */
  async rejectIssuer(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const issuerId = parseInt(req.params.id || '0', 10);
      if (!issuerId) {
        sendError(res, 'Invalid issuer ID', 'Bad request', 400);
        return;
      }

      const { reason } = rejectIssuerSchema.parse(req.body);
      const issuer = await adminService.rejectIssuer(req.user.id, issuerId, reason);

      sendSuccess(res, issuer, 'Issuer rejected successfully');
    } catch (error: any) {
      logger.error('Issuer rejection failed', { error: error.message });
      sendError(res, error.message, 'Failed to reject issuer', 400);
    }
  }

  /**
   * Block an issuer
   * POST /auth/admin/issuer/block/:id
   */
  async blockIssuer(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const issuerId = parseInt(req.params.id || '0', 10);
      if (!issuerId) {
        sendError(res, 'Invalid issuer ID', 'Bad request', 400);
        return;
      }

      const { reason } = blockIssuerSchema.parse(req.body);
      const issuer = await adminService.blockIssuer(req.user.id, issuerId, reason);

      sendSuccess(res, issuer, 'Issuer blocked successfully');
    } catch (error: any) {
      logger.error('Issuer blocking failed', { error: error.message });
      sendError(res, error.message, 'Failed to block issuer', 400);
    }
  }

  /**
   * Unblock an issuer
   * POST /auth/admin/issuer/unblock/:id
   */
  async unblockIssuer(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const issuerId = parseInt(req.params.id || '0', 10);
      if (!issuerId) {
        sendError(res, 'Invalid issuer ID', 'Bad request', 400);
        return;
      }

      unblockIssuerSchema.parse(req.body); // Validate but don't use notes for now
      const issuer = await adminService.unblockIssuer(req.user.id, issuerId);

      sendSuccess(res, issuer, 'Issuer unblocked successfully');
    } catch (error: any) {
      logger.error('Issuer unblocking failed', { error: error.message });
      sendError(res, error.message, 'Failed to unblock issuer', 400);
    }
  }

  /**
   * List all issuers
   * GET /auth/admin/issuer/list
   */
  async listIssuers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const status = req.query.status as string | undefined;
      const is_blocked = req.query.is_blocked === 'true' ? true : req.query.is_blocked === 'false' ? false : undefined;
      const source = req.query.source as 'connector' | 'platform' | undefined;

      const issuers = await adminService.listIssuers({ status, is_blocked, source });

      sendSuccess(res, issuers, 'Issuers retrieved successfully');
    } catch (error: any) {
      logger.error('List issuers failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve issuers', 400);
    }
  }

  /**
   * List all learners
   * GET /admin/learners
   */
  async listLearners(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const status = req.query.status as string | undefined;
      const search = req.query.search as string | undefined;

      const learners = await adminService.listLearners({ status, search });

      sendSuccess(res, learners, 'Learners retrieved successfully');
    } catch (error: any) {
      logger.error('List learners failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve learners', 400);
    }
  }

  /**
   * Get learner details
   * GET /admin/learners/:id
   */
  async getLearnerDetails(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const learnerId = parseInt(req.params.id || '0', 10);
      if (!learnerId) {
        sendError(res, 'Invalid learner ID', 'Bad request', 400);
        return;
      }

      const learner = await adminService.getLearnerDetails(learnerId);

      sendSuccess(res, learner, 'Learner details retrieved successfully');
    } catch (error: any) {
      logger.error('Get learner details failed', { error: error.message });
      const statusCode = error.message === 'Learner not found' ? 404 : 400;
      sendError(res, error.message, 'Failed to retrieve learner details', statusCode);
    }
  }

  /**
   * Get platform analytics
   * GET /admin/analytics
   */
  async getAnalytics(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const analytics = await adminService.getPlatformAnalytics();

      sendSuccess(res, analytics, 'Analytics retrieved successfully');
    } catch (error: any) {
      logger.error('Get analytics failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve analytics', 400);
    }
  }

  // Employer Management

  async listEmployers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 'Unauthorized', 401);
      const status = req.query.status as string;
      const search = req.query.search as string;
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 10;

      const result = await adminService.listEmployers(page, limit, status, search);
      sendSuccess(res, result, 'Employers retrieved');
    } catch (error: any) {
      sendError(res, error.message, 'Failed to list employers', 400);
    }
  }

  async approveEmployer(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 'Unauthorized', 401);
      const id = Number(req.params.id);
      const result = await adminService.approveEmployer(id);
      sendSuccess(res, result, 'Employer approved');
    } catch (error: any) {
      sendError(res, error.message, 'Failed to approve', 400);
    }
  }

  async rejectEmployer(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 'Unauthorized', 401);
      const id = Number(req.params.id);
      const { reason } = req.body;
      const result = await adminService.rejectEmployer(id, reason);
      sendSuccess(res, result, 'Employer rejected');
    } catch (error: any) {
      sendError(res, error.message, 'Failed to reject', 400);
    }
  }

  /**
   * List credentials for admin
   * GET /admin/credentials
   */
  async listCredentials(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const source = req.query.source as 'connector' | 'platform' | undefined;
      const limit = parseInt(req.query.limit as string) || 50;

      const credentials = await adminService.listCredentials({ source, limit });

      sendSuccess(res, credentials, 'Credentials retrieved successfully');
    } catch (error: any) {
      logger.error('List credentials failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve credentials', 400);
    }
  }
}

export const adminController = new AdminController();

