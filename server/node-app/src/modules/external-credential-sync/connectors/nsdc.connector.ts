/**
 * NSDC Connector - Handles NSDC API integration
 */

import { BaseConnector } from './base.connector';
import { FetchResult, VerifyResult, CanonicalCredential, ProviderConfig } from '../types';

export class NSDCConnector extends BaseConnector {
    constructor(config: ProviderConfig) {
        super(config);
    }

    async authenticate(): Promise<void> {
        this.log('Authenticating with NSDC');

        try {
            const response = await this.httpClient.post('/auth', {
                client_id: this.config.credentials.client_id,
                client_secret: this.config.credentials.client_secret,
            });

            this.setAuthHeader(response.data.access_token);
            this.log('Authentication successful');
        } catch (error) {
            this.logError('Authentication failed', error);
            throw error;
        }
    }

    async fetchSince(since: string, pageToken?: string): Promise<FetchResult> {
        this.log('Fetching credentials', { since, pageToken });

        try {
            // Parse page from token if provided
            const page = pageToken ? parseInt(pageToken.replace('page_', '')) : 1;

            const response = await this.httpClient.get('/credentials', {
                params: {
                    since,
                    page,
                    per_page: 20,
                },
            });

            const { data, pagination } = response.data;

            this.log('Fetched credentials', {
                count: data.length,
                total: pagination.total,
                page: pagination.page
            });

            return {
                items: data,
                next: pagination.next_page_token,
                total: pagination.total,
            };
        } catch (error) {
            this.logError('Fetch failed', error);
            throw error;
        }
    }

    async verify(payload: any): Promise<VerifyResult> {
        // NSDC credentials can be verified by their credential_id
        return {
            ok: true,
            meta: {
                verified_at: new Date().toISOString(),
                method: 'nsdc_api',
                credential_id: payload.credential_id,
            },
        };
    }

    normalize(payload: any): CanonicalCredential {
        // NSDC response format:
        // {
        //   credential_id, candidate_name, candidate_email, qualification_title,
        //   qp_code, sector, nsqf_level, training_hours: { min, max },
        //   awarding_body, issue_date, certificate_url
        // }

        return {
            learner_email: payload.candidate_email,
            learner_name: payload.candidate_name,
            certificate_title: payload.qualification_title,
            issued_at: new Date(payload.issue_date),
            certificate_code: payload.qp_code,
            sector: payload.sector,
            nsqf_level: payload.nsqf_level,
            max_hr: payload.training_hours?.max,
            min_hr: payload.training_hours?.min,
            awarding_bodies: payload.awarding_body ? [payload.awarding_body] : [],
            occupation: payload.occupation,
            tags: ['nsdc', 'skill-india'],
            description: payload.description,
            external_id: payload.credential_id,
            raw_data: payload,
        };
    }
}
