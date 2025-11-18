import { Router } from 'express';
import { issuerController } from './controller';
import { authenticateToken } from '../../middleware/auth';
import { requireIssuer } from '../../middleware/role';
import { asyncHandler } from '../../middleware/error';
import { authRateLimiter, registrationRateLimiter } from '../../middleware/rateLimit';

const router = Router();

// Public routes
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

// Protected routes
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

export default router;
