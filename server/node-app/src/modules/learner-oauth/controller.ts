import { Request, Response, NextFunction } from 'express';
import { OAuthService } from './service';
import { OAuthRepository } from './repository';
import { sendSuccess, sendError } from '../../utils/response';

const repository = new OAuthRepository();
const service = new OAuthService(repository);

/**
 * Controller: Get Google OAuth URL
 * GET /auth/learner/oauth/google
 */
export const getGoogleAuthUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUrl = service.getGoogleAuthUrl();
    sendSuccess(res, { authUrl }, 'Google OAuth URL generated', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Handle Google OAuth Callback
 * GET /auth/learner/oauth/google/callback
 */
export const handleGoogleCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      throw new Error('Authorization code is required');
    }

    const result = await service.handleGoogleCallback(code);
    
    // Redirect to frontend with tokens (in production, use secure cookie or different approach)
    // For now, return JSON response
    sendSuccess(
      res,
      result,
      result.isNewUser ? 'Account created successfully' : 'Login successful',
      200
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Get DigiLocker OAuth URL
 * GET /auth/learner/oauth/digilocker
 */
export const getDigilockerAuthUrl = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authUrl = service.getDigilockerAuthUrl();
    sendSuccess(res, { authUrl }, 'DigiLocker OAuth URL generated', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Handle DigiLocker OAuth Callback
 * GET /auth/learner/oauth/digilocker/callback
 */
export const handleDigilockerCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      throw new Error('Authorization code is required');
    }

    const result = await service.handleDigilockerCallback(code);
    
    sendSuccess(
      res,
      result,
      result.isNewUser ? 'Account created successfully' : 'Login successful',
      200
    );
  } catch (error) {
    next(error);
  }
};
