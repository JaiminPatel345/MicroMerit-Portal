/**
 * External Credential Sync Module
 * Main exports and module initialization
 */

// Connectors
export * from './connectors';

// Repository
export { externalCredentialSyncRepository } from './repository';

// Matching
export { matchCredentialToLearner, batchMatchCredentials } from './matching/matching-engine';

// Processing
export {
    processCredential,
    enqueueCredentialForProcessing,
    generateIdempotencyKey
} from './processing/credential-processor';

// Poller
export {
    pollIssuerCredentials,
    pollAllIssuers,
    runReconciliation
} from './poller/poller-worker';

// Routes
export { default as webhookRoutes } from './webhooks/routes';
export { default as adminSyncRoutes } from './admin/routes';
