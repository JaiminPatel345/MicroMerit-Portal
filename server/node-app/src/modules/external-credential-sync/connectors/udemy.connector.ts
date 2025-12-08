/**
 * Udemy Connector - Handles Udemy API integration
 */

import { BaseConnector } from './base.connector';
import { FetchResult, VerifyResult, CanonicalCredential, ProviderConfig } from '../types';

export class UdemyConnector extends BaseConnector {
    constructor(config: ProviderConfig) {
        super(config);
    }

    async authenticate(): Promise<void> {
        this.log('Authenticating with Udemy OAuth2');

        try {
            const response = await this.httpClient.post('/oauth/token', {
                grant_type: 'client_credentials',
                client_id: this.config.credentials.client_id,
                client_secret: this.config.credentials.client_secret,
            });

            this.setAuthHeader(response.data.access_token);
            this.log('OAuth2 authentication successful');
        } catch (error) {
            this.logError('OAuth2 authentication failed', error);
            throw error;
        }
    }

    async fetchSince(since: string, pageToken?: string): Promise<FetchResult> {
        this.log('Fetching certificates', { since, pageToken });

        try {
            // Parse page from URL if provided
            let page = 1;
            if (pageToken) {
                const match = pageToken.match(/page=(\d+)/);
                if (match && match[1]) page = parseInt(match[1], 10);
            }

            const response = await this.httpClient.get('/api/v1/certificates', {
                params: {
                    completed_after: since,
                    page,
                    page_size: 20,
                },
            });

            const { count, next, results } = response.data;

            this.log('Fetched certificates', {
                count: results.length,
                total: count
            });

            return {
                items: results,
                next: next || undefined,
                total: count,
            };
        } catch (error) {
            this.logError('Fetch failed', error);
            throw error;
        }
    }

    async verify(payload: any): Promise<VerifyResult> {
        return {
            ok: true,
            meta: {
                verified_at: new Date().toISOString(),
                method: 'udemy_oauth',
                certificate_id: payload.id,
            },
        };
    }

    normalize(payload: any): CanonicalCredential {
        // Udemy response format:
        // {
        //   id, completion_date,
        //   course: { id, title, description, category, estimated_hours },
        //   user: { email, display_name },
        //   certificate_url
        // }

        return {
            learner_email: payload.user.email,
            learner_name: payload.user.display_name,
            certificate_title: payload.course.title,
            issued_at: new Date(payload.completion_date),
            certificate_code: payload.course.id,
            sector: payload.course.category || 'Online Learning',
            max_hr: payload.course.estimated_hours,
            min_hr: payload.course.estimated_hours,
            awarding_bodies: ['Udemy'],
            occupation: payload.course.category,
            tags: ['udemy', 'online-course'],
            description: payload.course.description,
            external_id: payload.id,
            raw_data: payload,
        };
    }
}
