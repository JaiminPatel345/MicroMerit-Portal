import { Router } from 'express';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
} from './controller';

const router = Router();

/**
 * @route   GET /auth/learner/oauth/google
 * @desc    Get Google OAuth authorization URL
 * @access  Public
 */
router.get('/google', getGoogleAuthUrl);

/**
 * @route   GET /auth/learner/oauth/google/callback
 * @desc    Handle Google OAuth callback
 * @access  Public
 */
router.get('/google/callback', handleGoogleCallback);

export default router;
