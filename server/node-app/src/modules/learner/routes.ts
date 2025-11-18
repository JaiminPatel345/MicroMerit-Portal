import { Router } from 'express';
import { learnerController } from './controller';
import { authenticateToken } from '../../middleware/auth';
import { requireLearner } from '../../middleware/role';
import { asyncHandler } from '../../middleware/error';
import { authRateLimiter, registrationRateLimiter } from '../../middleware/rateLimit';
import registrationRoutes from '../learner-registration/routes';
import oauthRoutes from '../learner-oauth/routes';

const router = Router();

// Three-step registration routes
router.use('/', registrationRoutes);

// OAuth routes
router.use('/oauth', oauthRoutes);

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

// Email management routes
router.post(
  '/add-email/request',
  authenticateToken,
  requireLearner,
  authRateLimiter,
  asyncHandler(learnerController.requestAddEmail.bind(learnerController))
);

router.post(
  '/add-email/verify',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.verifyAddEmail.bind(learnerController))
);

// Primary contact management routes
router.post(
  '/add-primary-email/request',
  authenticateToken,
  requireLearner,
  authRateLimiter,
  asyncHandler(learnerController.requestAddPrimaryEmail.bind(learnerController))
);

router.post(
  '/add-primary-email/verify',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.verifyPrimaryEmail.bind(learnerController))
);

router.post(
  '/add-primary-phone/request',
  authenticateToken,
  requireLearner,
  authRateLimiter,
  asyncHandler(learnerController.requestAddPrimaryPhone.bind(learnerController))
);

router.post(
  '/add-primary-phone/verify',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.verifyPrimaryPhone.bind(learnerController))
);

export default router;
