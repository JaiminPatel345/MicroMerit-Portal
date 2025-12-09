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
import { writeToBlockchainQueued } from '../../services/blockchainClient';
import { buildCanonicalJson, computeDataHash } from '../../utils/canonicalJson';
import { logger } from '../../utils/logger';
import { aiService } from '../ai/ai.service';

export class ExternalCredentialSyncService {
    private minHourLen: number;
    private maxHourLen: number;

    constructor() {
        // Support new env vars (MIN_HOUR_LEN, MAX_HOUR_LEN) with fallback to old POSSIBLE_MAX_HOUR
        this.minHourLen = parseFloat(process.env.MIN_HOUR_LEN || '7.5');
        this.maxHourLen = parseFloat(process.env.MAX_HOUR_LEN || process.env.POSSIBLE_MAX_HOUR || '30');
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

            // Fetch only 1 credential per sync (not all pages)
            const fetchResult = await connector.fetchSince(sinceISO);
            const allItems = fetchResult.items;

            logger.info(`[${providerId}] Fetched ${allItems.length} credential(s)`);

            // Process each credential
            for (const item of allItems) {
                result.credentials_processed++;

                try {
                    await this.processCredential(connector, item);
                    result.credentials_created++;
                } catch (error: any) {
                    if (error.message?.includes('duplicate') || error.message?.includes('exists')) {
                        result.credentials_skipped++;
                        logger.debug(`[${providerId}] Skipped duplicate`, { error: error.message });
                    } else {
                        logger.error(`[${providerId}] Credential processing failed`, { error: error.message });
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

        // Validate course hours are within acceptable range
        // Check max_hr if available, otherwise check min_hr
        const courseHours = canonical.max_hr || canonical.min_hr;

        if (courseHours !== null && courseHours !== undefined) {
            if (courseHours > this.maxHourLen) {
                logger.debug(`Skipping credential with hours=${courseHours} > MAX_HOUR_LEN=${this.maxHourLen}`, {
                    credential_title: canonical.certificate_title,
                    max_hr: canonical.max_hr,
                    min_hr: canonical.min_hr
                });
                throw new Error(`Course hours (${courseHours}) exceed maximum allowed (${this.maxHourLen})`);
            }

            if (courseHours < this.minHourLen) {
                logger.debug(`Skipping credential with hours=${courseHours} < MIN_HOUR_LEN=${this.minHourLen}`, {
                    credential_title: canonical.certificate_title,
                    max_hr: canonical.max_hr,
                    min_hr: canonical.min_hr
                });
                throw new Error(`Course hours (${courseHours}) below minimum required (${this.minHourLen})`);
            }
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

        // Download PDF from external provider and upload to IPFS FIRST
        let pdfUrl: string | null = null;
        let ipfsCid: string | null = null;
        let pdfBuffer: Buffer | null = null; // Store buffer for AI processing

        if (canonical.certificate_url) {
            try {
                logger.info('Attempting to download PDF from external provider', {
                    credential_id: credentialId,
                    certificate_url: canonical.certificate_url,
                    external_id: canonical.external_id
                });

                // Get provider config for authentication
                const providerId = canonical.tags && canonical.tags.length > 0 ? canonical.tags[0] : null;
                const providerConfig = providerId ? getProviderConfig(providerId) : null;

                logger.debug('Provider config retrieved', {
                    credential_id: credentialId,
                    provider_id: providerId,
                    has_config: !!providerConfig,
                    has_api_key: !!providerConfig?.credentials?.api_key
                });

                // Download PDF from external provider
                const headers: Record<string, string> = {};
                if (providerConfig?.credentials.api_key) {
                    headers['X-API-Key'] = providerConfig.credentials.api_key;
                    logger.debug('Added API key to request headers', {
                        credential_id: credentialId
                    });
                }

                logger.info('Starting PDF download from URL', {
                    credential_id: credentialId,
                    url: canonical.certificate_url,
                    has_auth_headers: Object.keys(headers).length > 0
                });

                const response = await axios.get(canonical.certificate_url, {
                    responseType: 'arraybuffer',
                    headers,
                    timeout: 30000, // 30 second timeout
                });

                logger.info('PDF download response received', {
                    credential_id: credentialId,
                    status: response.status,
                    content_type: response.headers['content-type'],
                    content_length: response.headers['content-length']
                });

                pdfBuffer = Buffer.from(response.data);

                if (pdfBuffer.length === 0) {
                    throw new Error('Downloaded PDF is empty (0 bytes)');
                }

                logger.info('PDF downloaded successfully, uploading directly to IPFS', {
                    credential_id: credentialId,
                    buffer_size: pdfBuffer.length
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
                    error_name: error.name,
                    response_status: error.response?.status,
                    response_data: error.response?.data ?
                        (typeof error.response.data === 'string' ? error.response.data.substring(0, 200) : JSON.stringify(error.response.data).substring(0, 200))
                        : undefined,
                    is_timeout: error.code === 'ECONNABORTED' || error.message?.includes('timeout'),
                    is_network: error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT'
                });

                // Optional Mode: Log error but continue credential creation without PDF
                logger.warn('Proceeding with credential creation without PDF/IPFS', {
                    credential_id: credentialId,
                    reason: 'PDF download or upload failed'
                });
                pdfUrl = null;
                ipfsCid = null;
                pdfBuffer = null;
            }
        } else {
            logger.info('No certificate_url provided, creating credential without PDF', {
                credential_id: credentialId
            });
        }

        // NOW compute data hash with the IPFS CID included in canonical JSON
        const canonicalJson = buildCanonicalJson({
            credential_id: credentialId,
            learner_id: learnerId,
            learner_email: canonical.learner_email,
            issuer_id: issuerId,
            certificate_title: canonical.certificate_title,
            issued_at: canonical.issued_at,
            network,
            contract_address: contractAddress,
            ipfs_cid: ipfsCid,  // Include the CID we just got from IPFS
            pdf_url: pdfUrl,     // Include the PDF URL
            tx_hash: null,
            data_hash: null,
        });
        const dataHash = computeDataHash(canonicalJson);

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

        // Queue blockchain write (if not mocked)
        if (process.env.BLOCKCHAIN_MOCK_ENABLED !== 'true') {
            try {
                await writeToBlockchainQueued(credentialId, dataHash, ipfsCid || '');
                logger.info(`Blockchain write queued for external credential`, { credential_id: credentialId });
            } catch (err: any) {
                logger.error(`Failed to queue blockchain write for ${credentialId}`, {
                    error: err.message
                });
                // Continue even if queueing fails - status remains 'pending'
            }
        } else {
            logger.info(`Blockchain write skipped (mock mode) for ${credentialId}`);
        }

        // AI Analysis Layer: Run OCR, stackability, and pathway analysis asynchronously
        // All analyses run in parallel after credential creation
        this.processAIAnalysisAsync(credentialId, canonical, metadata, pdfBuffer, issuer.name).catch(error => {
            logger.error(`AI analysis failed for ${credentialId}`, { error: error.message });
            // Don't block credential creation if AI analysis fails
        });
    }

    /**
     * Process AI analysis asynchronously (OCR + stackability + pathway)
     * Runs after credential creation and updates metadata with AI insights
     */
    private async processAIAnalysisAsync(
        credentialId: string,
        canonical: CanonicalCredential,
        metadata: any,
        pdfBuffer: Buffer | null,
        issuerName: string
    ): Promise<void> {
        try {
            logger.info(`Starting AI analysis for credential ${credentialId}`, {
                certificate_title: canonical.certificate_title,
                nsqf_level: canonical.nsqf_level,
                occupation: canonical.occupation,
                has_pdf: !!pdfBuffer
            });

            let aiExtractedData: any = {
                skills: [],
                nsqf: canonical.nsqf_level ? {
                    level: canonical.nsqf_level,
                    confidence: 0.8,
                    reasoning: `External credential from ${canonical.tags?.[0] || 'external source'}`
                } : { level: 1, confidence: 0.0, reasoning: '' },
                keywords: canonical.tags || [],
                description: canonical.description || ''
            };

            // STEP 1: OCR Processing (if PDF is available)
            if (pdfBuffer) {
                try {
                    logger.info(`Processing OCR for credential ${credentialId}`);

                    const ocrResult = await aiService.processOCR(
                        pdfBuffer,
                        `credential-${credentialId}.pdf`,
                        canonical.learner_email,
                        canonical.certificate_title,
                        issuerName,
                        [] // No NSQF context for external credentials
                    );

                    // Extract AI data from OCR result
                    aiExtractedData = {
                        skills: ocrResult.skills || [],
                        nsqf: ocrResult.nsqf || aiExtractedData.nsqf,
                        nsqf_alignment: ocrResult.nsqf_alignment || undefined,
                        keywords: ocrResult.keywords || [],
                        description: ocrResult.description || canonical.description || '',
                        certificate_metadata: ocrResult.certificate_metadata || {}
                    };

                    logger.info(`OCR processing completed for ${credentialId}`, {
                        skills_count: aiExtractedData.skills?.length || 0,
                        nsqf_level: aiExtractedData.nsqf?.level,
                        keywords_count: aiExtractedData.keywords?.length || 0
                    });

                } catch (ocrError: any) {
                    logger.error(`OCR processing failed for ${credentialId}`, {
                        error: ocrError.message
                    });
                    // Continue with default extracted data
                }
            } else {
                logger.info(`No PDF available for OCR processing, using metadata for ${credentialId}`);
            }

            // Prepare certificate data for pathway analysis
            const certificateData = {
                certificate_title: canonical.certificate_title,
                issuer_name: issuerName,
                issued_at: canonical.issued_at,
                metadata: {
                    ai_extracted: aiExtractedData
                }
            };

            // Extract skills names for stackability analysis
            const skillNames = aiExtractedData.skills?.map((s: any) =>
                typeof s === 'string' ? s : s.name
            ) || [];

            // STEP 2: Run stackability and pathway analyses in parallel
            const [stackabilityResult, pathwayResult] = await Promise.allSettled([
                // Call 1: Stackability Analysis
                aiService.analyzeStackability({
                    code: canonical.certificate_code || undefined,
                    level: aiExtractedData.nsqf?.level || canonical.nsqf_level || undefined,
                    progression_pathway: canonical.description || undefined,
                    qualification_type: canonical.tags?.[0] || undefined,
                    sector_name: canonical.sector || undefined,
                    training_delivery_hours: canonical.max_hr ? `${canonical.max_hr} hours` : undefined,
                    min_notational_hours: canonical.min_hr || undefined,
                    max_notational_hours: canonical.max_hr || undefined,
                    proposed_occupation: canonical.occupation || undefined,
                    skills: skillNames
                }),
                // Call 2: Pathway/Roadmap Generation
                aiService.generatePathway([certificateData], {
                    occupation: canonical.occupation,
                    nsqf_level: aiExtractedData.nsqf?.level || canonical.nsqf_level
                })
            ]);

            // Process results
            const aiAnalysis: any = {};

            if (stackabilityResult.status === 'fulfilled' && stackabilityResult.value) {
                aiAnalysis.stackability = stackabilityResult.value;
                logger.info(`Stackability analysis completed for ${credentialId}`, {
                    pathways_count: stackabilityResult.value.pathways?.length || 0
                });
            } else if (stackabilityResult.status === 'rejected') {
                logger.warn(`Stackability analysis failed for ${credentialId}`, {
                    reason: stackabilityResult.reason
                });
            }

            if (pathwayResult.status === 'fulfilled' && pathwayResult.value) {
                aiAnalysis.pathway = pathwayResult.value;
                logger.info(`Pathway generation completed for ${credentialId}`);
            } else if (pathwayResult.status === 'rejected') {
                logger.warn(`Pathway generation failed for ${credentialId}`, {
                    reason: pathwayResult.reason
                });
            }

            // Update credential metadata with both OCR extracted data and AI analysis
            const updatedMetadata = {
                ...metadata,
                ai_extracted: aiExtractedData,
                ai_analysis: aiAnalysis,
                ai_processing_completed_at: new Date().toISOString()
            };

            await credentialIssuanceRepository.updateCredentialMetadata(
                credentialId,
                updatedMetadata
            );

            logger.info(`AI processing results saved to credential ${credentialId}`, {
                has_ocr_data: !!pdfBuffer,
                skills_extracted: aiExtractedData.skills?.length || 0,
                has_stackability: !!aiAnalysis.stackability,
                has_pathway: !!aiAnalysis.pathway
            });

        } catch (error: any) {
            logger.error(`Unexpected error in AI analysis for ${credentialId}`, {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Process blockchain write asynchronously
     * @deprecated This method is no longer used - blockchain writes are handled by BullMQ queue
     */
    private async processBlockchainAsync(credentialId: string, dataHash: string): Promise<void> {
        logger.warn('processBlockchainAsync called but is deprecated - use queue instead', {
            credential_id: credentialId
        });

        try {
            await writeToBlockchainQueued(credentialId, dataHash, '');
        } catch (error: any) {
            logger.error('Failed to queue blockchain write in deprecated method', {
                credential_id: credentialId,
                error: error.message
            });
            throw error;
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
