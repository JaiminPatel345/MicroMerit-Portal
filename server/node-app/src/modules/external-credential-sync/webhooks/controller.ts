/**
 * Webhook Controller
 * Handles incoming webhook requests from external providers
 */

import { Request, Response } from 'express';
import { getNsdcConnector } from '../connectors';
import { enqueueCredentialForProcessing, generateIdempotencyKey } from '../processing/credential-processor';
import { featureFlags } from '../../../infrastructure/config/feature-flags';
import { logger } from '../../../utils/logger';
import { prisma } from '../../../utils/prisma';

class WebhookController {
    /**
     * Handle NSDC webhook
     * Verifies signature and enqueues for processing
     */
    async handleNsdcWebhook(req: Request, res: Response): Promise<void> {
        // Feature flag check
        if (!featureFlags.externalSyncEnabled) {
            res.status(503).json({ error: 'External sync disabled' });
            return;
        }

        try {
            const signature = req.headers['x-signature'] as string ||
                req.headers['x-webhook-signature'] as string;

            // Quick-ack to provider (respond within 5 seconds)
            res.status(200).json({ received: true });

            // Process in background
            await this.processNsdcWebhookAsync(req.body, signature);
        } catch (error) {
            logger.error('NSDC webhook handler error:', error);
            // Already responded 200, so just log
        }
    }

    /**
     * Process NSDC webhook asynchronously
     */
    private async processNsdcWebhookAsync(payload: any, signature?: string): Promise<void> {
        try {
            // Extract credential data
            const credentialId = payload.credential_id || payload.id;
            const registryId = payload.partner_id || payload.provider_id;

            if (!credentialId) {
                logger.warn('NSDC webhook missing credential_id');
                return;
            }

            // Find issuer by registry_id
            const issuer = await prisma.issuer.findFirst({
                where: { registry_id: registryId },
                select: { id: true, accept_external: true },
            });

            if (!issuer) {
                logger.warn(`No issuer found for registry_id: ${registryId}`);
                return;
            }

            if (!issuer.accept_external) {
                logger.info(`Issuer ${issuer.id} does not accept external credentials`);
                return;
            }

            // Verify signature if provided
            if (signature) {
                const connector = getNsdcConnector();
                // Get webhook secret from env or issuer config
                const secret = process.env.NSDC_WEBHOOK_SECRET;

                if (secret) {
                    const valid = await connector.verifyWebhookSignature(
                        JSON.stringify(payload),
                        signature,
                        secret
                    );

                    if (!valid) {
                        logger.warn(`Invalid webhook signature for credential ${credentialId}`);
                        return;
                    }
                }
            }

            // Generate idempotency key and enqueue
            const idempotencyKey = generateIdempotencyKey('nsdc', registryId, credentialId);

            await enqueueCredentialForProcessing(
                'nsdc',
                issuer.id,
                payload,
                idempotencyKey,
                signature
            );

            logger.info(`Enqueued NSDC webhook credential: ${credentialId}`);
        } catch (error) {
            logger.error('Failed to process NSDC webhook:', error);
        }
    }

    /**
     * Handle DigiLocker webhook (stub)
     */
    async handleDigiLockerWebhook(req: Request, res: Response): Promise<void> {
        if (!featureFlags.externalSyncEnabled) {
            res.status(503).json({ error: 'External sync disabled' });
            return;
        }

        // Stub - acknowledge but don't process
        logger.info('DigiLocker webhook received (stub - not processing)');
        res.status(200).json({ received: true, message: 'DigiLocker integration not yet implemented' });
    }
}

export const webhookController = new WebhookController();
