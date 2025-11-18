import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import { logger } from '../utils/logger';

// Rate limiting store for API keys
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Extend Express Request to include apiKey info
declare global {
  namespace Express {
    interface Request {
      apiKey?: {
        id: number;
        issuerId: number;
        name: string;
        rateLimit: number;
      };
    }
  }
}

/**
 * Middleware to validate API key
 */
export const validateApiKey = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      sendUnauthorized(res, 'API key is required');
      return;
    }

    // Find API key in database
    const apiKeyRecord = await prisma.issuer_api_key.findUnique({
      where: { api_key: apiKey },
      include: {
        issuer: {
          select: {
            id: true,
            status: true,
            is_blocked: true,
          },
        },
      },
    });

    if (!apiKeyRecord) {
      logger.warn('Invalid API key attempted', { apiKey: apiKey.substring(0, 10) + '...' });
      sendUnauthorized(res, 'Invalid API key');
      return;
    }

    // Check if API key is active
    if (!apiKeyRecord.active) {
      logger.warn('Inactive API key attempted', { apiKeyId: apiKeyRecord.id });
      sendUnauthorized(res, 'API key has been revoked');
      return;
    }

    // Check if API key is expired
    if (apiKeyRecord.expires_at && new Date(apiKeyRecord.expires_at) < new Date()) {
      logger.warn('Expired API key attempted', { apiKeyId: apiKeyRecord.id });
      sendUnauthorized(res, 'API key has expired');
      return;
    }

    // Check if issuer is approved
    if (apiKeyRecord.issuer.status !== 'approved') {
      sendForbidden(res, 'Issuer account is not approved');
      return;
    }

    // Check if issuer is blocked
    if (apiKeyRecord.issuer.is_blocked) {
      sendForbidden(res, 'Issuer account is blocked');
      return;
    }

    // Check rate limiting
    const now = Date.now();
    const rateLimitKey = `${apiKeyRecord.id}`;
    const rateLimitData = rateLimitStore.get(rateLimitKey);

    if (rateLimitData) {
      if (now < rateLimitData.resetTime) {
        if (rateLimitData.count >= apiKeyRecord.rate_limit_per_minute) {
          logger.warn('Rate limit exceeded', { apiKeyId: apiKeyRecord.id });
          res.status(429).json({
            success: false,
            message: 'Rate limit exceeded',
            error: 'TOO_MANY_REQUESTS',
            statusCode: 429,
          });
          return;
        }
        rateLimitData.count++;
      } else {
        // Reset rate limit window
        rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
      }
    } else {
      // Initialize rate limit tracking
      rateLimitStore.set(rateLimitKey, { count: 1, resetTime: now + 60000 });
    }

    // Update API key usage
    await prisma.issuer_api_key.update({
      where: { id: apiKeyRecord.id },
      data: {
        usage_count: { increment: 1 },
        last_used_at: new Date(),
      },
    });

    // Attach API key info to request
    req.apiKey = {
      id: apiKeyRecord.id,
      issuerId: apiKeyRecord.issuer_id,
      name: apiKeyRecord.name,
      rateLimit: apiKeyRecord.rate_limit_per_minute,
    };

    next();
  } catch (error) {
    logger.error('API key validation error', { error });
    res.status(500).json({
      success: false,
      message: 'Error validating API key',
      error: 'SERVER_ERROR',
      statusCode: 500,
    });
  }
};

/**
 * Clean up old rate limit entries periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean up every minute
