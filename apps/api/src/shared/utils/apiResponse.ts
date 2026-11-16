import { Response } from 'express';

export interface ApiResponseOptions<T = unknown> {
  res: Response;
  statusCode?: number;
  code?: string;
  message?: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorOptions {
  res: Response;
  statusCode?: number;
  code: string;
  message: string;
  errors?: Array<{ field?: string; message: string; code?: string }>;
}

export function sendSuccess<T>({
  res,
  statusCode = 200,
  code = 'OK',
  message = 'Operation successful',
  data,
  meta = {},
}: ApiResponseOptions<T>): Response {
  const requestId = (res.req?.headers['x-request-id'] as string) || undefined;

  return res.status(statusCode).json({
    success: true,
    code,
    message,
    data: data !== undefined ? data : null,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      ...meta,
    },
  });
}

export function sendError({
  res,
  statusCode = 400,
  code,
  message,
  errors = [],
}: ApiErrorOptions): Response {
  const requestId = (res.req?.headers['x-request-id'] as string) || undefined;

  return res.status(statusCode).json({
    success: false,
    code,
    message,
    errors,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
