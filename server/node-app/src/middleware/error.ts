import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError, sendValidationError, sendServerError } from '../utils/response';
import { logger } from '../utils/logger';
import {
  AuthError,
  ValidationError,
  NotFoundError,
  ForbiddenError,
  ConflictError,
} from '../utils/errors';

/**
 * Global error handling middleware
 */
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
  });

  // Handle custom error classes
  if (error instanceof AuthError) {
    sendError(res, error.code, error.message, error.statusCode);
    return;
  }

  if (error instanceof ValidationError) {
    sendError(res, error.code, error.message, error.statusCode);
    return;
  }

  if (error instanceof NotFoundError) {
    sendError(res, error.code, error.message, error.statusCode);
    return;
  }

  if (error instanceof ForbiddenError) {
    sendError(res, error.code, error.message, error.statusCode);
    return;
  }

  if (error instanceof ConflictError) {
    sendError(res, error.code, error.message, error.statusCode);
    return;
  }

  // Handle Multer errors
  if (error.name === 'MulterError') {
    if (error.code === 'LIMIT_FILE_SIZE') {
      sendError(res, 'FILE_TOO_LARGE', 'File size exceeds 5MB limit', 400);
      return;
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      sendError(res, 'INVALID_FILE_FIELD', 'Unexpected file field. Use "profilePhoto" as field name', 400);
      return;
    }
    sendError(res, 'FILE_UPLOAD_ERROR', error.message, 400);
    return;
  }

  // Handle custom file filter errors from multer
  if (error.message && error.message.includes('Only image files are allowed')) {
    sendError(res, 'INVALID_FILE_TYPE', error.message, 400);
    return;
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const errors = error.errors.map((err) => ({
      path: err.path.join('.'),
      message: err.message,
    }));
    sendValidationError(res, errors);
    return;
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith('P')) {
    if (error.code === 'P2002') {
      sendError(res, 'DUPLICATE_ENTRY', 'A record with this value already exists', 409);
      return;
    }
    if (error.code === 'P2025') {
      sendError(res, 'NOT_FOUND', 'Record not found', 404);
      return;
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    sendError(res, 'INVALID_TOKEN', 'Invalid authentication token', 401);
    return;
  }

  if (error.name === 'TokenExpiredError') {
    sendError(res, 'TOKEN_EXPIRED', 'Authentication token has expired', 401);
    return;
  }

  // Default to 500 server error
  sendServerError(res, error.message || 'An unexpected error occurred');
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  sendError(res, 'ROUTE_NOT_FOUND', `Route ${req.path} not found`, 404);
};

/**
 * Async error wrapper for route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
