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
   * PUT /auth/learner/me
   */
  async updateMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const validatedData = updateLearnerProfileSchema.parse(req.body);
      const learner = await learnerService.updateProfile(req.user.id, validatedData);
      
      sendSuccess(res, learner, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update profile failed', { error: error.message });
      sendError(res, error.message, 'Failed to update profile', 400);
    }
  }

  /**
   * Request to add email
   * POST /auth/learner/add-email/request
   */
  async requestAddEmail(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const { requestAddEmailSchema } = require('./schema');
      const validatedData = requestAddEmailSchema.parse(req.body);
      const result = await learnerService.requestAddEmail(req.user.id, validatedData.email);
      
      sendSuccess(res, result, 'OTP sent successfully', 200);
    } catch (error: any) {
      logger.error('Request add email failed', { error: error.message });
      sendError(res, error.message, 'Failed to send OTP', 400);
    }
  }

  /**
   * Verify email OTP and add email
   * POST /auth/learner/add-email/verify
   */
  async verifyAddEmail(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const { verifyEmailOTPSchema } = require('./schema');
      const validatedData = verifyEmailOTPSchema.parse(req.body);
      const result = await learnerService.verifyEmailOTP(req.user.id, validatedData.sessionId, validatedData.otp);
      
      sendSuccess(res, result, 'Email added successfully', 200);
    } catch (error: any) {
      logger.error('Verify add email failed', { error: error.message });
      sendError(res, error.message, 'Failed to verify OTP', 400);
    }
  }

  /**
   * Request to add primary email (for phone-registered users)
   * POST /auth/learner/add-primary-email/request
   */
  async requestAddPrimaryEmail(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const { requestAddPrimaryEmailSchema } = require('./schema');
      const validatedData = requestAddPrimaryEmailSchema.parse(req.body);
      const result = await learnerService.requestAddPrimaryEmail(req.user.id, validatedData.email);
      
      sendSuccess(res, result, 'OTP sent successfully', 200);
    } catch (error: any) {
      logger.error('Request add primary email failed', { error: error.message });
      sendError(res, error.message, 'Failed to send OTP', 400);
    }
  }

  /**
   * Verify primary email OTP
   * POST /auth/learner/add-primary-email/verify
   */
  async verifyPrimaryEmail(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const { verifyPrimaryEmailOTPSchema } = require('./schema');
      const validatedData = verifyPrimaryEmailOTPSchema.parse(req.body);
      const result = await learnerService.verifyPrimaryEmailOTP(req.user.id, validatedData.sessionId, validatedData.otp);
      
      sendSuccess(res, result, 'Primary email added successfully', 200);
    } catch (error: any) {
      logger.error('Verify primary email failed', { error: error.message });
      sendError(res, error.message, 'Failed to verify OTP', 400);
    }
  }

  /**
   * Request to add primary phone (for email-registered users)
   * POST /auth/learner/add-primary-phone/request
   */
  async requestAddPrimaryPhone(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const { requestAddPrimaryPhoneSchema } = require('./schema');
      const validatedData = requestAddPrimaryPhoneSchema.parse(req.body);
      const result = await learnerService.requestAddPrimaryPhone(req.user.id, validatedData.phone);
      
      sendSuccess(res, result, 'OTP sent successfully', 200);
    } catch (error: any) {
      logger.error('Request add primary phone failed', { error: error.message });
      sendError(res, error.message, 'Failed to send OTP', 400);
    }
  }

  /**
   * Verify primary phone OTP
   * POST /auth/learner/add-primary-phone/verify
   */
  async verifyPrimaryPhone(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const { verifyPrimaryPhoneOTPSchema } = require('./schema');
      const validatedData = verifyPrimaryPhoneOTPSchema.parse(req.body);
      const result = await learnerService.verifyPrimaryPhoneOTP(req.user.id, validatedData.sessionId, validatedData.otp);
      
      sendSuccess(res, result, 'Primary phone added successfully', 200);
    } catch (error: any) {
      logger.error('Verify primary phone failed', { error: error.message });
      sendError(res, error.message, 'Failed to verify OTP', 400);
    }
  }
}

export const learnerController = new LearnerController();
