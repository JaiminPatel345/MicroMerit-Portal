/**
 * Base Connector - Abstract base class for credential provider connectors
 */

import axios, { AxiosInstance } from 'axios';
import { Connector, FetchResult, VerifyResult, CanonicalCredential, ProviderConfig } from '../types';
import { logger } from '../../../utils/logger';

export abstract class BaseConnector implements Connector {
    protected config: ProviderConfig;
    protected httpClient: AxiosInstance;
    protected authToken?: string;

    constructor(config: ProviderConfig) {
        this.config = config;
        this.httpClient = axios.create({
            baseURL: config.base_url,
            timeout: 30000,
        });
    }

    get providerId(): string {
        return this.config.id;
    }

    get issuerId(): number {
        return this.config.issuer_id;
    }

    /**
     * Authenticate with the provider - must be implemented by subclasses
     */
    abstract authenticate(): Promise<void>;

    /**
     * Fetch credentials since a given timestamp - must be implemented by subclasses
     */
    abstract fetchSince(since: string, pageToken?: string): Promise<FetchResult>;

    /**
     * Verify a credential - default implementation, can be overridden
     */
    async verify(payload: any): Promise<VerifyResult> {
        // Default: trust the provider's data
        return { ok: true, meta: { verified_at: new Date().toISOString() } };
    }

    /**
     * Normalize provider data to canonical format - must be implemented by subclasses
     */
    abstract normalize(payload: any): CanonicalCredential;

    /**
     * Helper to set authorization header
     */
    protected setAuthHeader(token: string, type: 'Bearer' | 'API-Key' = 'Bearer'): void {
        this.authToken = token;
        if (type === 'Bearer') {
            this.httpClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            this.httpClient.defaults.headers.common['X-API-Key'] = token;
        }
    }

    /**
     * Log sync activity
     */
    protected log(message: string, data?: any): void {
        logger.info(`[${this.providerId}] ${message}`, data);
    }

    /**
     * Log error
     */
    protected logError(message: string, error?: any): void {
        logger.error(`[${this.providerId}] ${message}`, { error: error?.message || error });
    }
}
