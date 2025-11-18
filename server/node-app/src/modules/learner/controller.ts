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
   * Register a new learner
   * POST /auth/learner/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = learnerRegistrationSchema.parse(req.body);
      const result = await learnerService.register(validatedData);
      
      sendSuccess(res, result, 'Learner registered successfully', 201);
    } catch (error: any) {
      logger.error('Learner registration failed', { error: error.message });
      sendError(res, error.message, 'Registration failed', 400);
    }
  }

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
}

export const learnerController = new LearnerController();
