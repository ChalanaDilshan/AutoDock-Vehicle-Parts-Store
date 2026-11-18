import crypto from 'crypto';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { Order } from '../../../src/modules/orders-delivery/models/order.model.js';
import { Suborder } from '../../../src/modules/orders-delivery/models/suborder.model.js';
import { PaymentWebhookEvent } from '../../../src/modules/orders-delivery/models/paymentWebhookEvent.model.js';

describe('MOD-03 Card Payment Sandbox Boundary & Webhook Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_card_sandbox';

  let customerToken: string;
  let customerId: string;
  let sellerProfileId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    const customer = await User.create({
      email: 'card.buyer@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Card',
      lastName: 'Buyer',
      phone: '+94775551122',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerId = customer._id.toString();
    customerToken = jwt.sign(
      { userId: customerId, email: customer.email, role: customer.role },
      env.JWT_ACCESS_SECRET
    );

    const sellerUser = await User.create({
      email: 'card.seller@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Card',
      lastName: 'Seller',
      phone: '+94775553344',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const sProfile = await SellerProfile.create({
      userId: sellerUser._id,
      businessName: 'Speedy Auto Parts',
      storeSlug: 'speedy-auto-parts',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-CARD-01',
      operatingAddress: {
        street: '10 High St',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '00100',
      },
      contactPhone: '+94775553344',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    sellerProfileId = sProfile._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await SellerProfile.deleteMany({});
    await Order.deleteMany({});
    await Suborder.deleteMany({});
    await PaymentWebhookEvent.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Order.deleteMany({});
    await Suborder.deleteMany({});
    await PaymentWebhookEvent.deleteMany({});
  });

  it('TC-CARD-01: Generates a sandbox card session token and hosted simulation URL', async () => {
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0020',
      customerId: new mongoose.Types.ObjectId(customerId),
      customerEmail: 'card.buyer@autodock.lk',
      shippingAddress: {
        fullName: 'Card Buyer',
        phone: '+94775551122',
        street: 'Street 1',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00100',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 500000,
      totalDeliveryFeeInCents: 45000,
      finalPayableAmountInCents: 545000,
      currency: 'LKR',
      overallStatus: 'PENDING_PAYMENT',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0020-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(sellerProfileId),
      sellerBusinessName: 'Speedy Auto Parts',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          title: 'Headlight Bulb',
          sku: 'HL-01',
          unitPriceInCents: 500000,
          quantity: 1,
          totalPriceInCents: 500000,
        },
      ],
      subtotalInCents: 500000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 545000,
      commissionableBaseInCents: 500000,
      currency: 'LKR',
      paymentMethod: 'CARD_SANDBOX',
      paymentStatus: 'PENDING_PAYMENT',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Colombo',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    const res = await request(app)
      .post('/api/v1/payments/card/initiate')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ suborderId: suborder._id.toString() });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionToken).toBeDefined();
    expect(res.body.data.sandboxGatewayUrl).toContain('sandbox-payment');
    expect(res.body.data.amountInCents).toBe(545000);
  });

  it('TC-CARD-02: Webhook with valid HMAC signature updates suborder to PAID and PROCESSING', async () => {
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0021',
      customerId: new mongoose.Types.ObjectId(customerId),
      customerEmail: 'card.buyer@autodock.lk',
      shippingAddress: {
        fullName: 'Card Buyer',
        phone: '+94775551122',
        street: 'Street 1',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00100',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 500000,
      totalDeliveryFeeInCents: 45000,
      finalPayableAmountInCents: 545000,
      currency: 'LKR',
      overallStatus: 'PENDING_PAYMENT',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0021-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(sellerProfileId),
      sellerBusinessName: 'Speedy Auto Parts',
      items: [
        {
          productId: new mongoose.Types.ObjectId(),
          title: 'Headlight Bulb',
          sku: 'HL-01',
          unitPriceInCents: 500000,
          quantity: 1,
          totalPriceInCents: 500000,
        },
      ],
      subtotalInCents: 500000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 545000,
      commissionableBaseInCents: 500000,
      currency: 'LKR',
      paymentMethod: 'CARD_SANDBOX',
      paymentStatus: 'PENDING_PAYMENT',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Colombo',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    const webhookPayload = {
      eventId: 'evt_sandbox_test_1001',
      suborderId: suborder._id.toString(),
      eventType: 'PAYMENT_SUCCESS',
      amountInCents: 545000,
      currency: 'LKR',
      timestamp: new Date().toISOString(),
    };

    const secret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || env.JWT_ACCESS_SECRET;
    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const res = await request(app)
      .post('/api/v1/payments/webhooks/card')
      .set('X-Gateway-Signature', signature)
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PROCESSED');

    const updatedSuborder = await Suborder.findById(suborder._id);
    expect(updatedSuborder!.paymentStatus).toBe('PAID');
    expect(updatedSuborder!.fulfillmentStatus).toBe('PROCESSING');
    expect(updatedSuborder!.paidAt).toBeDefined();

    // Verify idempotency record created
    const eventRecord = await PaymentWebhookEvent.findOne({ eventId: 'evt_sandbox_test_1001' });
    expect(eventRecord).not.toBeNull();
  });

  it('TC-CARD-03: Webhook with forged signature is rejected with 401 Unauthorized', async () => {
    const webhookPayload = {
      eventId: 'evt_forged_1002',
      suborderId: new mongoose.Types.ObjectId().toString(),
      eventType: 'PAYMENT_SUCCESS',
      amountInCents: 100000,
      currency: 'LKR',
      timestamp: new Date().toISOString(),
    };

    const res = await request(app)
      .post('/api/v1/payments/webhooks/card')
      .set('X-Gateway-Signature', 'badbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbadbad')
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    expect(res.status).toBe(401);
    expect(res.body.code).toBe('INVALID_SIGNATURE');
  });

  it('TC-CARD-04: Replay Protection: Duplicate webhook event ID is ignored idempotently', async () => {
    const eventId = 'evt_duplicate_test_1003';
    // Pre-record the event
    await PaymentWebhookEvent.create({
      eventId,
      provider: 'CARD_SANDBOX_GATEWAY',
      eventType: 'PAYMENT_SUCCESS',
      payloadHash: 'hash123',
    });

    const webhookPayload = {
      eventId,
      suborderId: new mongoose.Types.ObjectId().toString(),
      eventType: 'PAYMENT_SUCCESS',
      amountInCents: 100000,
      currency: 'LKR',
      timestamp: new Date().toISOString(),
    };

    const secret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || env.JWT_ACCESS_SECRET;
    const rawBody = JSON.stringify(webhookPayload);
    const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const res = await request(app)
      .post('/api/v1/payments/webhooks/card')
      .set('X-Gateway-Signature', signature)
      .set('Content-Type', 'application/json')
      .send(webhookPayload);

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('ALREADY_PROCESSED');
  });
});
