import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { Notification } from '../../../src/modules/admin-platform/models/notification.model.js';
import { NotificationDelivery } from '../../../src/modules/admin-platform/models/notificationDelivery.model.js';

describe('MOD-05 In-App Notifications & Admin Delivery API Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_mod05_notifications';

  const userAId = new mongoose.Types.ObjectId().toString();
  const userBId = new mongoose.Types.ObjectId().toString();
  const adminId = new mongoose.Types.ObjectId().toString();

  const tokenUserA = jwt.sign(
    { userId: userAId, email: 'usera@example.com', role: 'CUSTOMER' },
    env.JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  const tokenUserB = jwt.sign(
    { userId: userBId, email: 'userb@example.com', role: 'CUSTOMER' },
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
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Notification.deleteMany({});
    await NotificationDelivery.deleteMany({});
  });

  it('TC-NOTIF-01: User retrieves strictly their own in-app notifications (BOLA Isolation)', async () => {
    // Seed notification for User A
    await Notification.create({
      recipientId: new mongoose.Types.ObjectId(userAId),
      recipientRole: 'CUSTOMER',
      title: 'Order Dispatched',
      message: 'Your suborder has been dispatched.',
      category: 'ORDER',
      isRead: false,
    });

    // Seed notification for User B
    await Notification.create({
      recipientId: new mongoose.Types.ObjectId(userBId),
      recipientRole: 'CUSTOMER',
      title: 'Private Alert for User B',
      message: 'Secret message for User B',
      category: 'SECURITY',
      isRead: false,
    });

    // User A requests their notifications
    const resA = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(resA.body.success).toBe(true);
    expect(resA.body.data).toHaveLength(1);
    expect(resA.body.data[0].title).toBe('Order Dispatched');
    expect(resA.body.meta.unreadCount).toBe(1);

    // User B requests their notifications
    const resB = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${tokenUserB}`)
      .expect(200);

    expect(resB.body.success).toBe(true);
    expect(resB.body.data).toHaveLength(1);
    expect(resB.body.data[0].title).toBe('Private Alert for User B');
  });

  it('TC-NOTIF-02: Returns unread badge count accurately', async () => {
    await Notification.create([
      {
        recipientId: new mongoose.Types.ObjectId(userAId),
        recipientRole: 'CUSTOMER',
        title: 'Alert 1',
        message: 'Message 1',
        category: 'ORDER',
        isRead: false,
      },
      {
        recipientId: new mongoose.Types.ObjectId(userAId),
        recipientRole: 'CUSTOMER',
        title: 'Alert 2',
        message: 'Message 2',
        category: 'PAYMENT',
        isRead: false,
      },
      {
        recipientId: new mongoose.Types.ObjectId(userAId),
        recipientRole: 'CUSTOMER',
        title: 'Alert 3',
        message: 'Message 3',
        category: 'SYSTEM',
        isRead: true,
      },
    ]);

    const res = await request(app)
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBe(2);
  });

  it('TC-NOTIF-03: User marks a notification as read; User B cannot mark User A notification (BOLA Check)', async () => {
    const notif = await Notification.create({
      recipientId: new mongoose.Types.ObjectId(userAId),
      recipientRole: 'CUSTOMER',
      title: 'To Read',
      message: 'Unread message',
      category: 'ORDER',
      isRead: false,
    });

    // User B attempts to mark User A's notification as read -> 403 Forbidden
    await request(app)
      .patch(`/api/v1/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${tokenUserB}`)
      .expect(403);

    // User A marks own notification as read -> 200 OK
    const res = await request(app)
      .patch(`/api/v1/notifications/${notif._id}/read`)
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.isRead).toBe(true);
    expect(res.body.data.readAt).toBeDefined();

    // Verify in database
    const updated = await Notification.findById(notif._id);
    expect(updated?.isRead).toBe(true);
  });

  it('TC-NOTIF-04: User marks all notifications as read', async () => {
    await Notification.create([
      {
        recipientId: new mongoose.Types.ObjectId(userAId),
        recipientRole: 'CUSTOMER',
        title: 'Alert 1',
        message: 'Message 1',
        category: 'ORDER',
        isRead: false,
      },
      {
        recipientId: new mongoose.Types.ObjectId(userAId),
        recipientRole: 'CUSTOMER',
        title: 'Alert 2',
        message: 'Message 2',
        category: 'ORDER',
        isRead: false,
      },
    ]);

    const res = await request(app)
      .patch('/api/v1/notifications/mark-all-read')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.updatedCount).toBe(2);

    const remainingUnread = await Notification.countDocuments({
      recipientId: new mongoose.Types.ObjectId(userAId),
      isRead: false,
    });
    expect(remainingUnread).toBe(0);
  });

  it('TC-NOTIF-05: Admin retrieves operations alerts inbox', async () => {
    await Notification.create({
      recipientId: new mongoose.Types.ObjectId(adminId),
      recipientRole: 'ADMIN',
      title: 'New KYC Dossier',
      message: 'Merchant submitted KYC',
      category: 'VERIFICATION',
      priority: 'HIGH',
      isRead: false,
    });

    // Customer cannot access admin operations
    await request(app)
      .get('/api/v1/admin/notifications/operations')
      .set('Authorization', `Bearer ${tokenUserA}`)
      .expect(403);

    // Admin accesses operations
    const res = await request(app)
      .get('/api/v1/admin/notifications/operations')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].category).toBe('VERIFICATION');
  });

  it('TC-NOTIF-06: Admin views delivery health logs and safely retries failed delivery', async () => {
    const failedDelivery = await NotificationDelivery.create({
      idempotencyKey: 'TEST:FAILED:001',
      sourceModule: 'MOD-04',
      sourceEventId: 'EVT-001',
      sourceEventName: 'COMMISSION_INVOICE_ISSUED',
      channel: 'EMAIL',
      templateId: 'SELLER_MONTHLY_INVOICE_ISSUED',
      templateVersion: '1.0',
      recipientId: new mongoose.Types.ObjectId(userAId),
      recipientAddress: 'seller@example.com',
      status: 'FAILED',
      attemptCount: 3,
      maxAttempts: 3,
      lastErrorMessage: 'SMTP Timeout',
    });

    // Admin views delivery health
    const healthRes = await request(app)
      .get('/api/v1/admin/notifications/delivery-health?status=FAILED')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(healthRes.body.success).toBe(true);
    expect(healthRes.body.data).toHaveLength(1);
    expect(healthRes.body.data[0].status).toBe('FAILED');

    // Admin triggers manual retry
    const retryRes = await request(app)
      .post(`/api/v1/admin/notifications/${failedDelivery._id}/retry`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .expect(200);

    expect(retryRes.body.success).toBe(true);
    expect(retryRes.body.data.status).toBe('QUEUED');

    const updated = await NotificationDelivery.findById(failedDelivery._id);
    expect(['QUEUED', 'PROCESSING', 'SENT']).toContain(updated?.status);
  });
});
