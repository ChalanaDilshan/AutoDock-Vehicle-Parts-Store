import { Router } from 'express';

/**
 * MOD-03 Orders, Payments & Delivery Module
 * Route registration placeholder. Business endpoints will be implemented in future module prompts.
 */
export const ordersDeliveryRouter = Router();

ordersDeliveryRouter.get('/health', (_req, res) => {
  res.json({
    module: 'MOD-03 Orders, Payments & Delivery',
    status: 'READY',
  });
});
