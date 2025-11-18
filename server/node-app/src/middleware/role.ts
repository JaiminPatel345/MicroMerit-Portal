import { Request, Response, NextFunction } from 'express';
import { sendForbidden } from '../utils/response';
import { logger } from '../utils/logger';

type UserRole = 'admin' | 'issuer' | 'learner';

/**
 * Middleware to check if user has required role
 */
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendForbidden(res, 'Authentication required');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Access denied - insufficient permissions', {
        userId: req.user.id,
        userRole: req.user.role,
        requiredRoles: allowedRoles,
      });
      sendForbidden(res, 'You do not have permission to access this resource');
      return;
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole('admin');

/**
 * Middleware to check if user is issuer
 */
export const requireIssuer = requireRole('issuer');

/**
 * Middleware to check if user is learner
 */
export const requireLearner = requireRole('learner');

/**
 * Middleware to check if user is either issuer or admin
 */
export const requireIssuerOrAdmin = requireRole('issuer', 'admin');
