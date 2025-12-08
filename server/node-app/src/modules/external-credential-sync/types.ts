/**
 * Types for External Credential Sync Module
 */

/**
 * Connector interface for external credential providers
 * Each provider implements this interface to normalize their specific API
 */
export interface Connector {
    /** Provider identifier (e.g., 'nsdc', 'udemy', 'jaimin') */
    providerId: string;

    /** Issuer ID in our database for this provider */
    issuerId: number;

    /**
     * Authenticate with the provider
     * Obtains and stores auth tokens for subsequent calls
     */
    authenticate(): Promise<void>;

    /**
     * Fetch credentials issued since a given timestamp
     * @param since - ISO date string to fetch credentials after
     * @param pageToken - Optional pagination token for subsequent pages
     * @returns Items and optional next page token
     */
    fetchSince(since: string, pageToken?: string): Promise<FetchResult>;

    /**
     * Verify a credential's authenticity with the provider
     * @param payload - Raw credential data to verify
     * @returns Verification result with status and metadata
     */
    verify(payload: any): Promise<VerifyResult>;

    /**
     * Normalize provider-specific credential format to canonical format
     * @param payload - Raw credential data from provider
     * @returns Normalized credential in our standard format
     */
    normalize(payload: any): CanonicalCredential;
}

export interface FetchResult {
    items: any[];
    next?: string;
    total?: number;
}

export interface VerifyResult {
    ok: boolean;
    meta: Record<string, any>;
}

/**
 * Canonical credential format - normalized output from all connectors
 * This is the standardized format used internally
 */
export interface CanonicalCredential {
    /** Learner's email address */
    learner_email: string;

    /** Learner's name (if available) */
    learner_name?: string;

    /** Certificate/qualification title */
    certificate_title: string;

    /** When the credential was issued */
    issued_at: Date;

    /** NQR/QP code (e.g., "2020/ITES/ITSSC/04327") */
    certificate_code?: string;

    /** Industry sector (e.g., "IT-ITeS", "Agriculture") */
    sector?: string;

    /** NSQF level (1-10) */
    nsqf_level?: number;

    /** Maximum training hours */
    max_hr?: number;

    /** Minimum training hours */
    min_hr?: number;

    /** Awarding body name */
    awarding_bodies?: string[];

    /** Occupation/job role */
    occupation?: string;

    /** Tags for categorization (e.g., ["nsdc", "digilocker"]) */
    tags: string[];

    /** Description of the credential */
    description?: string;

    /** External ID from the provider */
    external_id: string;

    /** Raw data from provider for reference */
    raw_data: any;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
    id: string;
    name: string;
    issuer_id: number;
    base_url: string;
    auth_type: 'jwt' | 'oauth2' | 'api_key';
    credentials: Record<string, string>;
    enabled: boolean;
}

/**
 * Sync state for tracking last sync per provider
 */
export interface SyncState {
    provider_id: string;
    last_sync_at: Date;
    last_successful_sync_at?: Date;
    credentials_synced: number;
    errors: string[];
    status: 'idle' | 'running' | 'completed' | 'failed';
}

/**
 * Sync job result
 */
export interface SyncJobResult {
    provider_id: string;
    credentials_processed: number;
    credentials_created: number;
    credentials_skipped: number;
    errors: string[];
    started_at: Date;
    completed_at: Date;
    duration_ms: number;
}
