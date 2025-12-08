
import { Router } from 'express';
import { mockIntegrationController } from './controller';
import { authenticateToken } from '../../middleware/auth'; // Adjust import path

const router = Router();

// Learner endpoints
router.post('/digilocker/connect', authenticateToken, mockIntegrationController.connectDigiLocker);
router.post('/sip/connect', authenticateToken, mockIntegrationController.connectSIP);
router.get('/status', authenticateToken, mockIntegrationController.getStatus);
router.post('/sync', authenticateToken, mockIntegrationController.syncCredentials);

// Admin endpoint (Optional auth check)
router.post('/admin/sync-all', mockIntegrationController.forceSyncAll);

export const mockIntegrationRoutes = router;
