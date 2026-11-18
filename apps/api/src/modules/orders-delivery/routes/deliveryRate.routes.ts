import { Router } from 'express';
import { deliveryRateController } from '../controllers/deliveryRate.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const sellerDeliveryRateRouter = Router();

sellerDeliveryRateRouter.post(
  '/proposals',
  requireAuth,
  requireRole('SELLER', 'ADMIN'),
  deliveryRateController.submitProposal.bind(deliveryRateController)
);

sellerDeliveryRateRouter.get(
  '/',
  requireAuth,
  requireRole('SELLER', 'ADMIN'),
  deliveryRateController.getSellerDeliveryRates.bind(deliveryRateController)
);

export const adminDeliveryRateRouter = Router();

adminDeliveryRateRouter.get(
  '/proposals',
  requireAuth,
  requireRole('ADMIN'),
  deliveryRateController.getPendingProposals.bind(deliveryRateController)
);

adminDeliveryRateRouter.post(
  '/proposals/:proposalId/decision',
  requireAuth,
  requireRole('ADMIN'),
  deliveryRateController.reviewProposal.bind(deliveryRateController)
);
