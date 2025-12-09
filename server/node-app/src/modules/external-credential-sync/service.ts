/**
 * External Credential Sync Service
 * Orchestrates syncing credentials from external providers
 */

import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import axios from 'axios';
import { Connector, CanonicalCredential, SyncJobResult, SyncState } from './types';
import { createConnector, getAllEnabledConnectors, getProviderConfig } from './connector.factory';
import { externalCredentialSyncRepository } from './repository';
import { credentialIssuanceRepository } from '../credential-issuance/repository';
import { uploadToFilebase } from '../../utils/filebase';
import { writeToBlockchain } from '../../services/blockchainClient';
import { buildCanonicalJson, computeDataHash } from '../../utils/canonicalJson';
import { logger } from '../../utils/logger';

class ExternalCredentialSyncService {
    private possibleMaxHour: number;

    constructor() {
        this.possibleMaxHour = parseInt(process.env.POSSIBLE_MAX_HOUR || '1000');
    }

    /**
     * Sync credentials from a specific provider
     */
    async syncProvider(providerId: string): Promise<SyncJobResult> {
        const startedAt = new Date();
        const result: SyncJobResult = {
            provider_id: providerId,
            credentials_processed: 0,
            credentials_created: 0,
            credentials_skipped: 0,
            errors: [],
            started_at: startedAt,
            completed_at: startedAt,
            duration_ms: 0,
        };

        try {
            // Update sync state to running
            const syncState: SyncState = {
                provider_id: providerId,
                last_sync_at: startedAt,
                credentials_synced: 0,
                errors: [],
                status: 'running',
            };
            externalCredentialSyncRepository.updateSyncState(syncState);

            // Create connector
            const connector = createConnector(providerId);
            if (!connector) {
                throw new Error(`Provider ${providerId} not configured or disabled`);
            }

            // Authenticate
            logger.info(`[${providerId}] Authenticating...`);
            await connector.authenticate();

            // Get last sync timestamp
            const lastSync = externalCredentialSyncRepository.getLastSyncTimestamp(providerId);
            const sinceISO = lastSync.toISOString();
            logger.info(`[${providerId}] Fetching credentials since ${sinceISO}`);

            // Fetch all pages
            let pageToken: string | undefined;
            let allItems: any[] = [];

            do {
                const fetchResult = await connector.fetchSince(sinceISO, pageToken);
                allItems = allItems.concat(fetchResult.items);
                pageToken = fetchResult.next;

                // Safety limit
                if (allItems.length > 1000) {
                    logger.warn(`[${providerId}] Reached item limit (1000)`);
                    break;
                }
            } while (pageToken);

            logger.info(`[${providerId}] Fetched ${allItems.length} credentials`);

            // Process each credential
            for (const item of allItems) {
                result.credentials_processed++;

                try {
                    await this.processCredential(connector, item);
                    result.credentials_created++;
                } catch (error: any) {
                    if (error.message?.includes('duplicate') || error.message?.includes('exists')) {
                        result.credentials_skipped++;
                    } else {
                        result.errors.push(`${error.message}`);
                    }
                }
            }

            // Update sync state
            syncState.status = 'completed';
            syncState.last_successful_sync_at = new Date();
            syncState.credentials_synced = result.credentials_created;
            externalCredentialSyncRepository.updateSyncState(syncState);

        } catch (error: any) {
            result.errors.push(error.message);

            // Update sync state to failed
            const syncState: SyncState = {
                provider_id: providerId,
                last_sync_at: startedAt,
                credentials_synced: 0,
                errors: [error.message],
                status: 'failed',
            };
            externalCredentialSyncRepository.updateSyncState(syncState);

            logger.error(`[${providerId}] Sync failed`, { error: error.message });
        }

        result.completed_at = new Date();
        result.duration_ms = result.completed_at.getTime() - startedAt.getTime();

        logger.info(`[${providerId}] Sync completed`, {
            processed: result.credentials_processed,
            created: result.credentials_created,
            skipped: result.credentials_skipped,
            errors: result.errors.length,
            duration_ms: result.duration_ms,
        });

        return result;
    }

    /**
     * Sync all enabled providers
     */
    async syncAll(): Promise<SyncJobResult[]> {
        const connectors = getAllEnabledConnectors();
        logger.info(`Starting sync for ${connectors.length} providers`);

        const results: SyncJobResult[] = [];

        for (const connector of connectors) {
            const result = await this.syncProvider(connector.providerId);
            results.push(result);
        }

        return results;
    }

    /**
     * Process a single credential from external provider
     */
    private async processCredential(connector: Connector, rawData: any): Promise<void> {
        // Normalize to canonical format
        const canonical = connector.normalize(rawData);

        // Check if hours exceeds threshold
        if (canonical.max_hr && canonical.max_hr > this.possibleMaxHour) {
            logger.debug(`Skipping credential with max_hr=${canonical.max_hr} > ${this.possibleMaxHour}`);
            throw new Error('Hours exceed threshold');
        }

        // Check for duplicates
        const exists = await externalCredentialSyncRepository.credentialExists(
            canonical.learner_email,
            canonical.certificate_title,
            connector.issuerId
        );

        if (exists) {
            throw new Error('Credential already exists (duplicate)');
        }

        // Verify with provider (optional)
        const verification = await connector.verify(rawData);
        if (!verification.ok) {
            logger.warn(`Credential verification failed for ${canonical.external_id}`);
            throw new Error('Verification failed');
        }

        // Create the credential in our system
        await this.createCredential(connector.issuerId, canonical);
    }

    /**
     * Create a credential in the database
     */
    private async createCredential(issuerId: number, canonical: CanonicalCredential): Promise<void> {
        // Find or check learner
        const learner = await externalCredentialSyncRepository.findLearnerByEmail(canonical.learner_email);
        const learnerId = learner?.id || null;
        const status = learner ? 'issued' : 'unclaimed';

        // Find issuer
        const issuer = await externalCredentialSyncRepository.findIssuerById(issuerId);
        if (!issuer) {
            throw new Error(`Issuer ${issuerId} not found`);
        }

        // Generate credential ID
        const credentialId = uuidv4();

        // For external credentials, we don't have a PDF, so we create a metadata-only credential
        const network = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
        const contractAddress = process.env.BLOCKCHAIN_CONTRACT_ADDRESS || '';

        // Build metadata with external credential fields
        const metadata = {
            credential_id: credentialId,
            learner_id: learnerId,
            learner_email: canonical.learner_email,
            learner_name: canonical.learner_name,
            issuer_id: issuerId,
            issuer_name: issuer.name,
            certificate_title: canonical.certificate_title,
            issued_at: canonical.issued_at.toISOString(),

            // External credential specific fields
            certificate_code: canonical.certificate_code,
            sector: canonical.sector,
            nsqf_level: canonical.nsqf_level,
            max_hr: canonical.max_hr,
            min_hr: canonical.min_hr,
            awarding_bodies: canonical.awarding_bodies,
            occupation: canonical.occupation,
            tags: canonical.tags,
            description: canonical.description,
            external_id: canonical.external_id,

            // Source tracking
            source: 'external_sync',
            provider_id: canonical.tags[0], // First tag is provider ID
            synced_at: new Date().toISOString(),

            // AI extracted placeholder
            ai_extracted: {
                skills: [],
                nsqf_alignment: canonical.nsqf_level ? {
                    nsqf_level: canonical.nsqf_level,
                    job_role: canonical.occupation,
                    verified_by_issuer: false,
                } : undefined,
            },

            blockchain: {
                network,
                contract_address: contractAddress,
            },
            blockchain_status: 'pending',
        };

        // Compute data hash
        const canonicalJson = buildCanonicalJson({
            credential_id: credentialId,
            learner_id: learnerId,
            learner_email: canonical.learner_email,
            issuer_id: issuerId,
            certificate_title: canonical.certificate_title,
            issued_at: canonical.issued_at,
            network,
            contract_address: contractAddress,
            ipfs_cid: null,
            pdf_url: null,
            tx_hash: null,
            data_hash: null,
        });
        const dataHash = computeDataHash(canonicalJson);

        // Download PDF from external provider and upload to IPFS
        let pdfUrl: string | null = null;
        let ipfsCid: string | null = null;

        if (canonical.certificate_url) {
            try {
                logger.info('Downloading PDF from external provider', {
                    credential_id: credentialId,
                    certificate_url: canonical.certificate_url
                });

                // Get provider config for authentication
                const providerId = canonical.tags && canonical.tags.length > 0 ? canonical.tags[0] : null;
                const providerConfig = providerId ? getProviderConfig(providerId) : null;

                // Download PDF from external provider
                const headers: Record<string, string> = {};
                if (providerConfig?.credentials.api_key) {
                    headers['X-API-Key'] = providerConfig.credentials.api_key;
                }

                const response = await axios.get(canonical.certificate_url, {
                    responseType: 'arraybuffer',
                    headers,
                    timeout: 30000, // 30 second timeout
                });

                const pdfBuffer = Buffer.from(response.data);

                logger.info('PDF downloaded, uploading to Filebase', {
                    credential_id: credentialId,
                    size: pdfBuffer.length
                });

                // Upload to Filebase/IPFS
                const uploadResult = await uploadToFilebase(
                    pdfBuffer,
                    `credential-${credentialId}.pdf`,
                    'application/pdf'
                );

                ipfsCid = uploadResult.cid;
                pdfUrl = uploadResult.gateway_url;

                logger.info('PDF uploaded to IPFS', {
                    credential_id: credentialId,
                    ipfs_cid: ipfsCid,
                    gateway_url: pdfUrl
                });

            } catch (error: any) {
                logger.error('Failed to download/upload PDF from external provider', {
                    credential_id: credentialId,
                    certificate_url: canonical.certificate_url,
                    error_message: error.message,
                    error_code: error.code,
                    response_status: error.response?.status,
                    response_headers: error.response?.headers
                });

                // Continue without PDF - we'll still create the credential
                // Store the original URL as fallback
                pdfUrl = canonical.certificate_url;
                ipfsCid = null;
            }
        }

        logger.info('Creating external credential', {
            credential_id: credentialId,
            pdf_url: pdfUrl,
            ipfs_cid: ipfsCid,
            has_certificate_url: !!canonical.certificate_url
        });

        // Create credential in database
        await credentialIssuanceRepository.createCredential({
            credential_id: credentialId,
            learner_id: learnerId,
            learner_email: canonical.learner_email,
            issuer_id: issuerId,
            certificate_title: canonical.certificate_title,
            issued_at: canonical.issued_at,
            ipfs_cid: ipfsCid,
            pdf_url: pdfUrl,
            tx_hash: null,
            data_hash: dataHash,
            metadata,
            status,
            // External credential fields
            certificate_code: canonical.certificate_code || null,
            sector: canonical.sector || null,
            nsqf_level: canonical.nsqf_level || null,
            max_hr: canonical.max_hr || null,
            min_hr: canonical.min_hr || null,
            awarding_bodies: canonical.awarding_bodies || null,
            occupation: canonical.occupation || null,
            tags: canonical.tags || null,
        });

        logger.info(`Created external credential`, {
            credential_id: credentialId,
            learner_email: canonical.learner_email,
            title: canonical.certificate_title,
            provider: canonical.tags[0],
        });

        // Optionally trigger blockchain write async (if not mocked)
        if (process.env.BLOCKCHAIN_MOCK_ENABLED !== 'true') {
            logger.info(`Triggering blockchain write for external credential`, { credential_id: credentialId });
            this.processBlockchainAsync(credentialId, dataHash).catch(err => {
                logger.error(`Blockchain write failed for ${credentialId}`, {
                    error: err.message,
                    stack: err.stack
                });
            });
        } else {
            logger.info(`Blockchain write skipped (mock mode) for ${credentialId}`);
        }
    }

    /**
     * Process blockchain write asynchronously
     */
    private async processBlockchainAsync(credentialId: string, dataHash: string): Promise<void> {
        try {
            logger.info(`Starting blockchain write for external credential`, {
                credential_id: credentialId,
                data_hash: dataHash
            });

            const result = await writeToBlockchain(credentialId, dataHash, '');

            logger.info(`Blockchain write succeeded, updating credential`, {
                credential_id: credentialId,
                tx_hash: result.tx_hash
            });

            await credentialIssuanceRepository.updateCredential(credentialId, {
                tx_hash: result.tx_hash,
                metadata: {
                    blockchain_status: 'confirmed',
                },
            });

            logger.info(`External credential updated with blockchain info`, {
                credential_id: credentialId,
                tx_hash: result.tx_hash
            });

            // Verify the update worked
            const updated = await credentialIssuanceRepository.findCredentialById(credentialId);
            logger.info(`Verified external credential blockchain update`, {
                credential_id: credentialId,
                tx_hash_in_db: updated?.tx_hash,
                blockchain_status: (updated?.metadata as any)?.blockchain_status
            });

        } catch (error: any) {
            logger.error(`External credential blockchain processing failed`, {
                credential_id: credentialId,
                error: error.message,
                stack: error.stack
            });

            await credentialIssuanceRepository.updateCredential(credentialId, {
                metadata: {
                    blockchain_status: 'failed',
                    blockchain_error: error.message,
                },
            });
        }
    }

    /**
     * Get sync status for all providers
     */
    getSyncStatus(): SyncState[] {
        return externalCredentialSyncRepository.getAllSyncStates();
    }

    /**
     * Get sync status for a specific provider
     */
    getProviderSyncStatus(providerId: string): SyncState | undefined {
        return externalCredentialSyncRepository.getSyncState(providerId);
    }
}

export const externalCredentialSyncService = new ExternalCredentialSyncService();
