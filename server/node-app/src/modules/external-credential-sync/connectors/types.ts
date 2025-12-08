/**
 * Connector Interface Types
 * Defines the contract for external credential providers (NSDC, DigiLocker, etc.)
 */

/**
 * Canonical credential format used internally
 * Provider-agnostic representation of a credential
 */
export interface CanonicalCredential {
    providerCredentialId: string;     // Unique ID from provider
    recipientEmail?: string;
    recipientPhone?: string;
    recipientName?: string;
    recipientDob?: string;            // YYYY-MM-DD format
    certificateTitle: string;
    issueDate: string;                // ISO date
    expiryDate?: string;              // ISO date
    skills?: string[];
    metadata?: Record<string, unknown>;
}

/**
 * Raw credential from provider (before normalization)
 */
export interface RawProviderCredential {
    id: string;
    signedPayload: string | Record<string, unknown>;
    signatureType: 'JWS' | 'HMAC' | 'PDF' | 'DSC' | 'NONE';
    signatureHeader?: string;         // For webhook verification
    rawData: Record<string, unknown>;
}

/**
 * Verification result from connector
 */
export interface VerificationResult {
    verified: boolean;
    method: 'JWS' | 'HMAC' | 'PDF' | 'DSC';
    kid?: string;                     // Key ID used for verification
    error?: string;
}

/**
 * Webhook subscription result
 */
export interface WebhookSubscriptionResult {
    subscribed: boolean;
    requiresApproval: boolean;
    webhookId?: string;
    error?: string;
}

/**
 * Fetch credentials options
 */
export interface FetchOptions {
    since?: Date;                     // Fetch credentials after this timestamp
    cursor?: string;                  // Pagination cursor
    pageSize?: number;                // Max items per page
    fullSync?: boolean;               // Ignore cursor, do full sync
}

/**
 * Fetch result with pagination
 */
export interface FetchResult {
    credentials: RawProviderCredential[];
    nextCursor?: string;
    hasMore: boolean;
}

/**
 * Connector interface - implement for each provider
 */
export interface ICredentialConnector {
    /**
     * Provider identifier (e.g., 'nsdc', 'digilocker')
     */
    readonly providerId: string;

    /**
     * Fetch credentials from provider
     * @param issuerId - Internal issuer ID
     * @param options - Pagination and filtering options
     */
    fetchCredentials(issuerId: number, options: FetchOptions): Promise<FetchResult>;

    /**
     * Subscribe to webhook notifications
     * @param issuerId - Internal issuer ID  
     * @param callbackUrl - URL to receive webhook events
     */
    subscribeWebhook(issuerId: number, callbackUrl: string): Promise<WebhookSubscriptionResult>;

    /**
     * Verify credential signature
     * @param credential - Raw credential with signature
     * @param jwksUrl - Optional JWKS URL for JWS verification
     */
    verify(credential: RawProviderCredential, jwksUrl?: string): Promise<VerificationResult>;

    /**
     * Normalize provider-specific format to canonical format
     * @param raw - Raw credential from provider
     */
    normalize(raw: RawProviderCredential): CanonicalCredential;

    /**
     * Verify webhook signature (for incoming webhooks)
     * @param payload - Raw request body
     * @param signature - Signature header value
     * @param secret - Webhook secret
     */
    verifyWebhookSignature(payload: string | Buffer, signature: string, secret?: string): Promise<boolean>;
}

/**
 * Registry of available connectors
 */
export type ConnectorRegistry = Map<string, ICredentialConnector>;
