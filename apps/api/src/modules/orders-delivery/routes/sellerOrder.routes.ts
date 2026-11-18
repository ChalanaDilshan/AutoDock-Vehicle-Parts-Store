import { Router } from 'express';
import { sellerOrderController } from '../controllers/sellerOrder.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const sellerOrderRouter = Router();

sellerOrderRouter.get(
  '/',
  requireAuth,
  requireRole('SELLER', 'ADMIN'),
  sellerOrderController.getMySuborders.bind(sellerOrderController)
);

sellerOrderRouter.get(
  '/:suborderId',
  requireAuth,
  requireRole('SELLER', 'ADMIN'),
  sellerOrderController.getMySuborderById.bind(sellerOrderController)
);

sellerOrderRouter.patch(
  '/:suborderId/status',
  requireAuth,
  requireRole('SELLER', 'ADMIN'),
  sellerOrderController.updateFulfillmentStatus.bind(sellerOrderController)
);

sellerOrderRouter.get(
  '/:suborderId/receipt',
  requireAuth,
  requireRole('SELLER', 'ADMIN'),
  sellerOrderController.getReceipt.bind(sellerOrderController)
);

sellerOrderRouter.post(
  '/:suborderId/receipt/verify',
  requireAuth,
  requireRole('SELLER', 'ADMIN'),
  sellerOrderController.verifyReceipt.bind(sellerOrderController)
);
