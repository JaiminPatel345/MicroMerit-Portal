import { Request, Response } from 'express';
import { learnerService } from './service';
import {
  learnerRegistrationSchema,
  learnerLoginSchema,
  updateLearnerProfileSchema,
} from './schema';
import { refreshTokenSchema } from '../issuer/schema';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

export class LearnerController {
  /**
   * Login a learner
   * POST /auth/learner/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = learnerLoginSchema.parse(req.body);
      const result = await learnerService.login(validatedData);

      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      logger.error('Learner login failed', { error: error.message });
      sendError(res, error.message, 'Login failed', 401);
    }
  }

  /**
   * Refresh access token
   * POST /auth/learner/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const tokens = await learnerService.refresh(refreshToken);

      sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });
      sendError(res, error.message, 'Token refresh failed', 401);
    }
  }

  /**
   * Get current learner profile
   * GET /auth/learner/me
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const learner = await learnerService.getProfile(req.user.id);
      sendSuccess(res, learner, 'Profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get profile failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve profile', 400);
    }
  }

  /**
   * Update learner profile
   * PUT /learner/profile
   */
  async updateMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const validatedData = updateLearnerProfileSchema.parse(req.body);
      const profilePhotoFile = req.file;

      const learner = await learnerService.updateProfile(req.user.id, validatedData, profilePhotoFile);

      sendSuccess(res, learner, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update profile failed', { error: error.message });
      sendError(res, error.message, 'Failed to update profile', 400);
    }
  }

  /**
   * Unified contact verification request
   * POST /learner/contacts/request
   */
  async requestContactVerification(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const { requestContactVerificationSchema } = require('./schema');
      const validatedData = requestContactVerificationSchema.parse(req.body);

      let result;
      switch (validatedData.type) {
        case 'email':
          result = await learnerService.requestAddEmail(req.user.id, validatedData.email!);
          break;
        case 'primary-email':
          result = await learnerService.requestAddPrimaryEmail(req.user.id, validatedData.email!);
          break;
        case 'primary-phone':
          result = await learnerService.requestAddPrimaryPhone(req.user.id, validatedData.phone!);
          break;
      }

      sendSuccess(res, result, 'OTP sent successfully', 200);
    } catch (error: any) {
      logger.error('Request contact verification failed', { error: error.message });
      sendError(res, error.message, 'Failed to send OTP', 400);
    }
  }

  /**
   * Unified contact verification
   * POST /learner/contacts/verify
   */
  async verifyContact(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const { verifyContactSchema } = require('./schema');
      const validatedData = verifyContactSchema.parse(req.body);

      let result;
      let successMessage;
      switch (validatedData.type) {
        case 'email':
          result = await learnerService.verifyEmailOTP(req.user.id, validatedData.sessionId, validatedData.otp);
          successMessage = 'Email added successfully';
          break;
        case 'primary-email':
          result = await learnerService.verifyPrimaryEmailOTP(req.user.id, validatedData.sessionId, validatedData.otp);
          successMessage = 'Primary email added successfully';
          break;
        case 'primary-phone':
          result = await learnerService.verifyPrimaryPhoneOTP(req.user.id, validatedData.sessionId, validatedData.otp);
          successMessage = 'Primary phone added successfully';
          break;
      }

      sendSuccess(res, result, successMessage, 200);
    } catch (error: any) {
      logger.error('Verify contact failed', { error: error.message });
      sendError(res, error.message, 'Failed to verify contact', 400);
    }
  }

  /**
   * Get QR code payload for a credential
   * GET /learner/:learner_id/credentials/:credential_id/qr
   */
  async getCredentialQR(req: Request, res: Response): Promise<void> {
    try {
      const learnerId = parseInt(req.params.learner_id!, 10);
      const credentialId = req.params.credential_id!;

      // Ensure authenticated learner can only access their own credentials
      if (req.user && req.user.id !== learnerId) {
        sendError(res, 'FORBIDDEN', 'You can only access your own credentials', 403);
        return;
      }

      const qrPayload = await learnerService.getCredentialQRPayload(learnerId, credentialId);

      sendSuccess(res, qrPayload, 'QR payload retrieved successfully');
    } catch (error: any) {
      logger.error('Failed to get QR payload', { error: error.message });

      if (error.statusCode) {
        sendError(res, error.code || error.message, error.message, error.statusCode);
      } else {
        sendError(res, error.message, 'Failed to get QR payload', 500);
      }
    }
  }
  /**
   * Get learner dashboard
   * GET /learner/dashboard
   */
  async getDashboard(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const dashboardData = await learnerService.getDashboard(req.user.id);
      sendSuccess(res, dashboardData, 'Dashboard data retrieved successfully');
    } catch (error: any) {
      logger.error('Get dashboard failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve dashboard data', 500);
    }
  }
  /**
   * Get single credential
   * GET /learner/credentials/:id
   */
  async getCredential(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const credentialId = req.params.id || '';
      const credential = await learnerService.getCredential(req.user.id, credentialId);
      sendSuccess(res, credential, 'Credential retrieved successfully');
    } catch (error: any) {
      logger.error('Get credential failed', { error: error.message });
      const statusCode = error.message === 'Credential not found' ? 404 :
        error.message === 'Unauthorized access to credential' ? 403 : 500;
      sendError(res, error.message, 'Failed to retrieve credential', statusCode);
    }
  }
  /**
   * Get learner credentials
   * GET /learner/credentials
   */
  async getMyCredentials(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;
      const status = req.query.status as string;

      const result = await learnerService.getMyCredentials(req.user.id, page, limit, search, status);
      sendSuccess(res, result, 'Credentials retrieved successfully');
    } catch (error: any) {
      logger.error('Get my credentials failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve credentials', 500);
    }
  }
  /**
   * Get public profile
   * GET /learner/public/:id
   */
  async getPublicProfile(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      if (!id) {
        sendError(res, 'ID is required', 'ID is required', 400);
        return;
      }

      const filters = {
        issuerId: req.query.issuerId ? parseInt(req.query.issuerId as string) : undefined,
        certificateTitle: req.query.certificateTitle as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10
      };

      const profile = await learnerService.getPublicProfile(id, filters);
      sendSuccess(res, profile, 'Public profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get public profile failed', { error: error.message });
      const statusCode = error.message === 'Learner not found' ? 404 : 400;
      sendError(res, error.message, 'Failed to retrieve public profile', statusCode);
    }
  }
  /**
   * Get learner roadmap
   * GET /learner/roadmap
   */
  async getRoadmap(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const roadmap = await learnerService.getRoadmap(req.user.id);
      sendSuccess(res, roadmap, 'Roadmap retrieved successfully');
    } catch (error: any) {
      logger.error('Get roadmap failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve roadmap', 500);
    }
  }

  /**
   * Get learner skill profile
   * GET /learner/skill-profile
   */
  async getSkillProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const profile = await learnerService.getSkillProfile(req.user.id);
      sendSuccess(res, profile, 'Skill profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get skill profile failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve skill profile', 500);
    }
  }
}

export const learnerController = new LearnerController();
