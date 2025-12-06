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
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/login?error=Authorization code missing`);
    }

    const result = await service.handleDigilockerCallback(code);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // If this is a new user, redirect to profile-builder with temp token
    if (result.isNewUser) {
      const params = new URLSearchParams({
        tempToken: (result as any).tempToken || '',
        // DigiLocker might give us email/phone, let's pass what we have
        email: result.learner.email || '',
        phone: result.learner.phone || '',
        loginMethod: 'digilocker'
      });

      // If we have an access token (for existing user who is "new" to this session?), 
      // check if handleDigilockerCallback returns tempToken for new users. 
      // The service returns tokens directly for DigiLocker even for "new" users 
      // because DigiLocker is considered verified. 
      // But let's check service.ts again.
      // Service returns { learner, accessToken, refreshToken, isNewUser }
      // It doesn't seem to return tempToken like Google flow does. 
      // If isNewUser is true, we might still want to go to dashboard or profile builder?
      // For now, let's stick to dashboard redirection for DigiLocker as it provides verified identity.
      // But passing isNewUser flag helps frontend show welcome message.
    }

    const params = new URLSearchParams({
      accessToken: result.accessToken!,
      refreshToken: result.refreshToken!,
      isNewUser: String(result.isNewUser),
      learner: JSON.stringify(result.learner),
      certificatesCount: String(result.certificatesCount || 0)
    });

    res.redirect(`${frontendUrl}/digilocker-callback?${params.toString()}`);
  } catch (error) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    res.redirect(`${frontendUrl}/login?error=DigiLocker authentication failed`);
  }
};
