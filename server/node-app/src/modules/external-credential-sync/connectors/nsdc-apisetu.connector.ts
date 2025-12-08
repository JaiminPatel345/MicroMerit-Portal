/**
 * NSDC (API-Setu) Connector Implementation
 * Handles fetching, verifying, and normalizing credentials from NSDC/API-Setu
 */

import axios, { AxiosInstance } from 'axios';
import * as jose from 'jose';
import crypto from 'crypto';
import {
    ICredentialConnector,
    RawProviderCredential,
    CanonicalCredential,
    FetchOptions,
    FetchResult,
    VerificationResult,
    WebhookSubscriptionResult
} from './types';
import { apiSetuConfig } from '../../../infrastructure/config/feature-flags';
import { logger } from '../../../utils/logger';
import { prisma } from '../../../utils/prisma';

// Cache for JWKS
const jwksCache = new Map<string, { keys: jose.JWK[]; fetchedAt: number }>();
const JWKS_CACHE_TTL = 3600000; // 1 hour

export class NsdcApiSetuConnector implements ICredentialConnector {
    readonly providerId = 'nsdc';
    private client: AxiosInstance;
    private accessToken: string | null = null;
    private tokenExpiresAt: number = 0;

    constructor() {
        this.client = axios.create({
            baseURL: apiSetuConfig.baseUrl,
            timeout: 30000,
        });
    }

    /**
     * Get OAuth access token (client_credentials flow)
     */
    private async getAccessToken(): Promise<string> {
        if (this.accessToken && Date.now() < this.tokenExpiresAt - 60000) {
            return this.accessToken;
        }

        try {
            const response = await this.client.post('/oauth/token', {
                grant_type: 'client_credentials',
                client_id: apiSetuConfig.clientId,
                client_secret: apiSetuConfig.clientSecret,
            });

            this.accessToken = response.data.access_token;
            this.tokenExpiresAt = Date.now() + (response.data.expires_in * 1000);
            return this.accessToken!;
        } catch (error) {
            logger.error('Failed to get API-Setu access token:', error);
            throw new Error('OAuth authentication failed');
        }
    }

    /**
     * Get authenticated axios instance
     */
    private async getAuthClient(): Promise<AxiosInstance> {
        const token = await this.getAccessToken();
        return axios.create({
            baseURL: apiSetuConfig.baseUrl,
            timeout: 30000,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    /**
     * Fetch credentials from NSDC partners endpoint
     */
    async fetchCredentials(issuerId: number, options: FetchOptions): Promise<FetchResult> {
        try {
            const client = await this.getAuthClient();

            // Get issuer's registry_id from database
            const issuer = await prisma.issuer.findUnique({
                where: { id: issuerId },
                select: { registry_id: true },
            });

            if (!issuer?.registry_id) {
                throw new Error(`Issuer ${issuerId} has no registry_id`);
            }

            const params: Record<string, string> = {
                page_size: String(options.pageSize || 50),
            };

            if (options.cursor) {
                params.cursor = options.cursor;
            }
            if (options.since) {
                params.since = options.since.toISOString();
            }

            const response = await client.get(
                `/api/partners/${issuer.registry_id}/credentials`,
                { params }
            );

            const credentials: RawProviderCredential[] = response.data.data.map(
                (item: any) => ({
                    id: item.credential_id || item.id,
                    signedPayload: item.signed_credential || item.credential,
                    signatureType: this.detectSignatureType(item),
                    rawData: item,
                })
            );

            return {
                credentials,
                nextCursor: response.data.next_cursor,
                hasMore: !!response.data.next_cursor,
            };
        } catch (error) {
            logger.error('Failed to fetch credentials from NSDC:', error);
            throw error;
        }
    }

    /**
     * Subscribe to webhook notifications
     */
    async subscribeWebhook(
        issuerId: number,
        callbackUrl: string
    ): Promise<WebhookSubscriptionResult> {
        try {
            const client = await this.getAuthClient();

            const issuer = await prisma.issuer.findUnique({
                where: { id: issuerId },
                select: { registry_id: true },
            });

            if (!issuer?.registry_id) {
                return {
                    subscribed: false,
                    requiresApproval: false,
                    error: 'No registry_id'
                };
            }

            const response = await client.post(
                `/api/partners/${issuer.registry_id}/webhooks`,
                { callback_url: callbackUrl, events: ['credential.issued'] }
            );

            return {
                subscribed: response.data.status === 'active',
                requiresApproval: response.data.status === 'pending_approval',
                webhookId: response.data.webhook_id,
            };
        } catch (error: any) {
            logger.error('Failed to subscribe to NSDC webhook:', error);
            return {
                subscribed: false,
                requiresApproval: false,
                error: error.message,
            };
        }
    }

    /**
     * Verify credential signature (JWS or HMAC)
     */
    async verify(
        credential: RawProviderCredential,
        jwksUrl?: string
    ): Promise<VerificationResult> {
        try {
            if (credential.signatureType === 'JWS') {
                const url = jwksUrl || `${this.client.defaults.baseURL}/.well-known/jwks.json`;
                return await this.verifyJWS(credential, url);
            } else if (credential.signatureType === 'HMAC') {
                // HMAC verification requires the secret - handled in webhook verification
                return { verified: false, method: 'HMAC', error: 'Use verifyWebhookSignature for HMAC' };
            } else if (credential.signatureType === 'PDF' || credential.signatureType === 'DSC') {
                // PDF/DSC verification - check if signatureMeta exists and indicates valid
                const meta = credential.rawData.signature_meta || credential.rawData.signatureMeta;
                if (meta?.valid) {
                    return { verified: true, method: credential.signatureType };
                }
                return { verified: false, method: credential.signatureType, error: 'Invalid signature meta' };
            }

            return { verified: false, method: 'JWS', error: 'Unknown signature type' };
        } catch (error: any) {
            logger.error('Credential verification failed:', error);
            return { verified: false, method: 'JWS', error: error.message };
        }
    }

    /**
     * Verify JWS signature using JWKS
     */
    private async verifyJWS(
        credential: RawProviderCredential,
        jwksUrl?: string
    ): Promise<VerificationResult> {
        if (!jwksUrl) {
            return { verified: false, method: 'JWS', error: 'No JWKS URL provided' };
        }

        const jws = typeof credential.signedPayload === 'string'
            ? credential.signedPayload
            : JSON.stringify(credential.signedPayload);

        // Get JWKS (with caching)
        const jwks = await this.getJWKS(jwksUrl);

        try {
            // Parse the JWS header to get the key ID
            const [headerB64] = jws.split('.');
            const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString());
            const kid = header.kid;

            // Find the key
            const key = jwks.find((k: any) => k.kid === kid);
            if (!key) {
                return { verified: false, method: 'JWS', error: `Key ${kid} not found in JWKS` };
            }

            // Import and verify
            const publicKey = await jose.importJWK(key, header.alg);
            await jose.compactVerify(jws, publicKey);

            return { verified: true, method: 'JWS', kid };
        } catch (error: any) {
            return { verified: false, method: 'JWS', error: error.message };
        }
    }

    /**
     * Get JWKS with caching
     */
    private async getJWKS(jwksUrl: string): Promise<jose.JWK[]> {
        const cached = jwksCache.get(jwksUrl);
        if (cached && Date.now() - cached.fetchedAt < JWKS_CACHE_TTL) {
            return cached.keys;
        }

        try {
            const response = await axios.get(jwksUrl);
            const keys = response.data.keys;
            jwksCache.set(jwksUrl, { keys, fetchedAt: Date.now() });

            // Also cache in database
            // This is done asynchronously to not block verification
            this.cacheJWKSInDb(jwksUrl, response.data).catch(err =>
                logger.warn('Failed to cache JWKS in DB:', err)
            );

            return keys;
        } catch (error) {
            // Try to get from database cache
            const dbCached = await prisma.issuerPublicKeys.findFirst({
                where: { jwk_set_url: jwksUrl },
                orderBy: { last_fetched_at: 'desc' },
            });

            if (dbCached) {
                const keys = (dbCached.cached_jwks as any).keys;
                jwksCache.set(jwksUrl, { keys, fetchedAt: Date.now() });
                return keys;
            }

            throw error;
        }
    }

    /**
     * Cache JWKS in database
     */
    private async cacheJWKSInDb(jwksUrl: string, jwks: any): Promise<void> {
        // Find issuer with this JWKS URL
        const issuer = await prisma.issuer.findFirst({
            where: { website_url: { contains: new URL(jwksUrl).hostname } },
        });

        if (issuer) {
            await prisma.issuerPublicKeys.upsert({
                where: {
                    issuer_id_jwk_set_url: {
                        issuer_id: issuer.id,
                        jwk_set_url: jwksUrl
                    }
                },
                update: { cached_jwks: jwks, last_fetched_at: new Date() },
                create: {
                    issuer_id: issuer.id,
                    jwk_set_url: jwksUrl,
                    cached_jwks: jwks
                },
            });
        }
    }

    /**
     * Normalize NSDC credential to canonical format
     */
    normalize(raw: RawProviderCredential): CanonicalCredential {
        const data = raw.rawData;

        // Handle different NSDC payload formats
        const credential = data.credential || data.credentialSubject || data;

        return {
            providerCredentialId: raw.id,
            recipientEmail: credential.email || credential.recipient_email || credential.holder?.email,
            recipientPhone: credential.phone || credential.recipient_phone || credential.holder?.phone,
            recipientName: credential.name || credential.recipient_name || credential.holder?.name,
            recipientDob: credential.dob || credential.date_of_birth || credential.holder?.dob,
            certificateTitle: credential.title || credential.certificate_title || credential.name || 'Unknown Certificate',
            issueDate: credential.issued_at || credential.issuance_date || new Date().toISOString(),
            expiryDate: credential.expiry_date || credential.expirationDate,
            skills: credential.skills || [],
            metadata: {
                provider: 'nsdc',
                qp_code: credential.qp_code,
                nos_code: credential.nos_code,
                nsqf_level: credential.nsqf_level,
                sector: credential.sector,
                originalData: data,
            },
        };
    }

    /**
     * Verify webhook signature (HMAC-SHA256)
     */
    async verifyWebhookSignature(
        payload: string | Buffer,
        signature: string,
        secret?: string
    ): Promise<boolean> {
        if (!secret) {
            logger.warn('No webhook secret provided for HMAC verification');
            return false;
        }

        const payloadBuffer = typeof payload === 'string' ? Buffer.from(payload) : payload;
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(payloadBuffer)
            .digest('hex');

        // Compare using timing-safe comparison
        try {
            return crypto.timingSafeEqual(
                Buffer.from(signature),
                Buffer.from(expectedSignature)
            );
        } catch {
            return false;
        }
    }

    /**
     * Detect signature type from raw data
     */
    private detectSignatureType(data: any): RawProviderCredential['signatureType'] {
        if (data.signed_credential && typeof data.signed_credential === 'string' &&
            data.signed_credential.split('.').length === 3) {
            return 'JWS';
        }
        if (data.signature_type === 'pdf' || data.signature_type === 'PDF') {
            return 'PDF';
        }
        if (data.signature_type === 'dsc' || data.signature_type === 'DSC') {
            return 'DSC';
        }
        if (data.signature_type === 'hmac' || data.signature_type === 'HMAC') {
            return 'HMAC';
        }
        return 'NONE';
    }
}

// Singleton instance
let nsdcConnector: NsdcApiSetuConnector | null = null;

export function getNsdcConnector(): NsdcApiSetuConnector {
    if (!nsdcConnector) {
        nsdcConnector = new NsdcApiSetuConnector();
    }
    return nsdcConnector;
}
