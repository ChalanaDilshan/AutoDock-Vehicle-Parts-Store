import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { adminPlatformEventService } from '../../../src/modules/admin-platform/services/adminPlatformEvent.service.js';
import { Notification } from '../../../src/modules/admin-platform/models/notification.model.js';
import { NotificationDelivery } from '../../../src/modules/admin-platform/models/notificationDelivery.model.js';
import { AuditEvent } from '../../../src/modules/admin-platform/models/auditEvent.model.js';
import { financeAuditNotifier } from '../../../src/modules/finance-promotions/services/financeAuditNotifier.js';

describe('MOD-05 Cross-Module Event Ingestion & Idempotency Tests', () => {
  const testDbUri = 'mongodb://localhost:27017/autodock_test_mod05_events';

  const customerId = new mongoose.Types.ObjectId().toString();
  const sellerId = new mongoose.Types.ObjectId().toString();
  const adminId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await Notification.deleteMany({});
    await NotificationDelivery.deleteMany({});
    await AuditEvent.deleteMany({}).catch(() => {});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
    await NotificationDelivery.deleteMany({});
    if (mongoose.connection.db) {
      await mongoose.connection.db.collection('audit_events').deleteMany({});
    }
  });

  it('TC-XMOD-01: Ingests MOD-01 USER_REGISTERED event and creates in-app notification', async () => {
    const eventId = `EVT-REG-${Date.now()}`;
    const result = await adminPlatformEventService.ingestDomainEvent({
      eventId,
      sourceModule: 'MOD-01',
      eventName: 'USER_REGISTERED',
      timestamp: new Date(),
      payload: {
        userId: customerId,
        email: 'newuser@example.com',
        firstName: 'Kamal',
        lastName: 'Perera',
        role: 'CUSTOMER',
      },
    });

    expect(result.accepted).toBe(true);

    const notif = await Notification.findOne({ recipientId: customerId });
    expect(notif).toBeDefined();
    expect(notif?.title).toBe('Welcome to AutoDock');
    expect(notif?.message).toContain('Kamal');
  });

  it('TC-XMOD-02: Ingests MOD-01 SELLER_VERIFICATION_DECISION and logs compliance audit record', async () => {
    const eventId = `EVT-KYC-${Date.now()}`;
    const result = await adminPlatformEventService.ingestDomainEvent({
      eventId,
      sourceModule: 'MOD-01',
      eventName: 'SELLER_VERIFICATION_DECISION',
      timestamp: new Date(),
      payload: {
        sellerId,
        userId: sellerId,
        adminId,
        decision: 'APPROVE',
        businessName: 'Lanka Auto Hub',
        isEligibleToSell: true,
        sellerEmail: 'seller@lankahub.lk',
      },
    });

    expect(result.accepted).toBe(true);

    // Verify audit record created
    const audit = await AuditEvent.findOne({
      action: 'SELLER_APPLICATION_REVIEWED',
      'targetEntity.entityId': sellerId,
    });
    expect(audit).toBeDefined();
    expect(audit?.severity).toBe('CRITICAL');

    // Verify seller notification created
    const notif = await Notification.findOne({ recipientId: sellerId });
    expect(notif?.title).toBe('Seller Account Approved');
  });

  it('TC-XMOD-03: Ingests MOD-03 MASTER_ORDER_PLACED event and enqueues customer order confirmation', async () => {
    const eventId = `EVT-ORD-${Date.now()}`;
    const result = await adminPlatformEventService.ingestDomainEvent({
      eventId,
      sourceModule: 'MOD-03',
      eventName: 'MASTER_ORDER_PLACED',
      timestamp: new Date(),
      payload: {
        orderId: 'ORD-OBJ-001',
        orderNumber: 'ORD-20261123-0001',
        customerId,
        customerEmail: 'customer@example.com',
        grandTotalInCents: 1450000,
        paymentMethod: 'CARD_SANDBOX',
      },
    });

    expect(result.accepted).toBe(true);

    const notif = await Notification.findOne({ recipientId: customerId });
    expect(notif?.title).toBe('Order Confirmed');
    expect(notif?.message).toContain('ORD-20261123-0001');

    const emailDelivery = await NotificationDelivery.findOne({
      sourceEventId: eventId,
      channel: 'EMAIL',
    });
    expect(emailDelivery).toBeDefined();
    expect(emailDelivery?.recipientAddress).toBe('customer@example.com');
  });

  it('TC-XMOD-04: Strict Idempotency: Replaying identical event does not duplicate notifications', async () => {
    const eventId = `EVT-IDEMP-${Date.now()}`;
    const eventPayload = {
      eventId,
      sourceModule: 'MOD-03' as const,
      eventName: 'MASTER_ORDER_PLACED',
      timestamp: new Date(),
      payload: {
        orderId: 'ORD-OBJ-002',
        orderNumber: 'ORD-20261123-0002',
        customerId,
        customerEmail: 'customer@example.com',
        grandTotalInCents: 500000,
        paymentMethod: 'COD',
      },
    };

    // First ingestion
    const res1 = await adminPlatformEventService.ingestDomainEvent(eventPayload);
    expect(res1.accepted).toBe(true);
    expect(res1.duplicateIgnored).toBeFalsy();

    // Replay identical event
    const res2 = await adminPlatformEventService.ingestDomainEvent(eventPayload);
    expect(res2.accepted).toBe(true);
    expect(res2.duplicateIgnored).toBe(true);

    // Verify strictly 1 in-app notification and 1 delivery record created
    const notifs = await Notification.find({ recipientId: customerId });
    expect(notifs).toHaveLength(1);

    const deliveries = await NotificationDelivery.find({ sourceEventId: eventId });
    expect(deliveries).toHaveLength(2); // 1 for IN_APP, 1 for EMAIL
  });

  it('TC-XMOD-05: MOD-04 financeAuditNotifier delegates to MOD-05 seamlessly', async () => {
    // Calling financeAuditNotifier from MOD-04
    financeAuditNotifier.logAudit({
      action: 'TEST_FINANCE_ACTION',
      actorId: adminId,
      actorRole: 'ADMIN',
      targetId: 'INV-TEST-001',
      details: { amount: 5000 },
    });

    financeAuditNotifier.dispatchNotification({
      recipientId: sellerId,
      recipientEmail: 'seller@test.lk',
      template: 'SELLER_MONTHLY_INVOICE_ISSUED',
      subject: 'Invoice Issued Test',
      bodyData: {
        invoiceNumber: 'INV-202611-TEST',
        billingPeriod: '2026-11',
        grossCommissionInCents: 500000,
      },
    });

    // Wait for setImmediate to execute
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify audit record ingested into MOD-05 AuditEvent collection
    const audit = await AuditEvent.findOne({ action: 'TEST_FINANCE_ACTION' });
    expect(audit).toBeDefined();
    expect(audit?.sourceModule).toBe('MOD-04');

    // Verify notification was created
    const notif = await Notification.findOne({ recipientId: sellerId });
    expect(notif).toBeDefined();
    expect(notif?.title).toBe('Monthly Commission Invoice Issued');
  });

  it('TC-XMOD-06: Gracefully handles non-ObjectId recipientId without throwing BSONError', async () => {
    const eventId = new mongoose.Types.ObjectId().toString();
    const result = await adminPlatformEventService.ingestDomainEvent({
      eventId,
      sourceModule: 'MOD-03',
      eventName: 'MASTER_ORDER_PLACED',
      timestamp: new Date(),
      payload: {
        customerId: 'NON_OBJECT_ID_EXTERNAL_CUSTOMER',
        customerEmail: 'nonobj@example.com',
        orderId: 'ORD_EXT_001',
        orderNumber: 'ORD-20261123-9999',
        grandTotalInCents: 500000,
        paymentMethod: 'CARD',
      },
    });

    expect(result.accepted).toBe(true);
    // Email delivery should still be queued
    const emailDelivery = await NotificationDelivery.findOne({
      sourceEventId: eventId,
      channel: 'EMAIL',
    });
    expect(emailDelivery).toBeDefined();
    expect(emailDelivery?.recipientAddress).toBe('nonobj@example.com');
  });
});
