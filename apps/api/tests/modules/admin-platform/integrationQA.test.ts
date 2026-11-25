import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { Notification } from '../../../src/modules/admin-platform/models/notification.model.js';
import { NotificationDelivery } from '../../../src/modules/admin-platform/models/notificationDelivery.model.js';
import { AuditEvent } from '../../../src/modules/admin-platform/models/auditEvent.model.js';
import { adminPlatformEventService } from '../../../src/modules/admin-platform/services/adminPlatformEvent.service.js';
import { auditService } from '../../../src/modules/admin-platform/services/audit.service.js';

describe('MOD-05 Comprehensive Integration QA & Verification Suite', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_mod05_integration_qa';

  const customerAId = new mongoose.Types.ObjectId().toString();
  const customerBId = new mongoose.Types.ObjectId().toString();
  const sellerAId = new mongoose.Types.ObjectId().toString();
  const sellerBId = new mongoose.Types.ObjectId().toString();
  const adminId = new mongoose.Types.ObjectId().toString();

  const tokenCustomerA = jwt.sign(
    { userId: customerAId, email: 'customera@autodock.lk', role: 'CUSTOMER' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  const tokenCustomerB = jwt.sign(
    { userId: customerBId, email: 'customerb@autodock.lk', role: 'CUSTOMER' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  const tokenSellerA = jwt.sign(
    { userId: sellerAId, email: 'sellera@autodock.lk', role: 'SELLER' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  const tokenSellerB = jwt.sign(
    { userId: sellerBId, email: 'sellerb@autodock.lk', role: 'SELLER' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  const tokenAdmin = jwt.sign(
    { userId: adminId, email: 'admin@autodock.lk', role: 'ADMIN' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

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

  // ---------------------------------------------------------------------------
  // 1. Cross-Module Event Pipeline & Notifications Flow
  // ---------------------------------------------------------------------------
  describe('1. Cross-Module Event Pipeline & Notification Ingestion', () => {
    it('QA-XMOD-01: End-to-end multi-vendor checkout event emits customer order confirmation and distinct seller suborder alerts', async () => {
      const masterOrderId = 'ORD-20261125-9001';
      const masterEventId = `EVT-ORD-${Date.now()}`;

      // Ingest MOD-03 Master Order Placed Event
      const masterRes = await adminPlatformEventService.ingestDomainEvent({
        eventId: masterEventId,
        sourceModule: 'MOD-03',
        eventName: 'MASTER_ORDER_PLACED',
        timestamp: new Date(),
        payload: {
          orderId: masterOrderId,
          orderNumber: masterOrderId,
          customerId: customerAId,
          customerEmail: 'customera@autodock.lk',
          grandTotalInCents: 4500000,
          paymentMethod: 'BANK_TRANSFER',
        },
      });
      expect(masterRes.accepted).toBe(true);

      // Ingest MOD-03 Seller A Suborder Created Event
      const suborderAEventId = `EVT-SUB-A-${Date.now()}`;
      const suborderARes = await adminPlatformEventService.ingestDomainEvent({
        eventId: suborderAEventId,
        sourceModule: 'MOD-03',
        eventName: 'SELLER_SUBORDER_CREATED',
        timestamp: new Date(),
        payload: {
          suborderId: 'SUB-20261125-01',
          suborderNumber: 'SUB-20261125-01',
          sellerId: sellerAId,
          sellerUserId: sellerAId,
          sellerEmail: 'sellera@autodock.lk',
          subtotalInCents: 2000000,
          deliveryFeeInCents: 50000,
        },
      });
      expect(suborderARes.accepted).toBe(true);

      // Ingest MOD-03 Seller B Suborder Created Event
      const suborderBEventId = `EVT-SUB-B-${Date.now()}`;
      const suborderBRes = await adminPlatformEventService.ingestDomainEvent({
        eventId: suborderBEventId,
        sourceModule: 'MOD-03',
        eventName: 'SELLER_SUBORDER_CREATED',
        timestamp: new Date(),
        payload: {
          suborderId: 'SUB-20261125-02',
          suborderNumber: 'SUB-20261125-02',
          sellerId: sellerBId,
          sellerUserId: sellerBId,
          sellerEmail: 'sellerb@autodock.lk',
          subtotalInCents: 2500000,
          deliveryFeeInCents: 60000,
        },
      });
      expect(suborderBRes.accepted).toBe(true);

      // Verify Customer A received 1 order confirmation notification
      const custNotifications = await Notification.find({ recipientId: customerAId });
      expect(custNotifications).toHaveLength(1);
      expect(custNotifications[0].title).toBe('Order Confirmed');

      // Verify Seller A received strictly their own suborder notification
      const sellerANotifications = await Notification.find({ recipientId: sellerAId });
      expect(sellerANotifications).toHaveLength(1);
      expect(sellerANotifications[0].title).toBe('New Order Received');
      expect(sellerANotifications[0].actionUrl).toBe('/seller/orders/SUB-20261125-01');

      // Verify Seller B received strictly their own suborder notification
      const sellerBNotifications = await Notification.find({ recipientId: sellerBId });
      expect(sellerBNotifications).toHaveLength(1);
      expect(sellerBNotifications[0].actionUrl).toBe('/seller/orders/SUB-20261125-02');
    });

    it('QA-XMOD-02: Bank transfer slip review produces customer notification with server-confirmed status', async () => {
      const eventId = `EVT-SLIP-${Date.now()}`;
      const res = await adminPlatformEventService.ingestDomainEvent({
        eventId,
        sourceModule: 'MOD-03',
        eventName: 'BANK_TRANSFER_RECEIPT_REVIEWED',
        timestamp: new Date(),
        payload: {
          suborderId: 'SUB-SLIP-01',
          customerId: customerAId,
          customerEmail: 'customera@autodock.lk',
          decision: 'APPROVE',
        },
      });
      expect(res.accepted).toBe(true);

      const notif = await Notification.findOne({ recipientId: customerAId });
      expect(notif?.title).toBe('Bank Payment Verified');
      expect(notif?.category).toBe('PAYMENT');
    });

    it('QA-XMOD-03: MOD-04 Commission invoice event dispatches seller alert and logs compliance audit record', async () => {
      const eventId = `EVT-INV-${Date.now()}`;
      const res = await adminPlatformEventService.ingestDomainEvent({
        eventId,
        sourceModule: 'MOD-04',
        eventName: 'COMMISSION_INVOICE_ISSUED',
        timestamp: new Date(),
        payload: {
          invoiceId: 'INV-OBJ-01',
          invoiceNumber: 'INV-202611-001',
          sellerId: sellerAId,
          sellerUserId: sellerAId,
          billingEmail: 'sellera@autodock.lk',
          adminId,
        },
      });
      expect(res.accepted).toBe(true);

      // Verify audit trail logged
      const audit = await AuditEvent.findOne({ action: 'FINANCE_INVOICE_ISSUED' });
      expect(audit).toBeDefined();
      expect(audit?.sourceModule).toBe('MOD-04');
      expect(audit?.targetEntity.publicReference).toBe('INV-202611-001');

      // Verify seller received in-app notification
      const notif = await Notification.findOne({ recipientId: sellerAId });
      expect(notif?.title).toBe('Monthly Commission Invoice Issued');
      expect(notif?.category).toBe('FINANCE');
    });
  });

  // ---------------------------------------------------------------------------
  // 2. BOLA & Cross-Tenant Data Isolation QA
  // ---------------------------------------------------------------------------
  describe('2. BOLA & Cross-Tenant Data Isolation QA', () => {
    it('QA-SEC-01: Customer A cannot access or mark read Customer B in-app notifications (403 Forbidden)', async () => {
      const notifB = await Notification.create({
        recipientId: new mongoose.Types.ObjectId(customerBId),
        recipientRole: 'CUSTOMER',
        title: 'Customer B Alert',
        message: 'Private message for Customer B',
        category: 'SECURITY',
        isRead: false,
      });

      // Customer A attempts to mark Customer B notification as read
      const patchRes = await request(app)
        .patch(`/api/v1/notifications/${notifB._id}/read`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(403);

      expect(patchRes.body.success).toBe(false);

      // Customer A requests notifications list - Customer B notification must not appear
      const listRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(200);

      const returnedIds = listRes.body.data.map((n: any) => n.id);
      expect(returnedIds).not.toContain(notifB._id.toString());
    });

    it('QA-SEC-02: Seller A cannot access Seller B order alerts or audit records', async () => {
      await Notification.create({
        recipientId: new mongoose.Types.ObjectId(sellerBId),
        recipientRole: 'SELLER',
        title: 'Seller B Private Suborder',
        message: 'Order details for store B',
        category: 'ORDER',
        isRead: false,
      });

      // Seller A requests notifications list - Seller B notification must not appear
      const listRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenSellerA}`)
        .expect(200);

      expect(listRes.body.data).toHaveLength(0);

      // Seller A attempts to access admin audit logs -> 403 Forbidden
      await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${tokenSellerA}`)
        .expect(403);

      // Seller A attempts to access admin operations alerts -> 403 Forbidden
      await request(app)
        .get('/api/v1/admin/notifications/operations')
        .set('Authorization', `Bearer ${tokenSellerA}`)
        .expect(403);
    });

    it('QA-SEC-03: Unauthenticated visitor is denied access to all notification and admin endpoints (401 Unauthorized)', async () => {
      await request(app).get('/api/v1/notifications').expect(401);
      await request(app).get('/api/v1/notifications/unread-count').expect(401);
      await request(app).get('/api/v1/admin/dashboard/summary').expect(401);
      await request(app).get('/api/v1/admin/audit-logs').expect(401);
      await request(app).get('/api/v1/admin/reports/sales-velocity').expect(401);
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Audit Immutability, Tamper-Resistance & Redaction QA
  // ---------------------------------------------------------------------------
  describe('3. Audit Immutability & Sensitive Data Redaction QA', () => {
    it('QA-AUDIT-01: Prohibits application-level mutation or deletion of audit logs (AUDIT_IMMUTABILITY_VIOLATION)', async () => {
      const record = await auditService.recordAuditEvent({
        action: 'SELLER_VERIFICATION_DECISION',
        sourceModule: 'MOD-01',
        severity: 'CRITICAL',
        actorId: adminId,
        actorRole: 'ADMIN',
        targetEntityType: 'SELLER_PROFILE',
        targetEntityId: sellerAId,
        delta: [{ field: 'status', oldValue: 'PENDING', newValue: 'APPROVED' }],
      });

      // Attempt update
      await expect(
        AuditEvent.updateOne({ _id: record._id }, { $set: { action: 'MUTATED' } })
      ).rejects.toThrow('AUDIT_IMMUTABILITY_VIOLATION');

      // Attempt delete
      await expect(AuditEvent.deleteOne({ _id: record._id })).rejects.toThrow(
        'AUDIT_IMMUTABILITY_VIOLATION'
      );

      // Attempt deleteMany
      await expect(AuditEvent.deleteMany({ _id: record._id })).rejects.toThrow(
        'AUDIT_IMMUTABILITY_VIOLATION'
      );
    });

    it('QA-AUDIT-02: Sensitive keys in delta payloads are sanitized to [REDACTED]', async () => {
      const record = await auditService.recordAuditEvent({
        action: 'ADMIN_SECRETS_ROTATED',
        sourceModule: 'MOD-05',
        severity: 'HIGH',
        actorId: adminId,
        actorRole: 'ADMIN',
        targetEntityType: 'SYSTEM_CONFIG',
        targetEntityId: 'CFG_01',
        delta: [
          { field: 'apiKey', oldValue: 'live_secret_123', newValue: 'live_secret_456' },
          { field: 'passwordHash', oldValue: 'hash_old', newValue: 'hash_new' },
          { field: 'normalSetting', oldValue: 'A', newValue: 'B' },
        ],
      });

      const apiKeyDelta = record.delta?.find((d) => d.field === 'apiKey');
      const passwordDelta = record.delta?.find((d) => d.field === 'passwordHash');
      const normalDelta = record.delta?.find((d) => d.field === 'normalSetting');

      expect(apiKeyDelta?.oldValue).toBe('[REDACTED]');
      expect(apiKeyDelta?.newValue).toBe('[REDACTED]');
      expect(passwordDelta?.oldValue).toBe('[REDACTED]');
      expect(passwordDelta?.newValue).toBe('[REDACTED]');
      expect(normalDelta?.newValue).toBe('B');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Delivery Health, Retries & Operator Workstation QA
  // ---------------------------------------------------------------------------
  describe('4. Delivery Health, Retries & Operator Workstation QA', () => {
    it('QA-DELIV-01: Correctly tracks delivery attempts and enables authorized admin retry on failed deliveries', async () => {
      const delivery = await NotificationDelivery.create({
        idempotencyKey: 'IDEMP-FAIL-001',
        sourceModule: 'MOD-03',
        sourceEventId: 'ORD-FAIL-01',
        sourceEventName: 'CUSTOMER_ORDER_CONFIRMATION',
        channel: 'EMAIL',
        templateId: 'CUSTOMER_ORDER_CONFIRMATION',
        templateVersion: '1.0',
        recipientId: new mongoose.Types.ObjectId(customerAId),
        recipientAddress: 'customera@autodock.lk',
        status: 'FAILED',
        attemptCount: 3,
        maxAttempts: 3,
        lastErrorCode: 'ECONNREFUSED',
        lastErrorMessage: 'Mailbox provider unreachable',
        payloadSnapshot: {
          orderNumber: 'ORD-FAIL-001',
          grandTotalInCents: 1500000,
        },
      });

      // Admin queries delivery health logs
      const healthRes = await request(app)
        .get('/api/v1/admin/notifications/delivery-health?status=FAILED')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(healthRes.body.success).toBe(true);
      expect(healthRes.body.data.some((d: any) => d.deliveryId === delivery._id.toString())).toBe(true);

      // Customer cannot retry delivery -> 403 Forbidden
      await request(app)
        .post(`/api/v1/admin/notifications/${delivery._id}/retry`)
        .set('Authorization', `Bearer ${tokenCustomerA}`)
        .expect(403);

      // Admin executes retry -> 200 OK
      const retryRes = await request(app)
        .post(`/api/v1/admin/notifications/${delivery._id}/retry`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(retryRes.body.success).toBe(true);
      expect(retryRes.body.data.status).toBe('QUEUED');
      expect(retryRes.body.data.attemptCount).toBe(3);
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Consolidated Reports & Dashboard Invariant QA
  // ---------------------------------------------------------------------------
  describe('5. Consolidated Reports & Dashboard Invariant QA', () => {
    it('QA-REP-01: Executive dashboard strictly preserves Master Orders vs Suborders separation and currency units', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard/summary?refresh=true')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const overview = res.body.data.overview;

      // Invariant: Both keys must be separate numbers
      expect(typeof overview.totalMasterOrders).toBe('number');
      expect(typeof overview.totalMerchantSuborders).toBe('number');
      expect(typeof overview.grossMerchandiseValueInCents).toBe('number');
      expect(typeof overview.logisticsRevenueInCents).toBe('number');
      expect(typeof overview.accruedCommissionInCents).toBe('number');
      expect(typeof overview.platformSubsidyLiabilityInCents).toBe('number');

      // Health status of MOD-05 must be ONLINE
      expect(res.body.data.systemFreshness.moduleHealth.MOD_05).toBe('ONLINE');
    });

    it('QA-REP-02: Report CSV export enforces PII masking and triggers REPORT_EXPORTED audit event', async () => {
      // Seed audit record with PII phone and email
      await AuditEvent.create({
        action: 'BUYER_PHONE_VERIFIED',
        sourceModule: 'MOD-01',
        severity: 'LOW',
        actor: { actorId: adminId, actorRole: 'ADMIN', email: 'officer@autodock.lk' },
        targetEntity: { entityType: 'CUSTOMER_PHONE', entityId: 'PH_01' },
        reason: 'Verification completed for contact +94 77 987 6543 and user testbuyer@gmail.com',
        timestamp: new Date(),
      });

      const res = await request(app)
        .get('/api/v1/admin/reports/audit-activity?format=csv')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .expect(200);

      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('+94 77 **** 6543');
      expect(res.text).not.toContain('+94 77 987 6543');
      expect(res.text).toContain('t***@gmail.com');
      expect(res.text).not.toContain('testbuyer@gmail.com');

      // Verify self-auditing of report export
      const exportAudit = await AuditEvent.findOne({ action: 'REPORT_EXPORTED' });
      expect(exportAudit).toBeDefined();
      expect(exportAudit?.severity).toBe('HIGH');
      expect(exportAudit?.actor.actorId).toBe(adminId);
    });
  });
});
