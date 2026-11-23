import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { requireAuth, requireRole } from '../../identity/middleware/auth.middleware.js';

export const notificationRouter = Router();
export const adminNotificationRouter = Router();

// Current Authenticated User Routes (Customers, Sellers, Admins)
notificationRouter.get(
  '/',
  requireAuth,
  notificationController.getMyNotifications.bind(notificationController)
);

notificationRouter.get(
  '/unread-count',
  requireAuth,
  notificationController.getUnreadCount.bind(notificationController)
);

notificationRouter.patch(
  '/:id/read',
  requireAuth,
  notificationController.markAsRead.bind(notificationController)
);

notificationRouter.patch(
  '/mark-all-read',
  requireAuth,
  notificationController.markAllAsRead.bind(notificationController)
);

// Administrator Operational Alert & Delivery Health Routes
adminNotificationRouter.get(
  '/operations',
  requireAuth,
  requireRole('ADMIN'),
  notificationController.getAdminOperations.bind(notificationController)
);

adminNotificationRouter.get(
  '/delivery-health',
  requireAuth,
  requireRole('ADMIN'),
  notificationController.getDeliveryHealth.bind(notificationController)
);

adminNotificationRouter.post(
  '/:id/retry',
  requireAuth,
  requireRole('ADMIN'),
  notificationController.retryDelivery.bind(notificationController)
);
