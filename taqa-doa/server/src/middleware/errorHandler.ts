import { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Custom error classes
// ---------------------------------------------------------------------------

/**
 * Base application error. All custom errors extend this class so the
 * centralized handler can detect them by checking `instanceof AppError`.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 404 -- resource not found */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

/** 400 -- request validation failed */
export class ValidationError extends AppError {
  public readonly details: unknown;

  constructor(message = 'Validation failed', details?: unknown) {
    super(message, 400);
    this.details = details;
  }
}

/** 401 -- missing or invalid credentials */
export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/** 403 -- valid credentials but insufficient permissions */
export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/** 409 -- resource already exists / conflict */
export class ConflictError extends AppError {
  constructor(message = 'Resource already exists') {
    super(message, 409);
  }
}

// ---------------------------------------------------------------------------
// Not-found handler (catch-all for unmatched routes)
// ---------------------------------------------------------------------------

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route not found: ${req.method} ${req.originalUrl}`));
}

// ---------------------------------------------------------------------------
// Centralized error handler
// ---------------------------------------------------------------------------

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Determine status code
  const statusCode = err instanceof AppError ? err.statusCode : 500;

  // Build response body
  const body: Record<string, unknown> = {
    status: 'error',
    statusCode,
    message: err.message || 'Internal server error',
  };

  // Attach validation details when available
  if (err instanceof ValidationError && err.details) {
    body.details = err.details;
  }

  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    body.stack = err.stack;
  }

  // Log unexpected (non-operational) errors
  if (!(err instanceof AppError) || !err.isOperational) {
    console.error('[error]', err);
  }

  res.status(statusCode).json(body);
}
