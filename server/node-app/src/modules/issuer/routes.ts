import { Router } from 'express';
import { issuerController } from './controller';
import { apiKeyController } from './apiKey.controller';
import { authenticateToken } from '../../middleware/auth';
import { requireIssuer } from '../../middleware/role';
import { asyncHandler } from '../../middleware/error';
import { authRateLimiter, registrationRateLimiter, apiKeyRateLimiter } from '../../middleware/rateLimit';
import { imageUpload } from '../../utils/multerConfig';

// Multer middleware for logo upload
const uploadLogo: any = imageUpload.single('logo');

// Auth routes (login, register, refresh) - mounted at /auth/issuer
const authRouter = Router();

authRouter.post(
  '/start-register',
  registrationRateLimiter,
  asyncHandler(issuerController.startRegistration.bind(issuerController))
);

authRouter.post(
  '/verify-register',
  asyncHandler(issuerController.verifyRegistration.bind(issuerController))
);

authRouter.post(
  '/login',
  authRateLimiter,
  asyncHandler(issuerController.login.bind(issuerController))
);

authRouter.post(
  '/refresh',
  asyncHandler(issuerController.refresh.bind(issuerController))
);

// Resource management routes - mounted at /issuer
const resourceRouter = Router();

// Profile management
resourceRouter.get(
  '/profile',
  authenticateToken,
  requireIssuer,
  asyncHandler(issuerController.getMe.bind(issuerController))
);

resourceRouter.put(
  '/profile',
  authenticateToken,
  requireIssuer,
  uploadLogo,
  asyncHandler(issuerController.updateMe.bind(issuerController))
);

// Dashboard stats
resourceRouter.get(
  '/stats',
  authenticateToken,
  requireIssuer,
  asyncHandler(issuerController.getDashboardStats.bind(issuerController))
);

// API key management
resourceRouter.post(
  '/api-keys',
  authenticateToken,
  requireIssuer,
  apiKeyRateLimiter,
  asyncHandler(apiKeyController.create.bind(apiKeyController))
);

resourceRouter.get(
  '/api-keys',
  authenticateToken,
  requireIssuer,
  asyncHandler(apiKeyController.list.bind(apiKeyController))
);

resourceRouter.get(
  '/api-keys/:id',
  authenticateToken,
  requireIssuer,
  asyncHandler(apiKeyController.getDetails.bind(apiKeyController))
);

resourceRouter.delete(
  '/api-keys/:id',
  authenticateToken,
  requireIssuer,
  asyncHandler(apiKeyController.revoke.bind(apiKeyController))
);

// Phone update routes
resourceRouter.post(
  '/phone/request',
  authenticateToken,
  requireIssuer,
  asyncHandler(issuerController.requestPhoneUpdate.bind(issuerController))
);

resourceRouter.post(
  '/phone/verify',
  authenticateToken,
  requireIssuer,
  asyncHandler(issuerController.verifyPhoneUpdate.bind(issuerController))
);

export { authRouter as issuerAuthRoutes, resourceRouter as issuerResourceRoutes };
export default authRouter; // Default export for backward compatibility
