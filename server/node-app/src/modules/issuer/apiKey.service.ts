import { apiKeyRepository } from './apiKey.repository';
import { issuerRepository } from './repository';
import { generateRandomString } from '../../utils/bcrypt';
import { issuer_api_key } from '@prisma/client';
import { logger } from '../../utils/logger';

export interface CreateApiKeyInput {
  name: string;
  rate_limit_per_minute?: number;
  expires_at?: string;
  allowed_ips?: string;
}

export interface ApiKeyResponse {
  id: number;
  issuer_id: number;
  name: string;
  api_key: string;
  active: boolean;
  revoked_reason?: string | null;
  expires_at?: Date | null;
  last_used_at?: Date | null;
  usage_count: number;
  rate_limit_per_minute: number;
  allowed_ips?: string | null;
  created_at: Date;
}

const MAX_API_KEYS_PER_ISSUER = 5;
const API_KEY_LENGTH = parseInt(process.env.API_KEY_LENGTH || '64', 10);

export class ApiKeyService {
  /**
   * Create a new API key for an issuer
   */
  async createApiKey(issuerId: number, data: CreateApiKeyInput): Promise<ApiKeyResponse> {
    // Verify issuer exists and is approved
    const issuer = await issuerRepository.findById(issuerId);
    if (!issuer) {
      throw new Error('Issuer not found');
    }

    if (issuer.status !== 'approved') {
      throw new Error('Issuer must be approved before creating API keys');
    }

    if (issuer.is_blocked) {
      throw new Error('Issuer account is blocked');
    }

    // Check if issuer has reached the maximum number of active API keys
    const activeKeysCount = await apiKeyRepository.countActiveKeys(issuerId);
    if (activeKeysCount >= MAX_API_KEYS_PER_ISSUER) {
      throw new Error(`Maximum ${MAX_API_KEYS_PER_ISSUER} active API keys allowed`);
    }

    // Generate unique API key
    const api_key = `mk_${generateRandomString(API_KEY_LENGTH)}`;

    // Parse expires_at if provided
    const expires_at = data.expires_at ? new Date(data.expires_at) : undefined;

    // Create API key
    const apiKey = await apiKeyRepository.create({
      issuer_id: issuerId,
      name: data.name,
      api_key,
      rate_limit_per_minute: data.rate_limit_per_minute || parseInt(process.env.API_KEY_DEFAULT_RATE_LIMIT || '60', 10),
      expires_at,
      allowed_ips: data.allowed_ips,
    });

    logger.info('API key created', {
      apiKeyId: apiKey.id,
      issuerId,
      name: data.name,
    });

    return apiKey;
  }

  /**
   * List all API keys for an issuer
   */
  async listApiKeys(issuerId: number): Promise<ApiKeyResponse[]> {
    return apiKeyRepository.findAllByIssuerId(issuerId);
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(apiKeyId: number, issuerId: number, reason?: string): Promise<ApiKeyResponse> {
    // Find API key
    const apiKey = await apiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    // Verify ownership
    if (apiKey.issuer_id !== issuerId) {
      throw new Error('You do not have permission to revoke this API key');
    }

    // Check if already revoked
    if (!apiKey.active) {
      throw new Error('API key is already revoked');
    }

    // Revoke API key
    const revokedKey = await apiKeyRepository.revoke(
      apiKeyId,
      reason || 'Revoked by issuer'
    );

    logger.info('API key revoked', {
      apiKeyId,
      issuerId,
      reason,
    });

    return revokedKey;
  }

  /**
   * Get API key details (without exposing the full key)
   */
  async getApiKeyDetails(apiKeyId: number, issuerId: number): Promise<ApiKeyResponse> {
    const apiKey = await apiKeyRepository.findById(apiKeyId);
    if (!apiKey) {
      throw new Error('API key not found');
    }

    // Verify ownership
    if (apiKey.issuer_id !== issuerId) {
      throw new Error('You do not have permission to view this API key');
    }

    // Mask API key (show only first and last 4 characters)
    const maskedKey = {
      ...apiKey,
      api_key: `${apiKey.api_key.substring(0, 7)}...${apiKey.api_key.substring(apiKey.api_key.length - 4)}`,
    };

    return maskedKey as ApiKeyResponse;
  }
}

export const apiKeyService = new ApiKeyService();
