import { Router } from 'express';

/**
 * MOD-04 Finance & Promotion Management Module
 * Route registration placeholder. Business endpoints will be implemented in future module prompts.
 */
export const financePromotionsRouter = Router();

financePromotionsRouter.get('/health', (_req, res) => {
  res.json({
    module: 'MOD-04 Finance & Promotion Management',
    status: 'READY',
  });
});
