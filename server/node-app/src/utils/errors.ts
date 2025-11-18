/**
 * Custom error classes for better error handling
 */

export class AuthError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 401, code: string = 'UNAUTHORIZED') {
    super(message);
    this.name = 'AuthError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ValidationError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 400, code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class NotFoundError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 404, code: string = 'NOT_FOUND') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ForbiddenError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 403, code: string = 'FORBIDDEN') {
    super(message);
    this.name = 'ForbiddenError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class ConflictError extends Error {
  statusCode: number;
  code: string;

  constructor(message: string, statusCode: number = 409, code: string = 'CONFLICT') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = statusCode;
    this.code = code;
  }
}
