/**
 * KMS (Key Management Service) Abstraction
 * Provides encryption/decryption and signing capabilities
 * Uses a dev mock in development, can be swapped for real KMS in production
 */

import crypto from 'crypto';
import { kmsConfig, featureFlags } from '../config/feature-flags';
import { logger } from '../../utils/logger';

/**
 * KMS interface for encryption and signing operations
 */
export interface IKmsService {
    encrypt(plaintext: Buffer): Promise<Buffer>;
    decrypt(ciphertext: Buffer): Promise<Buffer>;
    sign(data: Buffer): Promise<Buffer>;
    verify(data: Buffer, signature: Buffer): Promise<boolean>;
    getPublicKey(): Promise<string>;
}

/**
 * Development KMS Mock
 * Uses AES-256-GCM for encryption with key from environment variable
 * WARNING: Only for development. Use real KMS/HSM in production.
 */
class DevKmsService implements IKmsService {
    private readonly algorithm = 'aes-256-gcm';
    private readonly keyLength = 32; // 256 bits
    private readonly ivLength = 12; // 96 bits for GCM
    private readonly authTagLength = 16; // 128 bits

    private getKey(): Buffer {
        const key = kmsConfig.devKey;
        if (!key || key.length < this.keyLength) {
            throw new Error('KMS_DEV_KEY must be at least 32 characters');
        }
        return Buffer.from(key.slice(0, this.keyLength));
    }

    /**
     * Encrypt plaintext using AES-256-GCM
     * Output format: IV (12 bytes) + AuthTag (16 bytes) + Ciphertext
     */
    async encrypt(plaintext: Buffer): Promise<Buffer> {
        const iv = crypto.randomBytes(this.ivLength);
        const key = this.getKey();

        const cipher = crypto.createCipheriv(this.algorithm, key, iv);
        const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Combine: IV + AuthTag + Ciphertext
        return Buffer.concat([iv, authTag, encrypted]);
    }

    /**
     * Decrypt ciphertext encrypted with AES-256-GCM
     */
    async decrypt(ciphertext: Buffer): Promise<Buffer> {
        if (ciphertext.length < this.ivLength + this.authTagLength) {
            throw new Error('Invalid ciphertext: too short');
        }

        const iv = ciphertext.subarray(0, this.ivLength);
        const authTag = ciphertext.subarray(this.ivLength, this.ivLength + this.authTagLength);
        const encrypted = ciphertext.subarray(this.ivLength + this.authTagLength);
        const key = this.getKey();

        const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
        decipher.setAuthTag(authTag);

        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }

    /**
     * Sign data using HMAC-SHA256 (dev signing)
     * In production, use asymmetric signing with KMS
     */
    async sign(data: Buffer): Promise<Buffer> {
        const hmac = crypto.createHmac('sha256', this.getKey());
        hmac.update(data);
        return hmac.digest();
    }

    /**
     * Verify HMAC signature
     */
    async verify(data: Buffer, signature: Buffer): Promise<boolean> {
        const expectedSignature = await this.sign(data);
        return crypto.timingSafeEqual(signature, expectedSignature);
    }

    /**
     * Get public key (not applicable for dev mock, returns placeholder)
     */
    async getPublicKey(): Promise<string> {
        logger.warn('DevKmsService.getPublicKey() called - returning placeholder');
        return 'DEV_PUBLIC_KEY_PLACEHOLDER';
    }
}

// Singleton instance
let kmsService: IKmsService | null = null;

/**
 * Get KMS service instance
 * Uses dev mock in development, can be extended for production KMS
 */
export function getKmsService(): IKmsService {
    if (!kmsService) {
        if (featureFlags.kmsMock) {
            logger.info('Using development KMS mock');
            kmsService = new DevKmsService();
        } else {
            // In production, initialize real KMS service here
            // For now, fall back to dev mock with a warning
            logger.warn('Production KMS not configured, falling back to dev mock');
            kmsService = new DevKmsService();
        }
    }
    return kmsService;
}

/**
 * Helper: Encrypt JSON data
 */
export async function encryptJson(data: unknown): Promise<Buffer> {
    const plaintext = Buffer.from(JSON.stringify(data), 'utf-8');
    return getKmsService().encrypt(plaintext);
}

/**
 * Helper: Decrypt to JSON
 */
export async function decryptJson<T = unknown>(ciphertext: Buffer): Promise<T> {
    const plaintext = await getKmsService().decrypt(ciphertext);
    return JSON.parse(plaintext.toString('utf-8')) as T;
}

/**
 * Reset KMS service (for testing)
 */
export function resetKmsService(): void {
    kmsService = null;
}
