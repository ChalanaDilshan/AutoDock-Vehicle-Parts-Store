import { Router } from 'express';
import { orderController } from '../controllers/order.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const orderRouter = Router();

// Public token-gated streaming route (token verified inside controller)
orderRouter.get('/receipts/stream', orderController.streamReceipt.bind(orderController));

// Module Health Check (Public, must be defined before parameterized /:id route)
orderRouter.get('/health', (_req, res) => {
  res.json({
    module: 'MOD-03 Orders, Payments & Delivery',
    status: 'READY',
  });
});

// Authenticated Customer Order Routes
orderRouter.get(
  '/',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  orderController.getMyOrders.bind(orderController)
);

orderRouter.get(
  '/:id',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  orderController.getMyOrderById.bind(orderController)
);

orderRouter.get(
  '/suborders/:suborderId',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  orderController.getMySuborderById.bind(orderController)
);

orderRouter.get(
  '/suborders/:suborderId/bank-instructions',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  orderController.getBankInstructions.bind(orderController)
);

orderRouter.post(
  '/suborders/:suborderId/receipt',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  orderController.uploadReceipt.bind(orderController)
);

orderRouter.post(
  '/suborders/:suborderId/cancel',
  requireAuth,
  requireRole('CUSTOMER', 'ADMIN'),
  orderController.cancelSuborder.bind(orderController)
);
