import { Router } from 'express';

/**
 * MOD-05 Administration, Notifications & Reporting Module
 * Route registration placeholder. Business endpoints will be implemented in future module prompts.
 */
export const adminPlatformRouter = Router();

adminPlatformRouter.get('/health', (_req, res) => {
  res.json({
    module: 'MOD-05 Administration, Notifications & Reporting',
    status: 'READY',
  });
});
