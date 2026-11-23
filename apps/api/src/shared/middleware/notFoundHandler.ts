import { Request, Response } from 'express';
import { sendError } from '../utils/apiResponse.js';

/**
 * Catches all unmatched routes and returns standard 404 RESOURCE_NOT_FOUND error.
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError({
    res,
    statusCode: 404,
    code: 'RESOURCE_NOT_FOUND',
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
}
