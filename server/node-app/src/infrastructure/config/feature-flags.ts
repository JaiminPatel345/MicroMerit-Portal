/**
 * Feature Flags Configuration
 * Centralized configuration for external credential sync system
 * All features are controlled via environment variables
 */

export const featureFlags = {
    // Master toggle for external credential sync
    externalSyncEnabled: process.env.EXTERNAL_SYNC_ENABLED === 'true',

    // Use dev KMS mock (AES encryption with env key)
    kmsMock: process.env.KMS_MOCK === 'true' || process.env.NODE_ENV === 'development',

    // Matching confidence threshold (0.0 - 1.0)
    matchThreshold: parseFloat(process.env.MATCH_THRESHOLD || '0.85'),

    // Polling interval in milliseconds (default: 5 minutes)
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '300000', 10),

    // Auto-subscribe to provider webhooks
    autoSubscribeWebhooks: process.env.AUTO_SUBSCRIBE_WEBHOOKS !== 'false',

    // Enable blockchain anchoring for verified credentials
    anchorOnChain: process.env.ANCHOR_ON_CHAIN === 'true',

    // DLQ retry configuration
    dlqMaxRetries: parseInt(process.env.DLQ_MAX_RETRIES || '3', 10),

    // Reconciliation threshold in hours (re-sync if last_sync older than this)
    reconciliationThresholdHours: parseInt(process.env.RECONCILIATION_THRESHOLD_HOURS || '24', 10),

    // Allow government ID matching (requires consent)
    allowGovIdMatching: process.env.ALLOW_GOV_ID_MATCHING === 'true',
};

export const apiSetuConfig = {
    baseUrl: process.env.APISETU_BASE_URL || process.env.DUMMY_APISETU_URL || 'http://localhost:4000',
    clientId: process.env.APISETU_CLIENT_ID || 'dev-client',
    clientSecret: process.env.APISETU_CLIENT_SECRET || 'dev-secret',
};

export const redisConfig = {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    maxRetriesPerRequest: null, // Required for BullMQ
};

export const kmsConfig = {
    // Dev KMS encryption key (must be 32 bytes for AES-256)
    devKey: process.env.KMS_DEV_KEY || 'micromerit-dev-kms-key-32chars!!',
};
