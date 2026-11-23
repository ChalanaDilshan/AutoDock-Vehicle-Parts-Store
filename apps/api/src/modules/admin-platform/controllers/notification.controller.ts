import { Request, Response, NextFunction } from 'express';
import { notificationService } from '../services/notification.service.js';
import {
  ListNotificationQuerySchema,
  AdminAlertQuerySchema,
  DeliveryHealthQuerySchema,
} from '../validators/notification.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class NotificationController {
  // --- Current User Operations ---

  public async getMyNotifications(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const query = ListNotificationQuerySchema.parse(req.query);
      const result = await notificationService.getUserNotifications(userId, query);

      sendSuccess({
        res,
        code: 'NOTIFICATIONS_RETRIEVED',
        message: 'User notifications retrieved successfully',
        data: result.notifications.map((n) => ({
          id: n._id.toString(),
          title: n.title,
          message: n.message,
          category: n.category,
          priority: n.priority,
          isRead: n.isRead,
          readAt: n.readAt,
          actionUrl: n.actionUrl,
          createdAt: n.createdAt,
        })),
        meta: {
          unreadCount: result.unreadCount,
          pagination: result.pagination,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const unreadCount = await notificationService.getUnreadCount(userId);

      sendSuccess({
        res,
        code: 'UNREAD_COUNT_RETRIEVED',
        message: 'Unread notification count retrieved',
        data: { unreadCount },
      });
    } catch (err) {
      next(err);
    }
  }

  public async markAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const updated = await notificationService.markAsRead(userId, id);

      sendSuccess({
        res,
        code: 'NOTIFICATION_MARKED_READ',
        message: 'Notification marked as read',
        data: {
          id: updated._id.toString(),
          isRead: updated.isRead,
          readAt: updated.readAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const result = await notificationService.markAllAsRead(userId);

      sendSuccess({
        res,
        code: 'ALL_NOTIFICATIONS_MARKED_READ',
        message: 'All unread notifications marked as read',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Admin Operations ---

  public async getAdminOperations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = AdminAlertQuerySchema.parse(req.query);
      const result = await notificationService.getAdminOperationsInbox(query);

      sendSuccess({
        res,
        code: 'OPERATIONAL_ALERTS_RETRIEVED',
        data: result.alerts.map((a) => ({
          id: a._id.toString(),
          title: a.title,
          message: a.message,
          category: a.category,
          priority: a.priority,
          isRead: a.isRead,
          targetEntityId: a.targetEntityId,
          targetEntityType: a.targetEntityType,
          actionUrl: a.actionUrl,
          createdAt: a.createdAt,
        })),
        meta: {
          pagination: result.pagination,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getDeliveryHealth(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = DeliveryHealthQuerySchema.parse(req.query);
      const result = await notificationService.getDeliveryHealthLogs(query);

      sendSuccess({
        res,
        code: 'DELIVERY_HEALTH_LOGS_RETRIEVED',
        data: result.deliveries.map((d) => ({
          deliveryId: d._id.toString(),
          sourceModule: d.sourceModule,
          sourceEventName: d.sourceEventName,
          channel: d.channel,
          templateId: d.templateId,
          recipientAddress: d.recipientAddress,
          status: d.status,
          attemptCount: d.attemptCount,
          lastAttemptAt: d.lastAttemptAt,
          nextAttemptAt: d.nextAttemptAt,
          lastErrorCode: d.lastErrorCode,
          lastErrorMessage: d.lastErrorMessage,
        })),
        meta: {
          pagination: result.pagination,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async retryDelivery(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const result = await notificationService.retryFailedDelivery(id);

      sendSuccess({
        res,
        code: 'DELIVERY_RETRY_ENQUEUED',
        message: 'Notification delivery has been enqueued for immediate retry',
        data: {
          deliveryId: result._id.toString(),
          status: result.status,
          attemptCount: result.attemptCount,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
