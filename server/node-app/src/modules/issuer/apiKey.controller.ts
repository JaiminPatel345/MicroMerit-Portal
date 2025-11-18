import { Request, Response } from 'express';
import { apiKeyService } from './apiKey.service';
import { sendSuccess, sendError } from '../../utils/response';
import { logger } from '../../utils/logger';
import { z } from 'zod';

const createApiKeySchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters').max(100),
  rate_limit_per_minute: z.number().int().min(1).max(1000).optional(),
  expires_at: z.string().datetime().optional(),
  allowed_ips: z.string().optional(),
});

const revokeApiKeySchema = z.object({
  reason: z.string().min(1).max(500).optional(),
});

export class ApiKeyController {
  /**
   * Create a new API key
   * POST /auth/issuer/api-key/create
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const validatedData = createApiKeySchema.parse(req.body);
      const apiKey = await apiKeyService.createApiKey(req.user.id, validatedData);
      
      sendSuccess(res, apiKey, 'API key created successfully. Store it securely as it won\'t be shown again.', 201);
    } catch (error: any) {
      logger.error('API key creation failed', { error: error.message });
      sendError(res, error.message, 'Failed to create API key', 400);
    }
  }

  /**
   * List all API keys for the authenticated issuer
   * GET /auth/issuer/api-key/list
   */
  async list(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const apiKeys = await apiKeyService.listApiKeys(req.user.id);
      
      // Mask API keys in the list
      const maskedKeys = apiKeys.map(key => ({
        ...key,
        api_key: `${key.api_key.substring(0, 7)}...${key.api_key.substring(key.api_key.length - 4)}`,
      }));
      
      sendSuccess(res, maskedKeys, 'API keys retrieved successfully');
    } catch (error: any) {
      logger.error('API key listing failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve API keys', 400);
    }
  }

  /**
   * Revoke an API key
   * POST /auth/issuer/api-key/revoke/:id
   */
  async revoke(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const apiKeyId = parseInt(req.params.id || '0', 10);
      if (!apiKeyId) {
        sendError(res, 'Invalid API key ID', 'Bad request', 400);
        return;
      }

      const { reason } = revokeApiKeySchema.parse(req.body);
      const apiKey = await apiKeyService.revokeApiKey(apiKeyId, req.user.id, reason);
      
      sendSuccess(res, apiKey, 'API key revoked successfully');
    } catch (error: any) {
      logger.error('API key revocation failed', { error: error.message });
      sendError(res, error.message, 'Failed to revoke API key', 400);
    }
  }

  /**
   * Get API key details
   * GET /auth/issuer/api-key/:id
   */
  async getDetails(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        sendError(res, 'User not authenticated', 'Authentication required', 401);
        return;
      }

      const apiKeyId = parseInt(req.params.id || '0', 10);
      if (!apiKeyId) {
        sendError(res, 'Invalid API key ID', 'Bad request', 400);
        return;
      }

      const apiKey = await apiKeyService.getApiKeyDetails(apiKeyId, req.user.id);
      
      sendSuccess(res, apiKey, 'API key details retrieved successfully');
    } catch (error: any) {
      logger.error('API key details retrieval failed', { error: error.message });
      sendError(res, error.message, 'Failed to retrieve API key details', 400);
    }
  }
}

export const apiKeyController = new ApiKeyController();
