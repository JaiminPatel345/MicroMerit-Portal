/**
 * Jaimin Pvt Ltd Connector - Handles Jaimin API integration
 */

import { BaseConnector } from './base.connector';
import { FetchResult, VerifyResult, CanonicalCredential, ProviderConfig } from '../types';

export class JaiminConnector extends BaseConnector {
    constructor(config: ProviderConfig) {
        super(config);
    }

    async authenticate(): Promise<void> {
        this.log('Setting up Jaimin API key authentication');

        // Jaimin uses API key - just set the header
        const apiKey = this.config.credentials.api_key;
        if (!apiKey) {
            throw new Error('API key not configured for Jaimin provider');
        }

        this.setAuthHeader(apiKey, 'API-Key');
        this.log('API key authentication configured');
    }

    async fetchSince(since: string, pageToken?: string): Promise<FetchResult> {
        this.log('Fetching certificates', { since, pageToken });

        try {
            // Parse offset from token if provided
            const offset = pageToken ? parseInt(pageToken) : 0;

            const response = await this.httpClient.get('/api/certs', {
                params: {
                    since,
                    limit: 20,
                    offset,
                },
            });

            const { data, meta } = response.data;

            this.log('Fetched certificates', {
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
        this.log('Verifying certificate', { cert_id: payload.cert_id });

        try {
            const response = await this.httpClient.post('/api/verify', {
                cert_id: payload.cert_id,
                trainee_email: payload.trainee_email,
            });

            return {
                ok: response.data.verified,
                meta: {
                    verified_at: new Date().toISOString(),
                    method: 'jaimin_api',
                    ...response.data,
                },
            };
        } catch (error) {
            this.logError('Verification failed', error);
            return { ok: false, meta: { error: 'Verification failed' } };
        }
    }

    normalize(payload: any): CanonicalCredential {
        // Jaimin response format:
        // {
        //   cert_id, trainee_email, trainee_name, program_name, program_code,
        //   industry_sector, skill_level, duration_hours, completed_on, issued_by
        // }

        return {
            learner_email: payload.trainee_email,
            learner_name: payload.trainee_name,
            certificate_title: payload.program_name,
            issued_at: new Date(payload.completed_on),
            certificate_code: payload.program_code,
            sector: payload.industry_sector,
            nsqf_level: payload.skill_level,
            max_hr: payload.duration_hours,
            min_hr: payload.duration_hours,
            awarding_bodies: Array.isArray(payload.issued_by) ? payload.issued_by : (payload.issued_by ? [payload.issued_by] : ['Jaimin Pvt Ltd']),
            occupation: payload.role || payload.industry_sector,
            tags: payload.tags || ['jaimin', 'corporate-training'],
            certificate_url: payload.certificate_url, // Capture the PDF/certificate URL if provided
            external_id: payload.cert_id,
            raw_data: payload,
        };
    }
}
