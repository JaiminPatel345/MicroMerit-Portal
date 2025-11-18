import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  statusCode: number;
}

/**
 * Send success response
 */
export const sendSuccess = <T = any>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): void => {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
    statusCode,
  };
  res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  error: string,
  message: string = 'Error',
  statusCode: number = 400
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    error,
    statusCode,
  };
  res.status(statusCode).json(response);
};

/**
 * Send not found response
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): void => {
  sendError(res, 'NOT_FOUND', message, 404);
};

/**
 * Send unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized access'
): void => {
  sendError(res, 'UNAUTHORIZED', message, 401);
};

/**
 * Send forbidden response
 */
export const sendForbidden = (
  res: Response,
  message: string = 'Access forbidden'
): void => {
  sendError(res, 'FORBIDDEN', message, 403);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  errors: any,
  message: string = 'Validation failed'
): void => {
  const response: ApiResponse = {
    success: false,
    message,
    error: 'VALIDATION_ERROR',
    data: errors,
    statusCode: 422,
  };
  res.status(422).json(response);
};

/**
 * Send internal server error response
 */
export const sendServerError = (
  res: Response,
  message: string = 'Internal server error'
): void => {
  sendError(res, 'SERVER_ERROR', message, 500);
};
