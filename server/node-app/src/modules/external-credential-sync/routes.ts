/**
 * Routes for External Credential Sync admin endpoints
 */

import { Router } from 'express';
import { externalCredentialSyncController } from './controller';
import { authenticateToken } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/role';

const router = Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// GET /admin/external-sync/status
router.get('/status', externalCredentialSyncController.getStatus.bind(externalCredentialSyncController));

// GET /admin/external-sync/providers
router.get('/providers', externalCredentialSyncController.getProviders.bind(externalCredentialSyncController));

// POST /admin/external-sync/trigger
router.post('/trigger', externalCredentialSyncController.triggerSync.bind(externalCredentialSyncController));

// POST /admin/external-sync/scheduler/start
router.post('/scheduler/start', externalCredentialSyncController.startScheduler.bind(externalCredentialSyncController));

// POST /admin/external-sync/scheduler/stop
router.post('/scheduler/stop', externalCredentialSyncController.stopScheduler.bind(externalCredentialSyncController));

export default router;
