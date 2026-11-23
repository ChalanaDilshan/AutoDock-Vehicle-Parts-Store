import { logger } from '../../../shared/utils/logger.js';

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
   * Records a security/audit event. In the future, this delegates to MOD-05 Central Audit Store.
   */
  public logAudit(event: AuditEventPayload): void {
    logger.info(`[FinanceAudit] AUDIT_EVENT: ${event.action}`, {
      actorId: event.actorId,
      actorRole: event.actorRole,
      targetId: event.targetId,
      details: event.details,
      timestamp: event.timestamp || new Date(),
    });
  }

  /**
   * Dispatches a notification event. In the future, this delegates to MOD-05 Notification Infrastructure.
   */
  public dispatchNotification(notification: NotificationPayload): void {
    logger.info(`[FinanceNotifier] NOTIFICATION_DISPATCHED: ${notification.template}`, {
      recipientId: notification.recipientId,
      subject: notification.subject,
      bodyData: notification.bodyData,
    });
  }
}

export const financeAuditNotifier = new FinanceAuditNotifier();
