import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';
import { UserRole } from '../models/user.model.js';
import { sendError } from '../../../shared/utils/apiResponse.js';

export interface AuthenticatedUserPayload {
  userId: string;
  email: string;
  role: UserRole;
  sellerId?: string | null;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUserPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError({
      res,
      statusCode: 401,
      code: 'UNAUTHORIZED',
      message: 'Authentication token is required to access this resource',
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthenticatedUserPayload;
    req.user = decoded;
    next();
  } catch (_err) {
    sendError({
      res,
      statusCode: 401,
      code: 'INVALID_TOKEN',
      message: 'Authentication token is invalid or has expired',
    });
  }
}

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError({
        res,
        statusCode: 401,
        code: 'UNAUTHORIZED',
        message: 'Authentication required',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError({
        res,
        statusCode: 403,
        code: 'FORBIDDEN',
        message: `Forbidden: this action requires one of the following roles: [${allowedRoles.join(', ')}]`,
      });
      return;
    }

    next();
  };
}
