import { Request, Response } from 'express';
import { issuerService } from './service';
import {
  issuerRegistrationSchema,
  issuerLoginSchema,
  refreshTokenSchema,
  updateIssuerProfileSchema,
} from './schema';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

export class IssuerController {
  /**
   * Register a new issuer
   * POST /auth/issuer/register
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = issuerRegistrationSchema.parse(req.body);
      const result = await issuerService.register(validatedData);
      
      sendSuccess(res, result, 'Issuer registered successfully. Account pending approval.', 201);
    } catch (error: any) {
      logger.error('Issuer registration failed', { error: error.message });
      sendError(res, error.message, 'Registration failed', 400);
    }
  }

  /**
   * Login an issuer
   * POST /auth/issuer/login
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = issuerLoginSchema.parse(req.body);
      const result = await issuerService.login(validatedData);
      
      sendSuccess(res, result, 'Login successful');
    } catch (error: any) {
      logger.error('Issuer login failed', { error: error.message });
      sendError(res, error.message, 'Login failed', 401);
    }
  }

  /**
   * Refresh access token
   * POST /auth/issuer/refresh
   */
  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = refreshTokenSchema.parse(req.body);
      const tokens = await issuerService.refresh(refreshToken);
      
      sendSuccess(res, tokens, 'Token refreshed successfully');
    } catch (error: any) {
      logger.error('Token refresh failed', { error: error.message });
      sendError(res, error.message, 'Token refresh failed', 401);
    }
  }

  /**
   * Get current issuer profile
   * GET /auth/issuer/me
   */
  async getMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const issuer = await issuerService.getProfile(req.user.id);
      sendSuccess(res, issuer, 'Profile retrieved successfully');
    } catch (error: any) {
      logger.error('Get profile failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve profile', 400);
    }
  }

  /**
   * Update issuer profile
   * PUT /auth/issuer/me
   */
  async updateMe(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const validatedData = updateIssuerProfileSchema.parse(req.body);
      const issuer = await issuerService.updateProfile(req.user.id, validatedData);
      
      sendSuccess(res, issuer, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update profile failed', { error: error.message });
      sendError(res, error.message, 'Failed to update profile', 400);
    }
  }
}

export const issuerController = new IssuerController();
