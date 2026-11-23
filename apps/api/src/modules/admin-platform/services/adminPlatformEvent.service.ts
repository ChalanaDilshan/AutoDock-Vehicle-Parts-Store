import crypto from 'crypto';
import mongoose from 'mongoose';
import {
  IPlatformDomainEvent,
  IAuditEventIngestInput,
  INotificationDispatchInput,
  IAdminPlatformPublicService,
} from '../contracts/adminPlatform.contract.js';
import { Notification } from '../models/notification.model.js';
import { NotificationDelivery } from '../models/notificationDelivery.model.js';
import { templateRegistry } from '../templates/templateRegistry.js';
import { emailDeliveryService } from './emailDelivery.service.js';
import { auditService } from './audit.service.js';
import { logger } from '../../../shared/utils/logger.js';

export class AdminPlatformEventService implements IAdminPlatformPublicService {
  /**
   * Generates a deterministic idempotency key for delivery attempts.
   */
  public generateIdempotencyKey(
    sourceModule: string,
    eventId: string,
    recipientId: string,
    channel: string
  ): string {
    const raw = `${sourceModule}:${eventId}:${recipientId}:${channel}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Public Contract: Ingests an authoritative domain event from MOD-01..04.
   * STRICT INVARIANT: Idempotent. Replaying an event does not create duplicate notifications or emails.
   */
  public async ingestDomainEvent(
    event: IPlatformDomainEvent
  ): Promise<{ accepted: boolean; duplicateIgnored?: boolean }> {
    if (!event.eventId || !event.sourceModule || !event.eventName) {
      logger.warn('[AdminPlatformEventService] Discarding malformed domain event', { event });
      return { accepted: false };
    }

    const { eventId, sourceModule, eventName, payload } = event;

    // 1. Evaluate Audit Requirements
    await this.evaluateEventAudit(event);

    // 2. Evaluate Notification Requirements
    const dispatchTargets = this.resolveNotificationTargets(event);
    if (dispatchTargets.length === 0) {
      return { accepted: true };
    }

    let duplicateIgnored = false;

    for (const target of dispatchTargets) {
      // 2a. In-App Notification Delivery
      if (target.channels.includes('IN_APP') && target.recipientId) {
        const inAppKey = this.generateIdempotencyKey(sourceModule, eventId, target.recipientId, 'IN_APP');

        const existingInApp = await NotificationDelivery.findOne({ idempotencyKey: inAppKey });
        if (existingInApp) {
          duplicateIgnored = true;
        } else {
          const { version, rendered } = templateRegistry.render(target.templateId, payload);

          const inAppDoc = await Notification.create({
            recipientId: new mongoose.Types.ObjectId(target.recipientId),
            recipientRole: target.recipientRole,
            title: rendered.inAppTitle,
            message: rendered.inAppMessage,
            category: target.category || 'SYSTEM',
            priority: target.priority || 'NORMAL',
            actionUrl: target.actionUrl || null,
            targetEntityId: target.targetEntityId || null,
            targetEntityType: target.targetEntityType || null,
          });

          await NotificationDelivery.create({
            idempotencyKey: inAppKey,
            sourceModule,
            sourceEventId: eventId,
            sourceEventName: eventName,
            channel: 'IN_APP',
            templateId: target.templateId,
            templateVersion: version,
            recipientId: new mongoose.Types.ObjectId(target.recipientId),
            recipientAddress: target.recipientId,
            status: 'DELIVERED',
            attemptCount: 1,
            maxAttempts: 1,
            notificationId: inAppDoc._id,
          });
        }
      }

      // 2b. Email Notification Delivery
      if (target.channels.includes('EMAIL') && target.recipientEmail) {
        const emailKey = this.generateIdempotencyKey(sourceModule, eventId, target.recipientEmail, 'EMAIL');

        const existingEmail = await NotificationDelivery.findOne({ idempotencyKey: emailKey });
        if (existingEmail) {
          duplicateIgnored = true;
        } else {
          const { version, rendered } = templateRegistry.render(target.templateId, payload);

          const delivery = await NotificationDelivery.create({
            idempotencyKey: emailKey,
            sourceModule,
            sourceEventId: eventId,
            sourceEventName: eventName,
            channel: 'EMAIL',
            templateId: target.templateId,
            templateVersion: version,
            recipientId: target.recipientId
              ? new mongoose.Types.ObjectId(target.recipientId)
              : new mongoose.Types.ObjectId('000000000000000000000000'),
            recipientAddress: target.recipientEmail,
            status: 'QUEUED',
            attemptCount: 0,
            maxAttempts: 3,
            nextAttemptAt: new Date(),
          });

          // Asynchronously dispatch through email delivery service
          setImmediate(async () => {
            try {
              await emailDeliveryService.dispatchDeliveryRecord(delivery, {
                to: target.recipientEmail!,
                subject: rendered.subject,
                html: rendered.htmlBody,
                text: rendered.textBody,
              });
            } catch (err: any) {
              logger.warn(`[AdminPlatformEventService] Background dispatch error: ${err.message}`);
            }
          });
        }
      }
    }

    return { accepted: true, duplicateIgnored };
  }

  /**
   * Public Contract: Log audit event directly from internal module service.
   */
  public async logAudit(input: IAuditEventIngestInput): Promise<string> {
    const record = await auditService.recordAuditEvent(input);
    return record._id.toString();
  }

  /**
   * Public Contract: Dispatch programmatic notification directly from internal service.
   */
  public async dispatchNotification(
    input: INotificationDispatchInput
  ): Promise<{ inAppCreated: boolean; emailEnqueued: boolean }> {
    const sourceModule = input.sourceModule || 'MOD-05';
    const eventId = input.sourceEventId || new mongoose.Types.ObjectId().toString();
    const eventName = input.sourceEventName || 'PROGRAMMATIC_NOTIFICATION';

    let inAppCreated = false;
    let emailEnqueued = false;

    // 1. In-App Notification
    if (input.recipientId && mongoose.Types.ObjectId.isValid(input.recipientId)) {
      const inAppKey = this.generateIdempotencyKey(sourceModule, eventId, input.recipientId, 'IN_APP');
      const existing = await NotificationDelivery.findOne({ idempotencyKey: inAppKey });

      if (!existing) {
        const { version, rendered } = templateRegistry.render(input.templateId, input.bodyData);

        const inAppDoc = await Notification.create({
          recipientId: new mongoose.Types.ObjectId(input.recipientId),
          recipientRole: input.recipientRole || 'CUSTOMER',
          title: rendered.inAppTitle || input.subject,
          message: rendered.inAppMessage || input.bodyData.message || input.subject,
          category: input.category || 'SYSTEM',
          priority: input.priority || 'NORMAL',
          actionUrl: input.actionUrl || null,
        });

        await NotificationDelivery.create({
          idempotencyKey: inAppKey,
          sourceModule,
          sourceEventId: eventId,
          sourceEventName: eventName,
          channel: 'IN_APP',
          templateId: input.templateId,
          templateVersion: version,
          recipientId: new mongoose.Types.ObjectId(input.recipientId),
          recipientAddress: input.recipientId,
          status: 'DELIVERED',
          attemptCount: 1,
          maxAttempts: 1,
          notificationId: inAppDoc._id,
        });
        inAppCreated = true;
      }
    }

    // 2. Email Notification
    if (input.recipientEmail) {
      const emailKey = this.generateIdempotencyKey(sourceModule, eventId, input.recipientEmail, 'EMAIL');
      const existing = await NotificationDelivery.findOne({ idempotencyKey: emailKey });

      if (!existing) {
        const { version, rendered } = templateRegistry.render(input.templateId, input.bodyData);

        const delivery = await NotificationDelivery.create({
          idempotencyKey: emailKey,
          sourceModule,
          sourceEventId: eventId,
          sourceEventName: eventName,
          channel: 'EMAIL',
          templateId: input.templateId,
          templateVersion: version,
          recipientId: input.recipientId && mongoose.Types.ObjectId.isValid(input.recipientId)
            ? new mongoose.Types.ObjectId(input.recipientId)
            : new mongoose.Types.ObjectId('000000000000000000000000'),
          recipientAddress: input.recipientEmail,
          status: 'QUEUED',
          attemptCount: 0,
          maxAttempts: 3,
          nextAttemptAt: new Date(),
        });

        setImmediate(async () => {
          try {
            await emailDeliveryService.dispatchDeliveryRecord(delivery, {
              to: input.recipientEmail!,
              subject: rendered.subject || input.subject,
              html: rendered.htmlBody,
              text: rendered.textBody,
            });
          } catch (err: any) {
            logger.warn(`[AdminPlatformEventService] Background programmatic dispatch error: ${err.message}`);
          }
        });
        emailEnqueued = true;
      }
    }

    return { inAppCreated, emailEnqueued };
  }

  // --- Private Event Evaluators ---

  private async evaluateEventAudit(event: IPlatformDomainEvent): Promise<void> {
    const { eventName, sourceModule, payload, correlationId, timestamp } = event;

    // Automatic audit logging mapping based on approved event catalogue
    if (eventName === 'SELLER_VERIFICATION_DECISION') {
      await auditService.recordAuditEvent({
        action: 'SELLER_APPLICATION_REVIEWED',
        sourceModule,
        severity: 'CRITICAL',
        actorId: payload.adminId || 'SYSTEM',
        actorRole: 'ADMIN',
        targetEntityType: 'SELLER_PROFILE',
        targetEntityId: payload.sellerId,
        delta: [
          { field: 'verificationStatus', oldValue: 'UNDER_REVIEW', newValue: payload.decision },
          { field: 'isEligibleToSell', oldValue: false, newValue: payload.isEligibleToSell },
        ],
        reason: payload.notes || payload.verificationMethod,
        correlationId,
        timestamp,
      });
    } else if (eventName === 'SELLER_BANK_DETAILS_REVIEWED') {
      await auditService.recordAuditEvent({
        action: 'SELLER_BANK_DETAILS_VERIFIED',
        sourceModule,
        severity: 'CRITICAL',
        actorId: payload.adminId || 'SYSTEM',
        actorRole: 'ADMIN',
        targetEntityType: 'SELLER_BANK_DETAILS',
        targetEntityId: payload.sellerId,
        delta: [{ field: 'verificationStatus', oldValue: 'PENDING', newValue: payload.decision }],
        reason: payload.rejectionReason,
        correlationId,
        timestamp,
      });
    } else if (eventName === 'COMMISSION_INVOICE_ISSUED') {
      await auditService.recordAuditEvent({
        action: 'FINANCE_INVOICE_ISSUED',
        sourceModule,
        severity: 'HIGH',
        actorId: payload.adminId || 'SYSTEM',
        actorRole: 'ADMIN',
        targetEntityType: 'SELLER_INVOICE',
        targetEntityId: payload.invoiceId,
        publicReference: payload.invoiceNumber,
        delta: [{ field: 'status', oldValue: 'DRAFT', newValue: 'ISSUED' }],
        correlationId,
        timestamp,
      });
    }
  }

  private resolveNotificationTargets(event: IPlatformDomainEvent): Array<{
    recipientId?: string;
    recipientRole: 'CUSTOMER' | 'SELLER' | 'ADMIN';
    recipientEmail?: string;
    templateId: string;
    category?: 'ORDER' | 'PAYMENT' | 'VERIFICATION' | 'FINANCE' | 'SYSTEM' | 'SECURITY';
    priority?: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
    channels: Array<'IN_APP' | 'EMAIL'>;
    actionUrl?: string;
    targetEntityId?: string;
    targetEntityType?: string;
  }> {
    const { eventName, payload } = event;
    const targets: ReturnType<typeof this.resolveNotificationTargets> = [];

    switch (eventName) {
      case 'USER_REGISTERED':
        targets.push({
          recipientId: payload.userId,
          recipientRole: payload.role || 'CUSTOMER',
          recipientEmail: payload.email,
          templateId: 'WELCOME_USER_ACCOUNT',
          category: 'SECURITY',
          priority: 'NORMAL',
          channels: ['IN_APP', 'EMAIL'],
        });
        break;

      case 'SELLER_APPLICATION_SUBMITTED':
        targets.push({
          recipientId: payload.userId,
          recipientRole: 'SELLER',
          recipientEmail: payload.billingEmail,
          templateId: 'SELLER_APPLICATION_RECEIVED',
          category: 'VERIFICATION',
          priority: 'HIGH',
          channels: payload.billingEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
          actionUrl: '/seller/onboarding',
        });
        break;

      case 'SELLER_VERIFICATION_DECISION':
        targets.push({
          recipientId: payload.userId,
          recipientRole: 'SELLER',
          recipientEmail: payload.sellerEmail,
          templateId:
            payload.decision === 'APPROVE'
              ? 'SELLER_APPLICATION_APPROVED'
              : payload.decision === 'REJECT'
              ? 'SELLER_APPLICATION_REJECTED'
              : 'SELLER_ADDITIONAL_INFO_REQUESTED',
          category: 'VERIFICATION',
          priority: 'HIGH',
          channels: payload.sellerEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
          actionUrl: payload.decision === 'APPROVE' ? '/seller/dashboard' : '/seller/onboarding',
        });
        break;

      case 'SELLER_BANK_DETAILS_REVIEWED':
        targets.push({
          recipientId: payload.userId,
          recipientRole: 'SELLER',
          recipientEmail: payload.sellerEmail,
          templateId: 'SELLER_BANK_DETAILS_OUTCOME',
          category: 'VERIFICATION',
          priority: 'HIGH',
          channels: payload.sellerEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
          actionUrl: '/seller/dashboard',
        });
        break;

      case 'MASTER_ORDER_PLACED':
        targets.push({
          recipientId: payload.customerId,
          recipientRole: 'CUSTOMER',
          recipientEmail: payload.customerEmail,
          templateId: 'CUSTOMER_ORDER_CONFIRMATION',
          category: 'ORDER',
          priority: 'HIGH',
          channels: payload.customerEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
          actionUrl: `/orders/${payload.orderId}`,
        });
        break;

      case 'SELLER_SUBORDER_CREATED':
        targets.push({
          recipientId: payload.sellerUserId || payload.sellerId,
          recipientRole: 'SELLER',
          recipientEmail: payload.sellerEmail,
          templateId: 'SELLER_NEW_ORDER_ALERT',
          category: 'ORDER',
          priority: 'HIGH',
          channels: payload.sellerEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
          actionUrl: `/seller/orders/${payload.suborderId}`,
        });
        break;

      case 'BANK_TRANSFER_RECEIPT_REVIEWED':
        targets.push({
          recipientId: payload.customerId,
          recipientRole: 'CUSTOMER',
          recipientEmail: payload.customerEmail,
          templateId:
            payload.decision === 'APPROVE' ? 'CUSTOMER_PAYMENT_VERIFIED' : 'CUSTOMER_PAYMENT_REJECTED',
          category: 'PAYMENT',
          priority: 'HIGH',
          channels: payload.customerEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
          actionUrl: `/orders/${payload.suborderId}`,
        });
        break;

      case 'SUBORDER_FULFILLMENT_STATUS_UPDATED':
        targets.push({
          recipientId: payload.customerId,
          recipientRole: 'CUSTOMER',
          recipientEmail: payload.customerEmail,
          templateId:
            payload.newStatus === 'DISPATCHED'
              ? 'CUSTOMER_ORDER_DISPATCHED'
              : payload.newStatus === 'DELIVERED'
              ? 'CUSTOMER_ORDER_DELIVERED'
              : 'GENERIC_NOTIFICATION',
          category: 'ORDER',
          priority: 'NORMAL',
          channels: payload.customerEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
          actionUrl: `/orders/${payload.suborderId}`,
        });
        break;

      case 'COMMISSION_INVOICE_ISSUED':
        targets.push({
          recipientId: payload.sellerUserId || payload.sellerId,
          recipientRole: 'SELLER',
          recipientEmail: payload.billingEmail,
          templateId: 'SELLER_MONTHLY_INVOICE_ISSUED',
          category: 'FINANCE',
          priority: 'HIGH',
          channels: payload.billingEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
          actionUrl: '/seller/invoices',
        });
        break;

      case 'INVOICE_PAYMENT_RECEIPT_VERIFIED':
        targets.push({
          recipientId: payload.sellerUserId || payload.sellerId,
          recipientRole: 'SELLER',
          recipientEmail: payload.sellerEmail,
          templateId: 'SELLER_INVOICE_PAYMENT_APPROVED',
          category: 'FINANCE',
          priority: 'HIGH',
          channels: payload.sellerEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
          actionUrl: '/seller/invoices',
        });
        break;

      case 'INVOICE_PAYMENT_RECEIPT_REJECTED':
        targets.push({
          recipientId: payload.sellerUserId || payload.sellerId,
          recipientRole: 'SELLER',
          recipientEmail: payload.sellerEmail,
          templateId: 'SELLER_INVOICE_PAYMENT_REJECTED',
          category: 'FINANCE',
          priority: 'HIGH',
          channels: payload.sellerEmail ? ['IN_APP', 'EMAIL'] : ['IN_APP'],
          actionUrl: '/seller/invoices',
        });
        break;
    }

    return targets;
  }
}

export const adminPlatformEventService = new AdminPlatformEventService();
