import { Router } from 'express';
import { checkoutController } from '../controllers/checkout.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const checkoutRouter = Router();

checkoutRouter.post(
  '/quote',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  checkoutController.getQuote.bind(checkoutController)
);

checkoutRouter.post(
  '/orders',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  checkoutController.placeOrder.bind(checkoutController)
);
