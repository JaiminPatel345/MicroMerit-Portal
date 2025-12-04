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
      // Redirect to frontend login with error
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=Authorization code missing`);
    }

    const result = await service.handleGoogleCallback(code);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // If this is a new user, redirect to profile-builder with temp token
    if (result.isNewUser) {
      const params = new URLSearchParams({
        tempToken: result.tempToken!,
        email: result.email || '',
        name: result.name || '',
        profileUrl: result.profileUrl || '',
        loginMethod: result.loginMethod || 'google'
      });
      return res.redirect(`${frontendUrl}/profile-builder?${params.toString()}`);
    }

    // Existing user - redirect to dashboard with tokens
    const params = new URLSearchParams({
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken!,
      learner: JSON.stringify({
        id: result.learner!.id,
        email: result.learner!.email,
        phone: result.learner!.phone || '',
        profileUrl: result.learner!.profileUrl || '',
        otherEmails: result.learner!.otherEmails || []
      })
    });

    res.redirect(`${frontendUrl}/google-callback?${params.toString()}`);
  } catch (error) {
    // Redirect to frontend login with error
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=Google authentication failed`);
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
