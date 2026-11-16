import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { getDatabaseStatus } from './config/database.js';
import { requestIdMiddleware } from './shared/middleware/requestId.js';
import { errorHandler } from './shared/middleware/errorHandler.js';
import { notFoundHandler } from './shared/middleware/notFoundHandler.js';
import { sendSuccess, sendError } from './shared/utils/apiResponse.js';

// Module router imports
import {
  identityRouter,
  authRouter,
  userRouter,
  sellerRouter,
  adminSellerRouter,
} from './modules/identity/index.js';
import { customerExperienceRouter } from './modules/customer-experience/index.js';
import { ordersDeliveryRouter } from './modules/orders-delivery/index.js';
import { financePromotionsRouter } from './modules/finance-promotions/index.js';
import { adminPlatformRouter } from './modules/admin-platform/index.js';

export function createApp(): Express {
  const app = express();

  // Security & Request Parsing Middleware
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_ORIGIN,
      credentials: true,
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestIdMiddleware);

  // ---------------------------------------------------------------------------
  // Safe Health & Readiness Endpoints (Do NOT expose credentials/paths)
  // ---------------------------------------------------------------------------
  app.get('/health', (_req: Request, res: Response) => {
    sendSuccess({
      res,
      message: 'AutoDock API is running',
      data: {
        status: 'UP',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      },
    });
  });

  app.get('/health/ready', (_req: Request, res: Response) => {
    const dbStatus = getDatabaseStatus();
    if (dbStatus.isConnected) {
      sendSuccess({
        res,
        message: 'System is ready to handle requests',
        data: {
          database: 'CONNECTED',
          ready: true,
        },
      });
    } else {
      sendError({
        res,
        statusCode: 503,
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database is not connected',
        errors: [{ message: 'Database connection is not ready' }],
      });
    }
  });

  app.get(`${env.API_PREFIX}/health`, (_req: Request, res: Response) => {
    sendSuccess({
      res,
      message: 'AutoDock REST API v1 active',
      data: {
        version: 'v1',
        status: 'HEALTHY',
      },
    });
  });

  // ---------------------------------------------------------------------------
  // Mount Module Business Routers & Module Route Placeholders
  // ---------------------------------------------------------------------------
  app.use(`${env.API_PREFIX}/auth`, authRouter);
  app.use(`${env.API_PREFIX}/users`, userRouter);
  app.use(`${env.API_PREFIX}/sellers`, sellerRouter);
  app.use(`${env.API_PREFIX}/admin/sellers`, adminSellerRouter);

  app.use(`${env.API_PREFIX}/identity`, identityRouter);
  app.use(`${env.API_PREFIX}/products`, customerExperienceRouter);
  app.use(`${env.API_PREFIX}/orders`, ordersDeliveryRouter);
  app.use(`${env.API_PREFIX}/finance`, financePromotionsRouter);
  app.use(`${env.API_PREFIX}/admin`, adminPlatformRouter);

  // 404 & Centralized Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
