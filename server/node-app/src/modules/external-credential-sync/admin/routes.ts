/**
 * Admin Routes for External Credential Sync
 */

import { Router } from 'express';
import { adminSyncController } from './controller';

const router = Router();

// List issuers with sync status
router.get('/issuers', adminSyncController.listIssuers);

// Get sync stats
router.get('/stats', adminSyncController.getStats);

// List external credentials
router.get('/external-credentials', adminSyncController.listExternalCredentials);

// List DLQ items
router.get('/dlq', adminSyncController.listDLQ);

// Retry DLQ item
router.post('/dlq/:id/retry', adminSyncController.retryDLQItem);

// Force sync for issuer
router.post('/issuers/:id/sync', adminSyncController.forceSyncIssuer);

// Get pending matches
router.get('/pending-matches', adminSyncController.listPendingMatches);

export default router;
