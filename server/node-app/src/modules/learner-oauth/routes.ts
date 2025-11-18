import { Router } from 'express';
import {
  getGoogleAuthUrl,
  handleGoogleCallback,
  getDigilockerAuthUrl,
  handleDigilockerCallback,
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

/**
 * @route   GET /auth/learner/oauth/digilocker
 * @desc    Get DigiLocker OAuth authorization URL
 * @access  Public
 */
router.get('/digilocker', getDigilockerAuthUrl);

/**
 * @route   GET /auth/learner/oauth/digilocker/callback
 * @desc    Handle DigiLocker OAuth callback
 * @access  Public
 */
router.get('/digilocker/callback', handleDigilockerCallback);

export default router;
