import { Router } from 'express';
import { validate } from '../../middleware/validate';
import {
  startRegistrationSchema,
  verifyOTPSchema,
  completeRegistrationSchema,
} from './schema';
import {
  startRegistration,
  verifyOTP,
  completeRegistration,
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

export default router;
