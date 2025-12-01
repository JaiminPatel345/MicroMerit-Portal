import { Router } from 'express';
import { learnerController } from './controller';
import { authenticateToken } from '../../middleware/auth';
import { requireLearner } from '../../middleware/role';
import { asyncHandler } from '../../middleware/error';
import { authRateLimiter } from '../../middleware/rateLimit';
import { uploadProfilePhoto } from '../../utils/multerConfig';
import registrationRoutes from '../learner-registration/routes';
import oauthRoutes from '../learner-oauth/routes';

// Auth routes (login, register, refresh) - mounted at /auth/learner
const authRouter = Router();

// Three-step registration routes
authRouter.use('/', registrationRoutes);

// OAuth routes
authRouter.use('/oauth', oauthRoutes);

authRouter.post(
  '/login',
  authRateLimiter,
  asyncHandler(learnerController.login.bind(learnerController))
);

authRouter.post(
  '/refresh',
  asyncHandler(learnerController.refresh.bind(learnerController))
);

// Resource management routes - mounted at /learner
const resourceRouter = Router();

// Public profile route
resourceRouter.get(
  '/public/:id',
  asyncHandler(learnerController.getPublicProfile.bind(learnerController))
);

// Profile management
resourceRouter.get(
  '/profile',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.getMe.bind(learnerController))
);

resourceRouter.get(
  '/dashboard',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.getDashboard.bind(learnerController))
);

resourceRouter.get(
  '/credentials/:id',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.getCredential.bind(learnerController))
);

resourceRouter.put(
  '/profile',
  authenticateToken,
  requireLearner,
  uploadProfilePhoto,
  asyncHandler(learnerController.updateMe.bind(learnerController))
);

// Contact verification - unified endpoints
resourceRouter.post(
  '/contacts/request',
  authenticateToken,
  requireLearner,
  authRateLimiter,
  asyncHandler(learnerController.requestContactVerification.bind(learnerController))
);

resourceRouter.post(
  '/contacts/verify',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.verifyContact.bind(learnerController))
);

// List credentials with pagination
resourceRouter.get(
  '/credentials',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.getMyCredentials.bind(learnerController))
);

// Credential QR endpoint
resourceRouter.get(
  '/:learner_id/credentials/:credential_id/qr',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.getCredentialQR.bind(learnerController))
);
// Roadmap and Skill Profile
resourceRouter.get(
  '/roadmap',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.getRoadmap.bind(learnerController))
);

resourceRouter.get(
  '/skill-profile',
  authenticateToken,
  requireLearner,
  asyncHandler(learnerController.getSkillProfile.bind(learnerController))
);


export { authRouter as learnerAuthRoutes, resourceRouter as learnerResourceRoutes };
export default authRouter; // Default export for backward compatibility
