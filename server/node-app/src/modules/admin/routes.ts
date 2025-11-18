import { Router } from 'express';
import { adminController } from './controller';
import { authenticateToken } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/role';
import { asyncHandler } from '../../middleware/error';
import { authRateLimiter } from '../../middleware/rateLimit';

const router = Router();

// Public routes
router.post(
  '/login',
  authRateLimiter,
  asyncHandler(adminController.login.bind(adminController))
);

router.post(
  '/refresh',
  asyncHandler(adminController.refresh.bind(adminController))
);

// Protected routes - Profile
router.get(
  '/me',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.getMe.bind(adminController))
);

// Protected routes - Issuer Management
router.post(
  '/issuer/approve/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.approveIssuer.bind(adminController))
);

router.post(
  '/issuer/reject/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.rejectIssuer.bind(adminController))
);

router.post(
  '/issuer/block/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.blockIssuer.bind(adminController))
);

router.post(
  '/issuer/unblock/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.unblockIssuer.bind(adminController))
);

router.get(
  '/issuer/list',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.listIssuers.bind(adminController))
);

export default router;
