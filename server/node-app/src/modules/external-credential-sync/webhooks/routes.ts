/**
 * Webhook Routes for External Credential Sync
 * Receives credential push notifications from NSDC and DigiLocker
 */

import { Router } from 'express';
import { webhookController } from './controller';

const router = Router();

/**
 * NSDC Webhook Endpoint
 * POST /webhooks/nsdc
 * Receives JWS-signed credential push events
 */
router.post('/nsdc', webhookController.handleNsdcWebhook);

/**
 * DigiLocker Webhook Endpoint (stub)
 * POST /webhooks/digilocker
 */
router.post('/digilocker', webhookController.handleDigiLockerWebhook);

/**
 * Health check for webhook endpoints
 * GET /webhooks/health
 */
router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
