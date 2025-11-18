import { Router } from 'express';
import { learnerController } from './controller';
import { authenticateToken } from '../../middleware/auth';
import { requireLearner } from '../../middleware/role';
import { asyncHandler } from '../../middleware/error';
import { authRateLimiter, registrationRateLimiter } from '../../middleware/rateLimit';
import registrationRoutes from '../learner-registration/routes';
import oauthRoutes from '../learner-oauth/routes';

const router = Router();

// Three-step registration routes (new)
router.use('/', registrationRoutes);

// OAuth routes (new)
router.use('/oauth', oauthRoutes);

// Public routes (legacy/additional)
router.post(
  '/register',
  registrationRateLimiter,
  asyncHandler(learnerController.register.bind(learnerController))
);

router.post(
  '/login',
  authRateLimiter,
  asyncHandler(learnerController.login.bind(learnerController))
);

router.post(
  '/refresh',
  asyncHandler(learnerController.refresh.bind(learnerController))
);

// Protected routes
router.get(
  '/me',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.getMe.bind(learnerController))
);

router.put(
  '/me',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.updateMe.bind(learnerController))
);

export default router;
