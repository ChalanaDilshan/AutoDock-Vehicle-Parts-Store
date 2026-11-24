import mongoose from 'mongoose';
import { Notification, INotification } from '../models/notification.model.js';
import { NotificationDelivery, INotificationDelivery } from '../models/notificationDelivery.model.js';
import { emailDeliveryService } from './emailDelivery.service.js';
import { templateRegistry } from '../templates/templateRegistry.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

export interface UserNotificationQueryFilter {
  page?: number;
  limit?: number;
  isRead?: boolean;
  category?: string;
}

export class NotificationService {
  /**
   * Customer/Seller/Admin: Get authenticated user's notification list with BOLA enforcement.
   */
  public async getUserNotifications(
    userId: string,
    filter: UserNotificationQueryFilter
  ): Promise<{
    notifications: INotification[];
    unreadCount: number;
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const query: Record<string, unknown> = { recipientId: userObjectId };

    if (filter.isRead !== undefined) {
      query.isRead = filter.isRead;
    }
    if (filter.category) {
      query.category = filter.category;
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(50, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientId: userObjectId, isRead: false }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * User: Unread badge count.
   */
  public async getUnreadCount(userId: string): Promise<number> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    return Notification.countDocuments({ recipientId: userObjectId, isRead: false });
  }

  /**
   * User: Mark single notification read (BOLA protected).
   */
  public async markAsRead(userId: string, notificationId: string): Promise<INotification> {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new AppError('Invalid notification ID format', 400, 'INVALID_ID');
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new AppError('Notification not found', 404, 'NOT_FOUND');
    }

    // Strict BOLA verification
    if (notification.recipientId.toString() !== userId) {
      throw new AppError('You do not have permission to modify this notification', 403, 'FORBIDDEN');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await notification.save();
    }

    return notification;
  }

  /**
   * User: Mark all unread notifications as read.
   */
  public async markAllAsRead(userId: string): Promise<{ updatedCount: number }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const result = await Notification.updateMany(
      { recipientId: userObjectId, isRead: false },
      { $set: { isRead: true, readAt: new Date() } }
    );

    return { updatedCount: result.modifiedCount };
  }

  /**
   * Admin: Operational alerts inbox.
   */
  public async getAdminOperationsInbox(filter: {
    page?: number;
    limit?: number;
    category?: string;
    priority?: string;
  }): Promise<{
    alerts: INotification[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query: Record<string, unknown> = { recipientRole: 'ADMIN' };
    if (filter.category) query.category = filter.category;
    if (filter.priority) query.priority = filter.priority;

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(50, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [alerts, total] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(query),
    ]);

    return {
      alerts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin: Delivery health logs.
   */
  public async getDeliveryHealthLogs(filter: {
    status?: string;
    channel?: string;
    page?: number;
    limit?: number;
  }): Promise<{
    deliveries: INotificationDelivery[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query: Record<string, unknown> = {};
    if (filter.status) query.status = filter.status;
    if (filter.channel) query.channel = filter.channel;

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [deliveries, total] = await Promise.all([
      NotificationDelivery.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      NotificationDelivery.countDocuments(query),
    ]);

    return {
      deliveries,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Admin: Safe manual retry of failed notification.
   */
  public async retryFailedDelivery(deliveryId: string): Promise<INotificationDelivery> {
    if (!mongoose.Types.ObjectId.isValid(deliveryId)) {
      throw new AppError('Invalid delivery record ID format', 400, 'INVALID_ID');
    }

    const delivery = await NotificationDelivery.findById(deliveryId);
    if (!delivery) {
      throw new AppError('Delivery record not found', 404, 'NOT_FOUND');
    }

    if (delivery.channel === 'EMAIL') {
      delivery.status = 'QUEUED';
      delivery.nextAttemptAt = new Date();
      delivery.lastErrorCode = null;
      delivery.lastErrorMessage = null;
      await delivery.save();

      // Render accurate email content using payload snapshot if available
      const payload = delivery.payloadSnapshot || {};
      const { rendered } = templateRegistry.render(delivery.templateId, payload);
      const subject = rendered.subject || delivery.sourceEventName;
      const html = rendered.htmlBody || `<p>Retried AutoDock notification for ${delivery.sourceEventName}</p>`;
      const text = rendered.textBody || `Retried notification for ${delivery.sourceEventName}`;

      // Trigger asynchronous dispatch
      setImmediate(async () => {
        await emailDeliveryService.dispatchDeliveryRecord(delivery, {
          to: delivery.recipientAddress,
          subject,
          html,
          text,
        });
      });
    }

    return delivery;
  }
}

export const notificationService = new NotificationService();
