import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { sendError } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly errors?: Array<{ field?: string; message: string; code?: string }>;

  constructor(
    message: string,
    statusCode = 400,
    code = 'BAD_REQUEST',
    errors?: Array<{ field?: string; message: string; code?: string }>
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.errors = errors;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  logger.error(`Unhandled request error: ${err.message}`, err);

  if (err instanceof AppError || (err as any).statusCode) {
    sendError({
      res,
      statusCode: (err as any).statusCode || (err as AppError).statusCode || 400,
      code: (err as any).code || (err as AppError).code || 'BAD_REQUEST',
      message: err.message,
      errors: (err as any).errors,
    });
    return;
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
      code: e.code,
    }));

    sendError({
      res,
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request input validation failed',
      errors: fieldErrors,
    });
    return;
  }

  // Handle generic 500 error — NEVER expose internal stack trace in response
  sendError({
    res,
    statusCode: 500,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'An unexpected internal server error occurred',
  });
}
