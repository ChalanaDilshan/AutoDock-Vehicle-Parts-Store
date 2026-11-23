import { Router } from 'express';
import { paymentController } from '../controllers/payment.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const paymentRouter = Router();

paymentRouter.post(
  '/card/initiate',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  paymentController.initiateCardSession.bind(paymentController)
);

paymentRouter.post('/webhooks/card', paymentController.handleCardWebhook.bind(paymentController));

paymentRouter.post(
  '/sandbox-simulator/callback',
  paymentController.simulateWebhookCallback.bind(paymentController)
);
