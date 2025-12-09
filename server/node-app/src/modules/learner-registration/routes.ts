import { Router } from 'express';
import { validate } from '../../middleware/validate';
import {
  startRegistrationSchema,
  verifyOTPSchema,
  completeRegistrationSchema,
  forgotPasswordSchema,
  verifyResetOTPSchema,
  resetPasswordSchema,
  resendOTPSchema,
} from './schema';
import {
  startRegistration,
  verifyOTP,
  completeRegistration,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  resendOTP,
} from './controller';
import { uploadProfilePhoto } from '../../utils/multerConfig';

const router = Router();

/**
 * @route   POST /auth/learner/start-register
 * @desc    Start learner registration by sending OTP
 * @access  Public
 */
router.post(
  '/start-register',
  validate(startRegistrationSchema),
  startRegistration
);

/**
 * @route   POST /auth/learner/verify-otp
 * @desc    Verify OTP for registration
 * @access  Public
 */
router.post(
  '/verify-otp',
  validate(verifyOTPSchema),
  verifyOTP
);

/**
 * @route   POST /auth/learner/complete-register
 * @desc    Complete learner registration with optional profile photo
 * @access  Requires temporary token from verify-otp
 * @upload  Accepts multipart/form-data with optional 'profilePhoto' file field
 */
router.post(
  '/complete-register',
  uploadProfilePhoto,
  validate(completeRegistrationSchema),
  completeRegistration
);

/**
 * @route   POST /auth/learner/forgot-password
 * @desc    Request password reset by sending OTP
 * @access  Public
 */
router.post(
  '/forgot-password',
  validate(forgotPasswordSchema),
  forgotPassword
);

/**
 * @route   POST /auth/learner/verify-reset-otp
 * @desc    Verify OTP for password reset
 * @access  Public
 */
router.post(
  '/verify-reset-otp',
  validate(verifyResetOTPSchema),
  verifyResetOTP
);

/**
 * @route   POST /auth/learner/reset-password
 * @desc    Reset password with verified OTP
 * @access  Public
 */
router.post(
  '/reset-password',
  validate(resetPasswordSchema),
  resetPassword
);

/**
 * @route   POST /auth/learner/resend-otp
 * @desc    Resend OTP for any verification session
 * @access  Public
 */
router.post(
  '/resend-otp',
  validate(resendOTPSchema),
  resendOTP
);

export default router;
