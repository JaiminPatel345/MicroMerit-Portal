import { Router } from 'express';
import { adminController } from './controller';
import { authenticateToken } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/role';
import { asyncHandler } from '../../middleware/error';
import { authRateLimiter } from '../../middleware/rateLimit';

// Auth routes (login, refresh) - mounted at /auth/admin
const authRouter = Router();

authRouter.post(
  '/login',
  authRateLimiter,
  asyncHandler(adminController.login.bind(adminController))
);

authRouter.post(
  '/refresh',
  asyncHandler(adminController.refresh.bind(adminController))
);

// Resource management routes - mounted at /admin
const resourceRouter = Router();

// Profile
resourceRouter.get(
  '/profile',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.getMe.bind(adminController))
);

// Issuer management
resourceRouter.get(
  '/issuers',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.listIssuers.bind(adminController))
);

resourceRouter.post(
  '/issuers/:id/approve',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.approveIssuer.bind(adminController))
);

resourceRouter.post(
  '/issuers/:id/reject',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.rejectIssuer.bind(adminController))
);

resourceRouter.post(
  '/issuers/:id/block',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.blockIssuer.bind(adminController))
);

resourceRouter.post(
  '/issuers/:id/unblock',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.unblockIssuer.bind(adminController))
);

// Learner management
resourceRouter.get(
  '/learners',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.listLearners.bind(adminController))
);

resourceRouter.get(
  '/learners/:id',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.getLearnerDetails.bind(adminController))
);

// Analytics
resourceRouter.get(
  '/analytics',
  authenticateToken,
  requireAdmin,
  asyncHandler(adminController.getAnalytics.bind(adminController))
);

export { authRouter as adminAuthRoutes, resourceRouter as adminResourceRoutes };
export default authRouter; // Default export for backward compatibility
