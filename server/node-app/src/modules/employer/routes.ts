import { Router } from 'express';
import { employerController } from './controller';
import { asyncHandler } from '../../middleware/error';
import { imageUpload, documentUpload } from '../../utils/multerConfig';
import { authenticateToken } from '../../middleware/auth';
import { requireEmployer } from '../../middleware/role';

const authRouter = Router();
const resourceRouter = Router();

// ... existing routes ...

authRouter.post(
    '/register',
    imageUpload.single('document'),
    asyncHandler(employerController.register.bind(employerController))
);

authRouter.post(
    '/login',
    asyncHandler(employerController.login.bind(employerController))
);

authRouter.post(
    '/refresh',
    asyncHandler(employerController.refreshToken.bind(employerController))
);

authRouter.post(
    '/verify-email',
    asyncHandler(employerController.verifyEmail.bind(employerController))
);

// Resource Routes
resourceRouter.get(
    '/me',
    authenticateToken,
    asyncHandler(employerController.getMe.bind(employerController))
);

resourceRouter.put(
    '/me',
    authenticateToken,
    asyncHandler(employerController.updateMe.bind(employerController))
);

resourceRouter.post(
    '/verify',
    authenticateToken,
    requireEmployer,
    asyncHandler(employerController.verify.bind(employerController))
);

resourceRouter.post(
    '/verify/bulk',
    authenticateToken,
    requireEmployer,
    asyncHandler(employerController.bulkVerify.bind(employerController))
);

resourceRouter.get(
    '/search',
    authenticateToken,
    requireEmployer,
    asyncHandler(employerController.searchCandidates.bind(employerController))
);

resourceRouter.get(
    '/dashboard',
    authenticateToken,
    requireEmployer,
    asyncHandler(employerController.getDashboardStats.bind(employerController))
);

resourceRouter.post(
    '/extract-id',
    authenticateToken,
    requireEmployer,
    documentUpload.single('file'),
    asyncHandler(employerController.extractCredentialId.bind(employerController))
);

resourceRouter.post(
    '/bulk-verify-upload',
    authenticateToken,
    requireEmployer,
    (req, res, next) => {
        // Use dynamic import or require to avoid circular dependency issues if any,
        // but here we just need to import bulkUpload from multerConfig
        const { bulkUpload } = require('../../utils/multerConfig');
        bulkUpload.single('file')(req, res, next);
    },
    asyncHandler(employerController.bulkVerifyUpload.bind(employerController))
);

export { authRouter as employerAuthRoutes, resourceRouter as employerResourceRoutes };
