import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, verifyRefreshToken, JWTPayload } from '../utils/jwt';
import { sendUnauthorized } from '../utils/response';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

/**
 * Middleware to verify JWT access token
 */
export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    logger.info('Authenticating request', { 
        path: req.path, 
        authHeaderPresent: !!authHeader,
        authHeaderPartial: authHeader ? authHeader.substring(0, 20) + '...' : 'none'
    });

    if (!token) {
      sendUnauthorized(res, 'Access token is required');
      return;
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed', { error });
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Middleware to verify refresh token
 */
export const authenticateRefreshToken = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      sendUnauthorized(res, 'Refresh token is required');
      return;
    }

    const decoded = verifyRefreshToken(refreshToken);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Refresh token verification failed', { error });
    sendUnauthorized(res, 'Invalid or expired refresh token');
  }
};

/**
 * Optional authentication - doesn't fail if token is missing
 */
export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Token is invalid but we don't fail the request
    logger.debug('Optional auth - invalid token', { error });
    next();
  }
};

/**
 * Middleware to verify issuer authentication
 * Ensures the user is authenticated and is an issuer
 */
export const authenticateIssuer = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      sendUnauthorized(res, 'Access token is required');
      return;
    }

    const decoded = verifyAccessToken(token);

    // Check if the user is an issuer
    if (decoded.role !== 'issuer') {
      sendUnauthorized(res, 'Only issuers can access this endpoint');
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Issuer token verification failed', { error });
    sendUnauthorized(res, 'Invalid or expired token');
  }
};

/**
 * Middleware to verify learner authentication
 * Ensures the user is authenticated and is a learner
 */
export const authenticateLearner = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      sendUnauthorized(res, 'Access token is required');
      return;
    }

    const decoded = verifyAccessToken(token);

    // Check if the user is a learner
    if (decoded.role !== 'learner') {
      sendUnauthorized(res, 'Only learners can access this endpoint');
      return;
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Learner token verification failed', { error });
    sendUnauthorized(res, 'Invalid or expired token');
  }
};
