import { logger } from '../../../shared/utils/logger.js';
import { adminPlatformEventService } from '../../admin-platform/services/adminPlatformEvent.service.js';

export interface AuditEventPayload {
  action: string;
  actorId: string;
  actorRole: string;
  targetId?: string;
  details: Record<string, any>;
  timestamp?: Date;
}

export interface NotificationPayload {
  recipientId: string;
  recipientEmail?: string;
  template: string;
  subject: string;
  bodyData: Record<string, any>;
}

export class FinanceAuditNotifier {
  /**
   * Records a security/audit event. Delegates to MOD-05 Central Audit Store.
   */
  public logAudit(event: AuditEventPayload): void {
    logger.info(`[FinanceAudit] AUDIT_EVENT: ${event.action}`, {
      actorId: event.actorId,
      actorRole: event.actorRole,
      targetId: event.targetId,
      details: event.details,
      timestamp: event.timestamp || new Date(),
    });

    // Delegate asynchronously to MOD-05 Central Audit Store
    setImmediate(async () => {
      try {
        await adminPlatformEventService.logAudit({
          action: event.action,
          sourceModule: 'MOD-04',
          severity: 'HIGH',
          actorId: event.actorId,
          actorRole: (event.actorRole as any) || 'ADMIN',
          targetEntityType: 'SELLER_FINANCE',
          targetEntityId: event.targetId || '000000000000000000000000',
          delta: event.details
            ? Object.entries(event.details).map(([k, v]) => ({ field: k, oldValue: null, newValue: v }))
            : [],
          timestamp: event.timestamp || new Date(),
        });
      } catch (err: any) {
        logger.warn(`[FinanceAuditNotifier] Audit delegation to MOD-05 failed: ${err.message}`);
      }
    });
  }

  /**
   * Dispatches a notification event. Delegates to MOD-05 Notification Infrastructure.
   */
  public dispatchNotification(notification: NotificationPayload): void {
    logger.info(`[FinanceNotifier] NOTIFICATION_DISPATCHED: ${notification.template}`, {
      recipientId: notification.recipientId,
      subject: notification.subject,
      bodyData: notification.bodyData,
    });

    // Delegate asynchronously to MOD-05 Notification Dispatcher
    setImmediate(async () => {
      try {
        await adminPlatformEventService.dispatchNotification({
          recipientId: notification.recipientId,
          recipientRole: 'SELLER',
          recipientEmail: notification.recipientEmail,
          templateId: notification.template,
          subject: notification.subject,
          category: 'FINANCE',
          priority: 'HIGH',
          bodyData: notification.bodyData,
          sourceModule: 'MOD-04',
        });
      } catch (err: any) {
        logger.warn(`[FinanceAuditNotifier] Notification delegation to MOD-05 failed: ${err.message}`);
      }
    });
  }
}

export const financeAuditNotifier = new FinanceAuditNotifier();
