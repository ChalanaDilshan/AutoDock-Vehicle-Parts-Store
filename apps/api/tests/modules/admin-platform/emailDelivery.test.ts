import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import {
  EmailDeliveryService,
  MockEmailTransport,
} from '../../../src/modules/admin-platform/services/emailDelivery.service.js';
import {
  templateRegistry,
  escapeHtml,
  formatLkrCents,
} from '../../../src/modules/admin-platform/templates/templateRegistry.js';
import { NotificationDelivery } from '../../../src/modules/admin-platform/models/notificationDelivery.model.js';

describe('MOD-05 Email Delivery Service & Template Registry Tests', () => {
  const testDbUri = 'mongodb://localhost:27017/autodock_test_mod05_email';
  let mockTransport: MockEmailTransport;
  let emailService: EmailDeliveryService;

  beforeEach(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);
    await NotificationDelivery.deleteMany({});

    mockTransport = new MockEmailTransport();
    emailService = new EmailDeliveryService(mockTransport);
  });

  afterEach(async () => {
    await NotificationDelivery.deleteMany({});
    await mongoose.disconnect();
  });

  it('TC-EMAIL-01: HTML escaping prevents injection attacks in template rendering', () => {
    const maliciousInput = '<script>alert("XSS")</script>&"\'';
    const escaped = escapeHtml(maliciousInput);

    expect(escaped).not.toContain('<script>');
    expect(escaped).toContain('&lt;script&gt;');
    expect(escaped).toContain('&amp;');
    expect(escaped).toContain('&quot;');
    expect(escaped).toContain('&#39;');
  });

  it('TC-EMAIL-02: Formats LKR cents correctly to standard currency string', () => {
    expect(formatLkrCents(100000)).toBe('LKR 1,000.00');
    expect(formatLkrCents(1450050)).toBe('LKR 14,500.50');
    expect(formatLkrCents(0)).toBe('LKR 0.00');
  });

  it('TC-EMAIL-03: Render invoice template accurately without leaking private bank credentials', () => {
    const { version, rendered } = templateRegistry.render('SELLER_MONTHLY_INVOICE_ISSUED', {
      invoiceNumber: 'INV-202611-0001',
      billingPeriod: '2026-11',
      grossCommissionInCents: 1250000,
      dueDate: '2026-12-05T00:00:00.000Z',
    });

    expect(version).toBe('1.0');
    expect(rendered.subject).toContain('INV-202611-0001');
    expect(rendered.htmlBody).toContain('INV-202611-0001');
    expect(rendered.htmlBody).toContain('LKR 12,500.00');
    // Ensure no raw secrets exist
    expect(rendered.htmlBody).not.toContain('password');
    expect(rendered.htmlBody).not.toContain('accountNumber');
  });

  it('TC-EMAIL-04: Mock transport records accepted email and updates delivery record to SENT', async () => {
    const delivery = await NotificationDelivery.create({
      idempotencyKey: 'TEST:EMAIL:001',
      sourceModule: 'MOD-03',
      sourceEventId: 'ORD-001',
      sourceEventName: 'MASTER_ORDER_PLACED',
      channel: 'EMAIL',
      templateId: 'CUSTOMER_ORDER_CONFIRMATION',
      templateVersion: '1.0',
      recipientId: new mongoose.Types.ObjectId(),
      recipientAddress: 'customer@example.com',
      status: 'QUEUED',
      attemptCount: 0,
      maxAttempts: 3,
    });

    const success = await emailService.dispatchDeliveryRecord(delivery, {
      to: 'customer@example.com',
      subject: 'Order Confirmed',
      html: '<p>Order Confirmed</p>',
      text: 'Order Confirmed',
    });

    expect(success).toBe(true);

    const updated = await NotificationDelivery.findById(delivery._id);
    expect(updated?.status).toBe('SENT');
    expect(updated?.attemptCount).toBe(1);
    expect(updated?.providerMessageId).toBeDefined();

    const sent = mockTransport.getSentEmails();
    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('customer@example.com');
  });

  it('TC-EMAIL-05: Calculates exponential backoff retry accurately', () => {
    const now = Date.now();
    const next1 = emailService.calculateNextAttempt(1);
    const next2 = emailService.calculateNextAttempt(2);

    // attempt 1 -> 2^1 * 60s = 120s
    expect(next1.getTime()).toBeGreaterThanOrEqual(now + 115 * 1000);
    // attempt 2 -> 2^2 * 60s = 240s
    expect(next2.getTime()).toBeGreaterThanOrEqual(now + 235 * 1000);
  });

  it('TC-EMAIL-06: Failing transport transitions to RETRYING then FAILED after max attempts', async () => {
    // Failing mock transport
    const failingTransport = {
      sendMail: async () => {
        throw new Error('ECONNREFUSED mail server down');
      },
    };
    emailService.setTransport(failingTransport);

    const delivery = await NotificationDelivery.create({
      idempotencyKey: 'TEST:EMAIL:FAIL',
      sourceModule: 'MOD-04',
      sourceEventId: 'INV-001',
      sourceEventName: 'COMMISSION_INVOICE_ISSUED',
      channel: 'EMAIL',
      templateId: 'SELLER_MONTHLY_INVOICE_ISSUED',
      templateVersion: '1.0',
      recipientId: new mongoose.Types.ObjectId(),
      recipientAddress: 'seller@example.com',
      status: 'QUEUED',
      attemptCount: 2, // 2nd attempt, next will be 3 (maxAttempts)
      maxAttempts: 3,
    });

    const success = await emailService.dispatchDeliveryRecord(delivery, {
      to: 'seller@example.com',
      subject: 'Invoice',
      html: '<p>Invoice</p>',
      text: 'Invoice',
    });

    expect(success).toBe(false);

    const updated = await NotificationDelivery.findById(delivery._id);
    expect(updated?.attemptCount).toBe(3);
    expect(updated?.status).toBe('FAILED');
    expect(updated?.lastErrorMessage).toContain('ECONNREFUSED');
  });
});
