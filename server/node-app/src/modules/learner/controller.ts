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
      sendError(res, error.message, 'Failed to verify OTP', 400);
    }
  }
}

export const learnerController = new LearnerController();
