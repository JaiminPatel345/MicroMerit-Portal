import { Request, Response } from 'express';
import { issuerService } from './service';
import {
  issuerRegistrationSchema,
  issuerLoginSchema,
  refreshTokenSchema,
  updateIssuerProfileSchema,
  startIssuerRegistrationSchema,
  verifyIssuerOTPSchema,
} from './schema';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';

export class IssuerController {
  /**
   * Start issuer registration (Step 1 - Send OTP)
   * POST /auth/issuer/start-register
   */
  async startRegistration(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = startIssuerRegistrationSchema.parse(req.body);
      const result = await issuerService.startRegistration(validatedData);

      sendSuccess(res, result, 'OTP sent successfully', 200);
    } catch (error: any) {
      logger.error('Issuer start registration failed', { error: error.message });
      sendError(res, error.message, 'Registration failed', 400);
    }
  }

  /**
   * Verify OTP and complete registration (Step 2)
   * POST /auth/issuer/verify-register
   */
  async verifyRegistration(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = verifyIssuerOTPSchema.parse(req.body);
      const result = await issuerService.verifyRegistrationOTP(validatedData);

      sendSuccess(res, result, 'Issuer registered successfully. Account pending approval.', 201);
    } catch (error: any) {
      logger.error('Issuer verify registration failed', { error: error.message });
      sendError(res, error.message, 'Verification failed', 400);
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
      const logoFile = req.file;

      const issuer = await issuerService.updateProfile(req.user.id, validatedData, logoFile);

      sendSuccess(res, issuer, 'Profile updated successfully');
    } catch (error: any) {
      logger.error('Update profile failed', { error: error.message });
      sendError(res, error.message, 'Failed to update profile', 400);
    }
  }

  /**
   * Get dashboard stats
   * GET /issuer/stats
   */
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const stats = await issuerService.getDashboardStats(req.user.id);
      sendSuccess(res, stats, 'Stats retrieved successfully');
    } catch (error: any) {
      logger.error('Get stats failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve stats', 400);
    }
  }
}

export const issuerController = new IssuerController();
