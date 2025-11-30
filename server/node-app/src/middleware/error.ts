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
  DatabaseError,
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

  if (error instanceof DatabaseError) {
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
    // Create user-friendly error messages
    const formattedErrors = error.errors.map((err) => {
      const field = err.path.join('.') || 'field';
      return `${field}: ${err.message}`;
    });
    
    // Send detailed message in the message field for better UX
    const detailedMessage = formattedErrors.join('; ');
    sendError(res, 'VALIDATION_ERROR', detailedMessage, 400);
    return;
  }

  // Handle Prisma errors
  if (error.code && error.code.startsWith('P')) {
    if (error.code === 'P1001') {
      sendError(res, 'DATABASE_CONNECTION_ERROR', 'Unable to connect to the database. Please try again later', 503);
      return;
    }
    if (error.code === 'P2002') {
      // Extract field name from meta if available
      const field = error.meta?.target?.[0] || 'field';
      sendError(res, 'DUPLICATE_ENTRY', `This ${field} is already registered`, 409);
      return;
    }
    if (error.code === 'P2025') {
      sendError(res, 'NOT_FOUND', 'The requested record was not found', 404);
      return;
    }
    if (error.code === 'P2003') {
      sendError(res, 'INVALID_REFERENCE', 'Invalid reference to related record', 400);
      return;
    }
    if (error.code === 'P2014') {
      sendError(res, 'INVALID_RELATION', 'The change violates a required relation', 400);
      return;
    }
    // Generic Prisma error
    logger.error('Unhandled Prisma error', { code: error.code, meta: error.meta });
    sendError(res, 'DATABASE_ERROR', 'A database error occurred. Please try again', 500);
    return;
  }

  // Handle Prisma Client Initialization Errors
  if (error.name === 'PrismaClientInitializationError') {
    sendError(res, 'DATABASE_CONNECTION_ERROR', 'Unable to connect to the database. Please try again later', 503);
    return;
  }

  // Handle Prisma Client Known Request Errors (table doesn't exist, etc)
  if (error.name === 'PrismaClientKnownRequestError') {
    logger.error('Prisma known request error', { code: error.code, message: error.message });
    sendError(res, 'DATABASE_ERROR', 'A database error occurred. Please contact support if this persists', 500);
    return;
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

  // Handle AWS S3 errors
  if (error.name === 'RequestTimeout') {
    sendError(res, 'UPLOAD_TIMEOUT', 'File upload timed out. Please try again with a smaller file or check your connection', 408);
    return;
  }

  if (error.name === 'NetworkingError') {
    sendError(res, 'NETWORK_ERROR', 'Network error occurred. Please check your connection and try again', 503);
    return;
  }

  if (error.name === 'CredentialsError') {
    logger.error('AWS Credentials error - check environment variables');
    sendError(res, 'SERVER_CONFIGURATION_ERROR', 'Server configuration error. Please contact support', 500);
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
