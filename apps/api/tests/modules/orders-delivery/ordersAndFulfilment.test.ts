import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { Product } from '../../../src/modules/customer-experience/models/product.model.js';
import { Category } from '../../../src/modules/customer-experience/models/category.model.js';
import { Brand } from '../../../src/modules/customer-experience/models/brand.model.js';
import { Order } from '../../../src/modules/orders-delivery/models/order.model.js';
import { Suborder } from '../../../src/modules/orders-delivery/models/suborder.model.js';

describe('MOD-03 Orders & Seller Fulfillment Lifecycle Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_fulfilment';

  let customer1Token: string;
  let customer1Id: string;

  let customer2Token: string;
  let customer2Id: string;

  let seller1Token: string;
  let seller1ProfileId: string;

  let seller2Token: string;
  let seller2ProfileId: string;

  let productId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // 1. Create Customers
    const c1 = await User.create({
      email: 'buyer1.flow@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Buyer',
      lastName: 'One',
      phone: '+94771000001',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customer1Id = c1._id.toString();
    customer1Token = jwt.sign(
      { userId: customer1Id, email: c1.email, role: c1.role },
      env.JWT_ACCESS_SECRET
    );

    const c2 = await User.create({
      email: 'buyer2.flow@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Buyer',
      lastName: 'Two',
      phone: '+94771000002',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customer2Id = c2._id.toString();
    customer2Token = jwt.sign(
      { userId: customer2Id, email: c2.email, role: c2.role },
      env.JWT_ACCESS_SECRET
    );

    // 2. Create Sellers
    const sUser1 = await User.create({
      email: 'seller1.fulfil@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Store',
      lastName: 'One',
      phone: '+94772000001',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const sProfile1 = await SellerProfile.create({
      userId: sUser1._id,
      businessName: 'Apex Performance Spares',
      storeSlug: 'apex-spares',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-001',
      operatingAddress: {
        street: '12 Main St',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '00100',
      },
      contactPhone: '+94772000001',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    seller1ProfileId = sProfile1._id.toString();
    seller1Token = jwt.sign(
      { userId: sUser1._id.toString(), email: sUser1.email, role: sUser1.role, sellerId: seller1ProfileId },
      env.JWT_ACCESS_SECRET
    );

    const sUser2 = await User.create({
      email: 'seller2.fulfil@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Store',
      lastName: 'Two',
      phone: '+94772000002',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const sProfile2 = await SellerProfile.create({
      userId: sUser2._id,
      businessName: 'Lanka Turbo Works',
      storeSlug: 'lanka-turbo',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-002',
      operatingAddress: {
        street: '50 Kandy Rd',
        city: 'Kandy',
        district: 'Kandy',
        province: 'Central',
        postalCode: '20000',
      },
      contactPhone: '+94772000002',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    seller2ProfileId = sProfile2._id.toString();
    seller2Token = jwt.sign(
      { userId: sUser2._id.toString(), email: sUser2.email, role: sUser2.role, sellerId: seller2ProfileId },
      env.JWT_ACCESS_SECRET
    );

    // 3. Create Product
    const cat = await Category.create({ name: 'Turbo', slug: 'turbo' });
    const br = await Brand.create({ name: 'Garrett', slug: 'garrett' });
    const prod = await Product.create({
      sellerId: sProfile1._id,
      title: 'Garrett GT2860R Turbocharger',
      sku: 'GAR-GT28-01',
      partNumber: 'GT2860R',
      categoryId: cat._id,
      brandId: br._id,
      condition: 'BRAND_NEW',
      description: 'Dual ball bearing turbo.',
      priceInCents: 15000000,
      stock: 5,
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/turbo.jpg', isPrimary: true }],
    });
    productId = prod._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await SellerProfile.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Suborder.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Order.deleteMany({});
    await Suborder.deleteMany({});
  });

  it('TC-FUL-01: BOLA Protection: Customer A cannot view Customer B order', async () => {
    const order = await Order.create({
      orderNumber: 'ORD-20261118-0001',
      customerId: new mongoose.Types.ObjectId(customer1Id),
      customerEmail: 'buyer1.flow@autodock.lk',
      shippingAddress: {
        fullName: 'Buyer One',
        phone: '+94771000001',
        street: 'Street 1',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00100',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 15000000,
      totalDeliveryFeeInCents: 50000,
      finalPayableAmountInCents: 15050000,
      currency: 'LKR',
      overallStatus: 'PENDING_PAYMENT',
    });

    // Customer 2 attempts to view Customer 1's order
    const res = await request(app)
      .get(`/api/v1/orders/${order._id}`)
      .set('Authorization', `Bearer ${customer2Token}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('TC-FUL-02: BOLA Protection: Seller 2 cannot access or transition Seller 1 suborder', async () => {
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0002',
      customerId: new mongoose.Types.ObjectId(customer1Id),
      customerEmail: 'buyer1.flow@autodock.lk',
      shippingAddress: {
        fullName: 'Buyer One',
        phone: '+94771000001',
        street: 'Street 1',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00100',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 15000000,
      totalDeliveryFeeInCents: 50000,
      finalPayableAmountInCents: 15050000,
      currency: 'LKR',
      overallStatus: 'IN_PROGRESS',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0002-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customer1Id),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
      sellerBusinessName: 'Apex Performance Spares',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Garrett GT2860R',
          sku: 'GAR-GT28-01',
          unitPriceInCents: 15000000,
          quantity: 1,
          totalPriceInCents: 15000000,
        },
      ],
      subtotalInCents: 15000000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 50000,
      totalPayableInCents: 15050000,
      commissionableBaseInCents: 15000000,
      currency: 'LKR',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING_COLLECTION',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'rate-01',
        district: 'Colombo',
        feeInCents: 50000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    // Seller 2 attempts to fetch Seller 1's suborder
    const resGet = await request(app)
      .get(`/api/v1/seller/suborders/${suborder._id}`)
      .set('Authorization', `Bearer ${seller2Token}`);

    expect(resGet.status).toBe(403);

    // Seller 2 attempts to update Seller 1's suborder status
    const resPatch = await request(app)
      .patch(`/api/v1/seller/suborders/${suborder._id}/status`)
      .set('Authorization', `Bearer ${seller2Token}`)
      .send({ status: 'PROCESSING' });

    expect(resPatch.status).toBe(403);
  });

  it('TC-FUL-03: Full Fulfillment Flow with Courier Tracking & COD Collection', async () => {
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0003',
      customerId: new mongoose.Types.ObjectId(customer1Id),
      customerEmail: 'buyer1.flow@autodock.lk',
      shippingAddress: {
        fullName: 'Buyer One',
        phone: '+94771000001',
        street: 'Street 1',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00100',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 15000000,
      totalDeliveryFeeInCents: 50000,
      finalPayableAmountInCents: 15050000,
      currency: 'LKR',
      overallStatus: 'IN_PROGRESS',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0003-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customer1Id),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
      sellerBusinessName: 'Apex Performance Spares',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Garrett GT2860R',
          sku: 'GAR-GT28-01',
          unitPriceInCents: 15000000,
          quantity: 1,
          totalPriceInCents: 15000000,
        },
      ],
      subtotalInCents: 15000000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 50000,
      totalPayableInCents: 15050000,
      commissionableBaseInCents: 15000000,
      currency: 'LKR',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING_COLLECTION',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'rate-01',
        district: 'Colombo',
        feeInCents: 50000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });
    masterOrder.suborderIds.push(suborder._id);
    await masterOrder.save();

    // 1. Move to PROCESSING
    const res1 = await request(app)
      .patch(`/api/v1/seller/suborders/${suborder._id}/status`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ status: 'PROCESSING', sellerNotes: 'Preparing item in warehouse' });

    expect(res1.status).toBe(200);
    expect(res1.body.data.fulfillmentStatus).toBe('PROCESSING');

    // 2. Move to READY_FOR_DISPATCH
    const res2 = await request(app)
      .patch(`/api/v1/seller/suborders/${suborder._id}/status`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ status: 'READY_FOR_DISPATCH' });

    expect(res2.status).toBe(200);
    expect(res2.body.data.fulfillmentStatus).toBe('READY_FOR_DISPATCH');

    // 3. Move to DISPATCHED without courierDetails -> Should fail with 400
    const resFail = await request(app)
      .patch(`/api/v1/seller/suborders/${suborder._id}/status`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ status: 'DISPATCHED' });

    expect(resFail.status).toBe(400);

    // 4. Move to DISPATCHED with courier details
    const res3 = await request(app)
      .patch(`/api/v1/seller/suborders/${suborder._id}/status`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({
        status: 'DISPATCHED',
        courierDetails: {
          courierName: 'Domex Express',
          trackingNumber: 'DMX-987654',
          trackingUrl: 'https://domex.lk/track/DMX-987654',
        },
      });

    expect(res3.status).toBe(200);
    expect(res3.body.data.fulfillmentStatus).toBe('DISPATCHED');
    expect(res3.body.data.courierDetails.courierName).toBe('Domex Express');

    // 5. Move to DELIVERED -> In COD, automatically transitions paymentStatus to COLLECTED!
    const res4 = await request(app)
      .patch(`/api/v1/seller/suborders/${suborder._id}/status`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ status: 'DELIVERED' });

    expect(res4.status).toBe(200);
    expect(res4.body.data.fulfillmentStatus).toBe('DELIVERED');
    expect(res4.body.data.paymentStatus).toBe('COLLECTED');

    // 6. Verify Master Order rollup is COMPLETED
    const updatedMaster = await Order.findById(masterOrder._id);
    expect(updatedMaster!.overallStatus).toBe('COMPLETED');
  });

  it('TC-FUL-04: Customer cancels unpaid suborder and restores reserved stock', async () => {
    // Current stock is 5
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0004',
      customerId: new mongoose.Types.ObjectId(customer1Id),
      customerEmail: 'buyer1.flow@autodock.lk',
      shippingAddress: {
        fullName: 'Buyer One',
        phone: '+94771000001',
        street: 'Street 1',
        city: 'Colombo',
        district: 'Colombo',
        postalCode: '00100',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 15000000,
      totalDeliveryFeeInCents: 50000,
      finalPayableAmountInCents: 15050000,
      currency: 'LKR',
      overallStatus: 'PENDING_PAYMENT',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0004-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customer1Id),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
      sellerBusinessName: 'Apex Performance Spares',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Garrett GT2860R',
          sku: 'GAR-GT28-01',
          unitPriceInCents: 15000000,
          quantity: 2,
          totalPriceInCents: 30000000,
        },
      ],
      subtotalInCents: 30000000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 50000,
      totalPayableInCents: 30050000,
      commissionableBaseInCents: 30000000,
      currency: 'LKR',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PENDING_PAYMENT',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'rate-01',
        district: 'Colombo',
        feeInCents: 50000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    const res = await request(app)
      .post(`/api/v1/orders/suborders/${suborder._id}/cancel`)
      .set('Authorization', `Bearer ${customer1Token}`)
      .send({ reason: 'Found alternative locally' });

    expect(res.status).toBe(200);
    expect(res.body.data.fulfillmentStatus).toBe('CANCELLED');

    // Stock was 5, 2 units released back -> should be 7
    const product = await Product.findById(productId);
    expect(product!.stock).toBe(7);

    // Master order rollup should be CANCELLED
    const updatedMaster = await Order.findById(masterOrder._id);
    expect(updatedMaster!.overallStatus).toBe('CANCELLED');
  });
});
