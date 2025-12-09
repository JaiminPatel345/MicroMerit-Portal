/**
 * SIH (Smart India Hackathon) Connector - Handles SIH API integration
 */

import { BaseConnector } from './base.connector';
import { FetchResult, VerifyResult, CanonicalCredential, ProviderConfig } from '../types';

export class SIHConnector extends BaseConnector {
    constructor(config: ProviderConfig) {
        super(config);
    }

    async authenticate(): Promise<void> {
        this.log('Setting up SIH API key authentication');

        // SIH uses API key - just set the header
        const apiKey = this.config.credentials.api_key;
        if (!apiKey) {
            throw new Error('API key not configured for SIH provider');
        }

        this.setAuthHeader(apiKey, 'API-Key');
        this.log('API key authentication configured');
    }

    async fetchSince(since: string, pageToken?: string): Promise<FetchResult> {
        this.log('Fetching credentials', { since, pageToken });

        try {
            // Parse offset from token if provided
            const offset = pageToken ? parseInt(pageToken) : 0;

            const response = await this.httpClient.get('/api/credentials', {
                params: {
                    since,
                    limit: 20,
                    offset,
                },
            });

            const { data, meta } = response.data;

            this.log('Fetched credentials', {
                count: data.length,
                total: meta.total
            });

            return {
                items: data,
                next: meta.has_more ? String(meta.next_offset) : undefined,
                total: meta.total,
            };
        } catch (error) {
            this.logError('Fetch failed', error);
            throw error;
        }
    }

    async verify(payload: any): Promise<VerifyResult> {
        this.log('Verifying credential', { credential_id: payload.credential_id });

        try {
            const response = await this.httpClient.post('/api/verify', {
                credential_id: payload.credential_id,
                participant_email: payload.participant_email,
            });

            return {
                ok: response.data.verified,
                meta: {
                    verified_at: new Date().toISOString(),
                    method: 'sih_api',
                    ...response.data,
                },
            };
        } catch (error) {
            this.logError('Verification failed', error);
            return { ok: false, meta: { error: 'Verification failed' } };
        }
    }

    normalize(payload: any): CanonicalCredential {
        // SIH response format:
        // {
        //   credential_id, participant_email, participant_name, skill_title, skill_code,
        //   sector, proficiency_level, training_duration, completion_date, certifying_authority
        // }

        return {
            learner_email: payload.participant_email,
            learner_name: payload.participant_name,
            certificate_title: payload.skill_title,
            issued_at: new Date(payload.completion_date),
            certificate_code: payload.skill_code,
            sector: payload.sector,
            nsqf_level: payload.proficiency_level,
            max_hr: payload.training_duration,
            min_hr: payload.training_duration,
            awarding_bodies: payload.certifying_authority ? [payload.certifying_authority] : ['SIH (Smart India Hackathon)'],
            occupation: payload.sector,
            tags: ['sih', 'government-initiative', 'innovation'],
            external_id: payload.credential_id,
            raw_data: payload,
        };
    }
}
