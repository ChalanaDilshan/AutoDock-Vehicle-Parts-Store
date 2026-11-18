import { Router } from 'express';
import { adminOrderController } from '../controllers/adminOrder.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const adminOrderRouter = Router();

adminOrderRouter.get(
  '/',
  requireAuth,
  requireRole('ADMIN'),
  adminOrderController.getOrders.bind(adminOrderController)
);

adminOrderRouter.get(
  '/:orderId',
  requireAuth,
  requireRole('ADMIN'),
  adminOrderController.getOrderById.bind(adminOrderController)
);
