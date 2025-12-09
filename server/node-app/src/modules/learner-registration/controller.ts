import { Request, Response, NextFunction } from 'express';
import { RegistrationService } from './service';
import { RegistrationRepository } from './repository';
import {
  StartRegistrationInput,
  VerifyOTPInput,
  CompleteRegistrationInput,
  ForgotPasswordInput,
  VerifyResetOTPInput,
  ResetPasswordInput,
  ResendOTPInput,
} from './schema';
import { sendSuccess, sendError } from '../../utils/response';
import { verifyAccessToken } from '../../utils/jwt';
import { AuthError } from '../../utils/errors';

const repository = new RegistrationRepository();
const service = new RegistrationService(repository);

/**
 * Controller: Start Registration (Step 1)
 * POST /auth/learner/start-register
 */
export const startRegistration = async (
  req: Request<{}, {}, StartRegistrationInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await service.startRegistration(req.body);
    sendSuccess(res, result, 'OTP sent successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Verify OTP (Step 2)
 * POST /auth/learner/verify-otp
 */
export const verifyOTP = async (
  req: Request<{}, {}, VerifyOTPInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await service.verifyOTP(req.body);
    sendSuccess(res, result, 'OTP verified successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Complete Registration (Step 3)
 * POST /auth/learner/complete-register
 */
export const completeRegistration = async (
  req: Request<{}, {}, CompleteRegistrationInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract temp token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Temporary token required. Please start registration again', 401, 'TOKEN_REQUIRED');
    }

    const tempToken = authHeader.substring(7);
    let decoded;
    
    try {
      decoded = verifyAccessToken(tempToken);
    } catch (error: any) {
      // If token expired, guide user to start registration again
      if (error.code === 'TOKEN_EXPIRED') {
        throw new AuthError('Registration session expired. Please start registration again from step 1', 401, 'TOKEN_EXPIRED');
      }
      throw new AuthError('Invalid registration token. Please start registration again', 401, 'INVALID_TOKEN');
    }

    // Validate token type
    if ((decoded as any).type !== 'registration') {
      throw new AuthError('Invalid token type. Please start registration again', 401, 'INVALID_TOKEN_TYPE');
    }

    const sessionId = (decoded as any).sessionId;
    if (!sessionId) {
      throw new AuthError('Invalid token payload. Please start registration again', 401, 'INVALID_TOKEN_PAYLOAD');
    }

    // Extract profile photo file from multer (if provided)
    const profilePhotoFile = req.file;

    const result = await service.completeRegistration(sessionId, req.body, profilePhotoFile);
    sendSuccess(res, result, 'Registration completed successfully', 201);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Forgot Password (Step 1)
 * POST /auth/learner/forgot-password
 */
export const forgotPassword = async (
  req: Request<{}, {}, ForgotPasswordInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await service.forgotPassword(req.body);
    sendSuccess(res, result, 'Password reset OTP sent successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Verify Reset OTP (Step 2)
 * POST /auth/learner/verify-reset-otp
 */
export const verifyResetOTP = async (
  req: Request<{}, {}, VerifyResetOTPInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await service.verifyResetOTP(req.body);
    sendSuccess(res, result, 'OTP verified successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Reset Password (Step 3)
 * POST /auth/learner/reset-password
 */
export const resetPassword = async (
  req: Request<{}, {}, ResetPasswordInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await service.resetPassword(req.body);
    sendSuccess(res, result, 'Password reset successfully', 200);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller: Resend OTP
 * POST /auth/learner/resend-otp
 */
export const resendOTP = async (
  req: Request<{}, {}, ResendOTPInput>,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await service.resendOTP(req.body);
    sendSuccess(res, result, 'OTP resent successfully', 200);
  } catch (error) {
    next(error);
  }
};
