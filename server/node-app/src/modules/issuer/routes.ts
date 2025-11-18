import { Router } from 'express';
import { issuerController } from './controller';
import { apiKeyController } from './apiKey.controller';
import { authenticateToken } from '../../middleware/auth';
import { requireIssuer } from '../../middleware/role';
import { asyncHandler } from '../../middleware/error';
import { authRateLimiter, registrationRateLimiter, apiKeyRateLimiter } from '../../middleware/rateLimit';

const router = Router();

// Public routes - Two-step registration with OTP
router.post(
  '/start-register',
  registrationRateLimiter,
  asyncHandler(issuerController.startRegistration.bind(issuerController))
);

router.post(
  '/verify-register',
  asyncHandler(issuerController.verifyRegistration.bind(issuerController))
);

// Public routes - Legacy registration (deprecated)
router.post(
  '/register',
  registrationRateLimiter,
  asyncHandler(issuerController.register.bind(issuerController))
);

router.post(
  '/login',
  authRateLimiter,
  asyncHandler(issuerController.login.bind(issuerController))
);

router.post(
  '/refresh',
  asyncHandler(issuerController.refresh.bind(issuerController))
);

// Protected routes - Profile
router.get(
  '/me',
  authenticateToken,
  requireIssuer,
  asyncHandler(issuerController.getMe.bind(issuerController))
);

router.put(
  '/me',
  authenticateToken,
  requireIssuer,
  asyncHandler(issuerController.updateMe.bind(issuerController))
);

// Protected routes - API Keys
router.post(
  '/api-key/create',
  authenticateToken,
  requireIssuer,
  apiKeyRateLimiter,
  asyncHandler(apiKeyController.create.bind(apiKeyController))
);

router.get(
  '/api-key/list',
  authenticateToken,
  requireIssuer,
  asyncHandler(apiKeyController.list.bind(apiKeyController))
);

router.post(
  '/api-key/revoke/:id',
  authenticateToken,
  requireIssuer,
  asyncHandler(apiKeyController.revoke.bind(apiKeyController))
);

router.get(
  '/api-key/:id',
  authenticateToken,
  requireIssuer,
  asyncHandler(apiKeyController.getDetails.bind(apiKeyController))
);

export default router;
