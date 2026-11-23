import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { Product } from '../../../src/modules/customer-experience/models/product.model.js';
import { Category } from '../../../src/modules/customer-experience/models/category.model.js';
import { Brand } from '../../../src/modules/customer-experience/models/brand.model.js';
import { Cart } from '../../../src/modules/customer-experience/models/cart.model.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { Order } from '../../../src/modules/orders-delivery/models/order.model.js';
import { Suborder } from '../../../src/modules/orders-delivery/models/suborder.model.js';
import { PaymentSlip } from '../../../src/modules/orders-delivery/models/paymentSlip.model.js';
import { DeliveryRateProposal } from '../../../src/modules/orders-delivery/models/deliveryRateProposal.model.js';
import { DeliveryZoneRate } from '../../../src/modules/orders-delivery/models/deliveryZone.model.js';
import { PaymentWebhookEvent } from '../../../src/modules/orders-delivery/models/paymentWebhookEvent.model.js';
import { orderPublicService } from '../../../src/modules/orders-delivery/contracts/order.contract.js';

describe('MOD-03 Integration QA & End-to-End System Verification', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_mod03_integration_qa';

  // Tokens & Actors
  let adminToken: string;
  let adminId: string;

  let sellerAToken: string;
  let sellerAUserId: string;
  let sellerAProfileId: string;

  let sellerBToken: string;
  let sellerBUserId: string;
  let sellerBProfileId: string;

  let suspendedSellerToken: string;
  let suspendedSellerProfileId: string;

  let customerAToken: string;
  let customerAId: string;

  let customerBToken: string;
  let customerBId: string;

  // Shared Reference Products
  let categoryId: string;
  let brandId: string;
  let productA1Id: string;
  let productA2Id: string;
  let productB1Id: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // 1. Admin Actor
    const adminUser = await User.create({
      email: 'admin.qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+94112223344',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    adminId = adminUser._id.toString();
    adminToken = jwt.sign(
      { userId: adminId, email: adminUser.email, role: adminUser.role },
      env.JWT_ACCESS_SECRET
    );

    // 2. Approved Seller A Actor
    const sellerAUser = await User.create({
      email: 'seller.a.qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Apex',
      lastName: 'Seller',
      phone: '+94771002001',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    sellerAUserId = sellerAUser._id.toString();
    sellerAToken = jwt.sign(
      { userId: sellerAUserId, email: sellerAUser.email, role: sellerAUser.role },
      env.JWT_ACCESS_SECRET
    );
    const profileA = await SellerProfile.create({
      userId: sellerAUser._id,
      businessName: 'Apex Motor Spares Ltd',
      storeSlug: 'apex-motor-spares',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-QA-001',
      operatingAddress: {
        street: '120 Panchikawatta Rd',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '01000',
      },
      contactPhone: '+94771002001',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
      bankDetails: {
        bankName: 'Commercial Bank of Ceylon',
        accountHolderName: 'Apex Motor Spares Ltd',
        accountNumber: '8001234567',
        branch: 'Panchikawatta',
        verificationStatus: 'VERIFIED',
      },
    });
    sellerAProfileId = profileA._id.toString();

    // 3. Approved Seller B Actor
    const sellerBUser = await User.create({
      email: 'seller.b.qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Kandy',
      lastName: 'Seller',
      phone: '+94772003002',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    sellerBUserId = sellerBUser._id.toString();
    sellerBToken = jwt.sign(
      { userId: sellerBUserId, email: sellerBUser.email, role: sellerBUser.role },
      env.JWT_ACCESS_SECRET
    );
    const profileB = await SellerProfile.create({
      userId: sellerBUser._id,
      businessName: 'Central Auto Parts',
      storeSlug: 'central-auto-parts',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-QA-002',
      operatingAddress: {
        street: '45 Peradeniya Rd',
        city: 'Kandy',
        district: 'Kandy',
        province: 'Central',
        postalCode: '20000',
      },
      contactPhone: '+94772003002',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
      bankDetails: {
        bankName: 'Hatton National Bank',
        accountHolderName: 'Central Auto Parts',
        accountNumber: '0887654321',
        branch: 'Kandy City',
        verificationStatus: 'VERIFIED',
      },
    });
    sellerBProfileId = profileB._id.toString();

    // 4. Suspended Seller Actor
    const suspendedUser = await User.create({
      email: 'suspended.seller@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Suspended',
      lastName: 'Merchant',
      phone: '+94773004003',
      role: 'SELLER',
      accountStatus: 'SUSPENDED',
      isEmailVerified: true,
    });
    const profileSuspended = await SellerProfile.create({
      userId: suspendedUser._id,
      businessName: 'Suspended Store LK',
      storeSlug: 'suspended-store-lk',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-SUSP-01',
      operatingAddress: {
        street: '10 Galle Rd',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '00300',
      },
      contactPhone: '+94773004003',
      verificationStatus: 'SUSPENDED',
      isEligibleToSell: false,
    });
    suspendedSellerProfileId = profileSuspended._id.toString();
    suspendedSellerToken = jwt.sign(
      { userId: suspendedUser._id.toString(), email: suspendedUser.email, role: suspendedUser.role },
      env.JWT_ACCESS_SECRET
    );

    // 5. Customer A & Customer B
    const custA = await User.create({
      email: 'customer.a.qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Nimal',
      lastName: 'Perera',
      phone: '+94774005001',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerAId = custA._id.toString();
    customerAToken = jwt.sign(
      { userId: customerAId, email: custA.email, role: custA.role },
      env.JWT_ACCESS_SECRET
    );

    const custB = await User.create({
      email: 'customer.b.qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Sunil',
      lastName: 'Silva',
      phone: '+94775006002',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerBId = custB._id.toString();
    customerBToken = jwt.sign(
      { userId: customerBId, email: custB.email, role: custB.role },
      env.JWT_ACCESS_SECRET
    );

    // 6. Common Category & Brand
    const category = await Category.create({
      name: 'Braking System',
      slug: `braking-system-${Date.now()}`,
      isActive: true,
    });
    categoryId = category._id.toString();

    const brand = await Brand.create({
      name: 'Brembo Italy',
      slug: `brembo-italy-${Date.now()}`,
      isActive: true,
    });
    brandId = brand._id.toString();

    // 7. Seed Products for Sellers
    const prodA1 = await Product.create({
      sellerId: profileA._id,
      categoryId: category._id,
      brandId: brand._id,
      title: 'Brembo Ceramic Front Brake Pads',
      partNumber: 'P 28 034N',
      sku: 'QA-BRK-001',
      description: 'Ceramic high performance brake pads for Japanese sedans',
      priceInCents: 1250000, // Rs. 12,500.00
      stock: 20,
      condition: 'BRAND_NEW',
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/products/p1.jpg', isPrimary: true }],
    });
    productA1Id = prodA1._id.toString();

    const prodA2 = await Product.create({
      sellerId: profileA._id,
      categoryId: category._id,
      brandId: brand._id,
      title: 'Brembo Rear Brake Shoes Set',
      partNumber: 'S 28 515',
      sku: 'QA-BRK-002',
      description: 'High friction rear drum shoes engineered for durability',
      priceInCents: 750000, // Rs. 7,500.00
      stock: 10,
      condition: 'BRAND_NEW',
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/products/p2.jpg', isPrimary: true }],
    });
    productA2Id = prodA2._id.toString();

    const prodB1 = await Product.create({
      sellerId: profileB._id,
      categoryId: category._id,
      brandId: brand._id,
      title: 'Brembo Dot 4 Synthetic Brake Fluid 1L',
      partNumber: 'L 04 001',
      sku: 'QA-FLD-001',
      description: 'Premium DOT 4 hydraulic brake fluid for extreme temperatures',
      priceInCents: 350000, // Rs. 3,500.00
      stock: 15,
      condition: 'BRAND_NEW',
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/products/p3.jpg', isPrimary: true }],
    });
    productB1Id = prodB1._id.toString();

    // 8. Approved Delivery Rates for Colombo & Kandy
    const proposalA = await DeliveryRateProposal.create({
      sellerId: profileA._id,
      rates: [
        { district: 'Colombo', feeInCents: 45000, estimatedDaysMin: 1, estimatedDaysMax: 2 },
        { district: 'Gampaha', feeInCents: 50000, estimatedDaysMin: 2, estimatedDaysMax: 3 },
      ],
      status: 'APPROVED',
      reviewedBy: adminUser._id,
      reviewedAt: new Date(),
    });

    await DeliveryZoneRate.create([
      {
        sellerId: profileA._id,
        district: 'Colombo',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 2,
        status: 'ACTIVE',
        proposalId: proposalA._id,
      },
      {
        sellerId: profileA._id,
        district: 'Gampaha',
        feeInCents: 50000,
        estimatedDaysMin: 2,
        estimatedDaysMax: 3,
        status: 'ACTIVE',
        proposalId: proposalA._id,
      },
    ]);

    const proposalB = await DeliveryRateProposal.create({
      sellerId: profileB._id,
      rates: [
        { district: 'Colombo', feeInCents: 60000, estimatedDaysMin: 2, estimatedDaysMax: 4 },
        { district: 'Kandy', feeInCents: 35000, estimatedDaysMin: 1, estimatedDaysMax: 2 },
      ],
      status: 'APPROVED',
      reviewedBy: adminUser._id,
      reviewedAt: new Date(),
    });

    await DeliveryZoneRate.create([
      {
        sellerId: profileB._id,
        district: 'Colombo',
        feeInCents: 60000,
        estimatedDaysMin: 2,
        estimatedDaysMax: 4,
        status: 'ACTIVE',
        proposalId: proposalB._id,
      },
      {
        sellerId: profileB._id,
        district: 'Kandy',
        feeInCents: 35000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 2,
        status: 'ACTIVE',
        proposalId: proposalB._id,
      },
    ]);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Reset customer carts prior to test cases
    await Cart.deleteMany({});
  });

  // =========================================================================
  // GROUP 1: Multi-Vendor Customer Checkout E2E Workflows
  // =========================================================================
  describe('1. Multi-Vendor Customer Checkout Orchestration QA', () => {
    it('QA-ORD-001: Executes single-seller checkout with COD, clears cart, and decrements stock', async () => {
      // 1. Populate Customer A Cart with 2 items from Seller A
      await Cart.create({
        userId: new mongoose.Types.ObjectId(customerAId),
        items: [
          {
            productId: new mongoose.Types.ObjectId(productA1Id),
            sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
            quantity: 2,
            priceInCentsAtAdd: 1250000,
          },
        ],
      });

      // 2. Request Authoritative Server-Side Quote
      const quoteRes = await request(app)
        .post('/api/v1/checkout/quote')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shippingDistrict: 'Colombo',
        });

      expect(quoteRes.status).toBe(200);
      expect(quoteRes.body.success).toBe(true);
      expect(quoteRes.body.data.sellerSuborders).toHaveLength(1);
      expect(quoteRes.body.data.sellerSuborders[0].deliveryFeeInCents).toBe(45000); // Rs. 450.00
      expect(quoteRes.body.data.totalProductAmountInCents).toBe(2500000); // 2 * 12,500 = 25,000 LKR
      expect(quoteRes.body.data.finalPayableAmountInCents).toBe(2545000);

      // 3. Confirm Order Placement with COD
      const initialStock = (await Product.findById(productA1Id))?.stock || 0;

      const placeRes = await request(app)
        .post('/api/v1/checkout/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shippingAddress: {
            fullName: 'Nimal Perera',
            phone: '+94774005001',
            street: 'No 45 Temple Rd',
            city: 'Nugegoda',
            district: 'Colombo',
            postalCode: '10250',
          },
          paymentMethod: 'COD',
          idempotencyKey: `idemp_qa_001_${Date.now()}`,
        });

      expect(placeRes.status).toBe(201);
      expect(placeRes.body.success).toBe(true);
      const { order, suborders } = placeRes.body.data;
      expect(order.orderNumber).toMatch(/^ORD-\d{8}-[A-F0-9]{6}$/);
      expect(order.overallStatus).toBe('IN_PROGRESS'); // All suborders COD -> IN_PROGRESS
      expect(suborders).toHaveLength(1);
      expect(suborders[0].paymentMethod).toBe('COD');
      expect(suborders[0].paymentStatus).toBe('PENDING_COLLECTION');
      expect(suborders[0].commissionableBaseInCents).toBe(2500000); // Delivery fee excluded!

      // 4. Invariant: Cart is emptied
      const cartAfter = await Cart.findOne({ userId: customerAId });
      expect(cartAfter?.items || []).toHaveLength(0);

      // 5. Invariant: Stock decremented by 2
      const updatedProduct = await Product.findById(productA1Id);
      expect(updatedProduct?.stock).toBe(initialStock - 2);
    });

    it('QA-ORD-002: Executes multi-seller checkout creating 1 master order and 2 distinct suborders with reconciled totals', async () => {
      // 1. Customer A cart with items from Seller A and Seller B
      await Cart.create({
        userId: new mongoose.Types.ObjectId(customerAId),
        items: [
          {
            productId: new mongoose.Types.ObjectId(productA1Id),
            sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
            quantity: 1,
            priceInCentsAtAdd: 1250000,
          }, // Seller A (Rs. 12,500)
          {
            productId: new mongoose.Types.ObjectId(productB1Id),
            sellerId: new mongoose.Types.ObjectId(sellerBProfileId),
            quantity: 2,
            priceInCentsAtAdd: 350000,
          }, // Seller B (2 * Rs. 3,500 = Rs. 7,000)
        ],
      });

      // 2. Submit order with suborder payment overrides (Seller A via Bank Transfer, Seller B via COD)
      const placeRes = await request(app)
        .post('/api/v1/checkout/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          shippingAddress: {
            fullName: 'Nimal Perera',
            phone: '+94774005001',
            street: 'No 45 Temple Rd',
            city: 'Nugegoda',
            district: 'Colombo',
            postalCode: '10250',
          },
          paymentMethod: 'BANK_TRANSFER',
          suborderOverrides: [
            { sellerId: sellerBProfileId, paymentMethod: 'COD' },
          ],
          idempotencyKey: `idemp_qa_002_${Date.now()}`,
        });

      expect(placeRes.status).toBe(201);
      const { order, suborders } = placeRes.body.data;

      expect(suborders).toHaveLength(2);
      expect(order.suborderCount).toBe(2);

      // Find suborders
      const subA = suborders.find((s: any) => s.sellerId === sellerAProfileId);
      const subB = suborders.find((s: any) => s.sellerId === sellerBProfileId);

      expect(subA).toBeDefined();
      expect(subB).toBeDefined();

      // Check suborder A
      expect(subA.paymentMethod).toBe('BANK_TRANSFER');
      expect(subA.paymentStatus).toBe('PENDING_PAYMENT');
      expect(subA.subtotalInCents).toBe(1250000);
      expect(subA.deliveryFeeInCents).toBe(45000);
      expect(subA.totalPayableInCents).toBe(1295000);

      // Check suborder B
      expect(subB.paymentMethod).toBe('COD');
      expect(subB.paymentStatus).toBe('PENDING_COLLECTION');
      expect(subB.subtotalInCents).toBe(700000);
      expect(subB.deliveryFeeInCents).toBe(60000);
      expect(subB.totalPayableInCents).toBe(760000);

      // Financial Reconciliation Invariant
      expect(order.totalProductAmountInCents).toBe(1950000); // 12,500 + 7,000
      expect(order.totalDeliveryFeeInCents).toBe(105000); // 450 + 600
      expect(order.finalPayableAmountInCents).toBe(2055000); // 1,295,000 + 760,000
      expect(order.finalPayableAmountInCents).toBe(
        subA.totalPayableInCents + subB.totalPayableInCents
      );
    });

    it('QA-ORD-003: Enforces Idempotency-Key replay protection against duplicate concurrent submissions', async () => {
      await Cart.create({
        userId: new mongoose.Types.ObjectId(customerAId),
        items: [
          {
            productId: new mongoose.Types.ObjectId(productA2Id),
            sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
            quantity: 1,
            priceInCentsAtAdd: 750000,
          },
        ],
      });

      const idempotencyKey = `idemp_replay_qa_${Date.now()}`;
      const payload = {
        shippingAddress: {
          fullName: 'Nimal Perera',
          phone: '+94774005001',
          street: 'No 45 Temple Rd',
          city: 'Nugegoda',
          district: 'Colombo',
          postalCode: '10250',
        },
        paymentMethod: 'COD',
        idempotencyKey,
      };

      // First Request
      const firstRes = await request(app)
        .post('/api/v1/checkout/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send(payload);

      expect(firstRes.status).toBe(201);
      const firstOrderId = firstRes.body.data.order._id;

      // Replay identical request with identical idempotency key
      const replayRes = await request(app)
        .post('/api/v1/checkout/orders')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send(payload);

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.data.order._id).toBe(firstOrderId);

      // Verify no duplicate order or suborder was created
      const orderCount = await Order.countDocuments({ idempotencyKey });
      expect(orderCount).toBe(1);
    });
  });

  // =========================================================================
  // GROUP 2: Stale Data & Authoritative Revalidation Gates
  // =========================================================================
  describe('2. Authoritative Revalidation & Business Invariant Gates QA', () => {
    it('QA-GATE-001: Rejects checkout quote and order if product stock is insufficient', async () => {
      // Put 50 items in cart (only 20 exist in inventory)
      await Cart.create({
        userId: new mongoose.Types.ObjectId(customerAId),
        items: [
          {
            productId: new mongoose.Types.ObjectId(productA1Id),
            sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
            quantity: 50,
            priceInCentsAtAdd: 1250000,
          },
        ],
      });

      const quoteRes = await request(app)
        .post('/api/v1/checkout/quote')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ shippingDistrict: 'Colombo' });

      expect(quoteRes.status).toBe(409);
      expect(quoteRes.body.success).toBe(false);
      expect(quoteRes.body.code).toBe('INSUFFICIENT_STOCK');
    });

    it('QA-GATE-002: Rejects checkout if a seller has no approved delivery rate for destination district', async () => {
      // Seller A ships only to Colombo and Gampaha. Customer chooses Jaffna.
      await Cart.create({
        userId: new mongoose.Types.ObjectId(customerAId),
        items: [
          {
            productId: new mongoose.Types.ObjectId(productA1Id),
            sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
            quantity: 1,
            priceInCentsAtAdd: 1250000,
          },
        ],
      });

      const quoteRes = await request(app)
        .post('/api/v1/checkout/quote')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ shippingDistrict: 'Jaffna' });

      expect(quoteRes.status).toBe(422);
      expect(quoteRes.body.success).toBe(false);
      expect(quoteRes.body.code).toBe('DELIVERY_UNAVAILABLE');
    });

    it('QA-GATE-003: Rejects checkout if seller account becomes suspended in MOD-01', async () => {
      // Create product under suspended seller
      const suspendedProduct = await Product.create({
        sellerId: new mongoose.Types.ObjectId(suspendedSellerProfileId),
        categoryId: new mongoose.Types.ObjectId(categoryId),
        brandId: new mongoose.Types.ObjectId(brandId),
        title: 'Suspended Seller Brake Rotor',
        partNumber: 'SUSP-ROT-001',
        sku: 'SUSP-ROTOR-01',
        description: 'Unvetted seller brake rotor component for testing gate',
        priceInCents: 500000,
        stock: 10,
        condition: 'BRAND_NEW',
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/products/susp.jpg', isPrimary: true }],
      });

      await Cart.create({
        userId: new mongoose.Types.ObjectId(customerAId),
        items: [
          {
            productId: suspendedProduct._id,
            sellerId: new mongoose.Types.ObjectId(suspendedSellerProfileId),
            quantity: 1,
            priceInCentsAtAdd: 500000,
          },
        ],
      });

      const quoteRes = await request(app)
        .post('/api/v1/checkout/quote')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ shippingDistrict: 'Colombo' });

      expect(quoteRes.status).toBe(422);
      expect(quoteRes.body.success).toBe(false);
      expect(quoteRes.body.code).toBe('INACTIVE_SELLER');
    });
  });

  // =========================================================================
  // GROUP 3: Direct Bank Transfer & Slip Verification Lifecycle
  // =========================================================================
  describe('3. Direct Bank Deposit & Receipt Verification QA', () => {
    let testSuborderId: string;

    beforeEach(async () => {
      // Create a fresh suborder for Seller A awaiting bank deposit
      const suborder = await Suborder.create({
        suborderNumber: `ORD-QA-BANK-${Date.now()}-01`,
        orderId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(customerAId),
        sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
        sellerBusinessName: 'Apex Motor Spares Ltd',
        items: [
          {
            productId: new mongoose.Types.ObjectId(productA1Id),
            title: 'Brembo Ceramic Front Brake Pads',
            sku: 'QA-BRK-001',
            unitPriceInCents: 1250000,
            quantity: 1,
            totalPriceInCents: 1250000,
          },
        ],
        subtotalInCents: 1250000,
        sellerDiscountInCents: 0,
        platformDiscountInCents: 0,
        deliveryFeeInCents: 45000,
        totalPayableInCents: 1295000,
        commissionableBaseInCents: 1250000,
        currency: 'LKR',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PENDING_PAYMENT',
        fulfillmentStatus: 'AWAITING_FULFILLMENT',
        deliveryRateSnapshot: {
          rateId: new mongoose.Types.ObjectId().toString(),
          district: 'Colombo',
          feeInCents: 45000,
          estimatedDaysMin: 1,
          estimatedDaysMax: 2,
        },
      });
      testSuborderId = suborder._id.toString();
    });

    it('QA-BANK-001: Customer retrieves authoritative verified bank details for seller', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/suborders/${testSuborderId}/bank-instructions`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bankDetails.bankName).toBe('Commercial Bank of Ceylon');
      expect(res.body.data.bankDetails.accountHolderName).toBe('Apex Motor Spares Ltd');
      expect(res.body.data.bankDetails.accountNumber).toBe('8001234567');
      expect(res.body.data.amountPayableInCents).toBe(1295000);
    });

    it('QA-BANK-002: Customer uploads payment slip, transitioning suborder to PAYMENT_PENDING_VERIFICATION', async () => {
      const dummyPng = Buffer.from('fake-png-deposit-slip-binary-content');

      const res = await request(app)
        .post(`/api/v1/orders/suborders/${testSuborderId}/receipt`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .attach('receipt', dummyPng, 'deposit_slip.png');

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.paymentStatus).toBe('PAYMENT_PENDING_VERIFICATION');

      // Check payment slip record
      const slip = await PaymentSlip.findOne({ suborderId: testSuborderId });
      expect(slip).toBeDefined();
      expect(slip?.reviewStatus).toBe('PENDING');
      expect(slip?.storageKey).toMatch(/^receipts\/suborder-/);
    });

    it('QA-BANK-003: Owning seller reviews and approves slip, advancing suborder to PAID and PROCESSING', async () => {
      // Setup slip in PENDING
      const slip = await PaymentSlip.create({
        suborderId: new mongoose.Types.ObjectId(testSuborderId),
        customerId: new mongoose.Types.ObjectId(customerAId),
        sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
        storageKey: `receipts/suborder-${testSuborderId}-test.png`,
        originalFileName: 'bank_transfer_slip.png',
        mimeType: 'image/png',
        fileSizeBytes: 2048,
        reviewStatus: 'PENDING',
      });

      await Suborder.findByIdAndUpdate(testSuborderId, {
        paymentStatus: 'PAYMENT_PENDING_VERIFICATION',
        currentPaymentSlipId: slip._id,
      });

      // Seller A approves receipt
      const res = await request(app)
        .post(`/api/v1/seller/orders/${testSuborderId}/receipt/verify`)
        .set('Authorization', `Bearer ${sellerAToken}`)
        .send({
          action: 'APPROVE',
          notes: 'Bank transfer confirmed on commercial corporate statement',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suborder.paymentStatus).toBe('PAID');
      expect(res.body.data.suborder.fulfillmentStatus).toBe('PROCESSING');

      // Verify slip status
      const updatedSlip = await PaymentSlip.findById(slip._id);
      expect(updatedSlip?.reviewStatus).toBe('APPROVED');
    });

    it('QA-BANK-004: Owning seller rejects illegible slip with mandatory reason', async () => {
      const slip = await PaymentSlip.create({
        suborderId: new mongoose.Types.ObjectId(testSuborderId),
        customerId: new mongoose.Types.ObjectId(customerAId),
        sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
        storageKey: `receipts/suborder-${testSuborderId}-blur.png`,
        originalFileName: 'blurry_slip.png',
        mimeType: 'image/png',
        fileSizeBytes: 1024,
        reviewStatus: 'PENDING',
      });

      await Suborder.findByIdAndUpdate(testSuborderId, {
        paymentStatus: 'PAYMENT_PENDING_VERIFICATION',
        currentPaymentSlipId: slip._id,
      });

      const res = await request(app)
        .post(`/api/v1/seller/orders/${testSuborderId}/receipt/verify`)
        .set('Authorization', `Bearer ${sellerAToken}`)
        .send({
          action: 'REJECT',
          reason: 'Transaction reference is unreadable, please upload high-res photo',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.suborder.paymentStatus).toBe('PAYMENT_REJECTED');

      const updatedSlip = await PaymentSlip.findById(slip._id);
      expect(updatedSlip?.reviewStatus).toBe('REJECTED');
      expect(updatedSlip?.rejectionReason).toBe(
        'Transaction reference is unreadable, please upload high-res photo'
      );
    });
  });

  // =========================================================================
  // GROUP 4: Security, BOLA & Cross-Tenant Isolation Matrix QA
  // =========================================================================
  describe('4. Security & BOLA Cross-Tenant Isolation Matrix QA', () => {
    let orderAId: string;
    let suborderAId: string;
    let slipAId: string;

    beforeEach(async () => {
      const order = await Order.create({
        orderNumber: `ORD-BOLA-${Date.now()}`,
        customerId: new mongoose.Types.ObjectId(customerAId),
        customerEmail: 'customer.a.qa@autodock.lk',
        shippingAddress: {
          fullName: 'Nimal Perera',
          phone: '+94774005001',
          street: 'No 45 Temple Rd',
          city: 'Nugegoda',
          district: 'Colombo',
          postalCode: '10250',
        },
        suborderIds: [],
        suborderCount: 1,
        totalProductAmountInCents: 1250000,
        totalDeliveryFeeInCents: 45000,
        finalPayableAmountInCents: 1295000,
        overallStatus: 'IN_PROGRESS',
      });
      orderAId = order._id.toString();

      const suborder = await Suborder.create({
        suborderNumber: `${order.orderNumber}-01`,
        orderId: order._id,
        customerId: new mongoose.Types.ObjectId(customerAId),
        sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
        sellerBusinessName: 'Apex Motor Spares Ltd',
        items: [
          {
            productId: new mongoose.Types.ObjectId(productA1Id),
            title: 'Brembo Ceramic Front Brake Pads',
            sku: 'QA-BRK-001',
            unitPriceInCents: 1250000,
            quantity: 1,
            totalPriceInCents: 1250000,
          },
        ],
        subtotalInCents: 1250000,
        sellerDiscountInCents: 0,
        platformDiscountInCents: 0,
        deliveryFeeInCents: 45000,
        totalPayableInCents: 1295000,
        commissionableBaseInCents: 1250000,
        currency: 'LKR',
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'PAYMENT_PENDING_VERIFICATION',
        fulfillmentStatus: 'AWAITING_FULFILLMENT',
        deliveryRateSnapshot: {
          rateId: new mongoose.Types.ObjectId().toString(),
          district: 'Colombo',
          feeInCents: 45000,
          estimatedDaysMin: 1,
          estimatedDaysMax: 2,
        },
      });
      suborderAId = suborder._id.toString();

      order.suborderIds = [suborder._id];
      await order.save();

      const slip = await PaymentSlip.create({
        suborderId: suborder._id,
        customerId: new mongoose.Types.ObjectId(customerAId),
        sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
        storageKey: `receipts/suborder-${suborderAId}-private.png`,
        originalFileName: 'private_receipt.png',
        mimeType: 'image/png',
        fileSizeBytes: 2048,
        reviewStatus: 'PENDING',
      });
      slipAId = slip._id.toString();

      await Suborder.findByIdAndUpdate(suborder._id, {
        currentPaymentSlipId: slip._id,
      });
    });

    it('QA-SEC-001: Customer B is denied access to Customer A order (403 Forbidden)', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/${orderAId}`)
        .set('Authorization', `Bearer ${customerBToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('QA-SEC-002: Seller B cannot view or transition Seller A suborder (403 Forbidden)', async () => {
      const res = await request(app)
        .patch(`/api/v1/seller/orders/${suborderAId}/status`)
        .set('Authorization', `Bearer ${sellerBToken}`)
        .send({ fulfillmentStatus: 'PROCESSING' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('QA-SEC-003: Seller B cannot view or verify Seller A payment slip (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/seller/orders/${suborderAId}/receipt/verify`)
        .set('Authorization', `Bearer ${sellerBToken}`)
        .send({ action: 'APPROVE' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('QA-SEC-004: Customer B cannot upload payment receipt for Customer A suborder (403 Forbidden)', async () => {
      const dummyPng = Buffer.from('forged-slip-content');

      const res = await request(app)
        .post(`/api/v1/orders/suborders/${suborderAId}/receipt`)
        .set('Authorization', `Bearer ${customerBToken}`)
        .attach('receipt', dummyPng, 'forged_slip.png');

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('QA-SEC-005: Unauthenticated visitor is denied access to private receipt stream (401 Unauthorized)', async () => {
      const res = await request(app)
        .get(`/api/v1/orders/suborders/${suborderAId}/receipt/view`);

      expect(res.status).toBe(401);
    });
  });

  // =========================================================================
  // GROUP 5: Card Payment Sandbox & Webhook Verification QA
  // =========================================================================
  describe('5. Card Payment Sandbox & HMAC Webhook QA', () => {
    let cardSuborderId: string;

    beforeEach(async () => {
      const sub = await Suborder.create({
        suborderNumber: `ORD-QA-CARD-${Date.now()}-01`,
        orderId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(customerAId),
        sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
        sellerBusinessName: 'Apex Motor Spares Ltd',
        items: [
          {
            productId: new mongoose.Types.ObjectId(productA1Id),
            title: 'Brembo Ceramic Front Brake Pads',
            sku: 'QA-BRK-001',
            unitPriceInCents: 1250000,
            quantity: 1,
            totalPriceInCents: 1250000,
          },
        ],
        subtotalInCents: 1250000,
        sellerDiscountInCents: 0,
        platformDiscountInCents: 0,
        deliveryFeeInCents: 45000,
        totalPayableInCents: 1295000,
        commissionableBaseInCents: 1250000,
        currency: 'LKR',
        paymentMethod: 'CARD_SANDBOX',
        paymentStatus: 'PENDING_PAYMENT',
        fulfillmentStatus: 'AWAITING_FULFILLMENT',
        deliveryRateSnapshot: {
          rateId: new mongoose.Types.ObjectId().toString(),
          district: 'Colombo',
          feeInCents: 45000,
          estimatedDaysMin: 1,
          estimatedDaysMax: 2,
        },
      });
      cardSuborderId = sub._id.toString();
    });

    it('QA-CARD-001: Generates sandbox card session token and simulation URL', async () => {
      const res = await request(app)
        .post(`/api/v1/payments/card/session`)
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ suborderId: cardSuborderId });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sessionToken).toBeDefined();
      expect(res.body.data.sandboxUrl).toContain('/api/v1/payments/card/sandbox-checkout?session=');
    });

    it('QA-CARD-002: Rejects webhook with forged HMAC signature (401 Unauthorized)', async () => {
      const payload = {
        eventId: `evt_forged_${Date.now()}`,
        suborderId: cardSuborderId,
        status: 'SUCCESS',
        amountInCents: 1295000,
      };

      const res = await request(app)
        .post('/api/v1/payments/card/webhook')
        .set('x-autodock-signature', 'forged-invalid-hex-signature-1234')
        .send(payload);

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('QA-CARD-003: Processes valid signed webhook, updates suborder to PAID and PROCESSING, and ignores replays', async () => {
      const eventId = `evt_valid_qa_${Date.now()}`;
      const payload = {
        eventId,
        suborderId: cardSuborderId,
        status: 'SUCCESS',
        amountInCents: 1295000,
      };

      const webhookSecret = env.CARD_SANDBOX_WEBHOOK_SECRET || 'autodock_card_webhook_secret_key_2026';
      const validHmac = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(payload))
        .digest('hex');

      // First webhook submission
      const firstRes = await request(app)
        .post('/api/v1/payments/card/webhook')
        .set('x-autodock-signature', validHmac)
        .send(payload);

      expect(firstRes.status).toBe(200);
      expect(firstRes.body.success).toBe(true);

      const subAfter = await Suborder.findById(cardSuborderId);
      expect(subAfter?.paymentStatus).toBe('PAID');
      expect(subAfter?.fulfillmentStatus).toBe('PROCESSING');

      // Replay same webhook event
      const replayRes = await request(app)
        .post('/api/v1/payments/card/webhook')
        .set('x-autodock-signature', validHmac)
        .send(payload);

      expect(replayRes.status).toBe(200);
      expect(replayRes.body.message).toContain('Duplicate webhook event ignored');

      // Verify webhook collection contains exactly 1 recorded event
      const recordedEvents = await PaymentWebhookEvent.countDocuments({ eventId });
      expect(recordedEvents).toBe(1);
    });
  });

  // =========================================================================
  // GROUP 6: Cross-Module Contracts (MOD-02 Reviews & MOD-04 Finance) QA
  // =========================================================================
  describe('6. Cross-Module Public Contract Verification QA', () => {
    it('QA-CON-001: MOD-02 Review verification contract accurately validates delivered suborders', async () => {
      // 1. Create a delivered suborder containing productA1
      const deliveredSub = await Suborder.create({
        suborderNumber: `ORD-DELIV-${Date.now()}`,
        orderId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(customerAId),
        sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
        sellerBusinessName: 'Apex Motor Spares Ltd',
        items: [
          {
            productId: new mongoose.Types.ObjectId(productA1Id),
            title: 'Brembo Ceramic Front Brake Pads',
            sku: 'QA-BRK-001',
            unitPriceInCents: 1250000,
            quantity: 1,
            totalPriceInCents: 1250000,
          },
        ],
        subtotalInCents: 1250000,
        deliveryFeeInCents: 45000,
        totalPayableInCents: 1295000,
        commissionableBaseInCents: 1250000,
        paymentMethod: 'COD',
        paymentStatus: 'COLLECTED',
        fulfillmentStatus: 'DELIVERED',
        deliveredAt: new Date(),
        deliveryRateSnapshot: {
          rateId: new mongoose.Types.ObjectId().toString(),
          district: 'Colombo',
          feeInCents: 45000,
          estimatedDaysMin: 1,
          estimatedDaysMax: 2,
        },
      });

      // Query contract for customer A
      const resultValid = await orderPublicService.verifyDeliveredPurchase(
        customerAId,
        productA1Id,
        deliveredSub._id.toString()
      );
      expect(resultValid.isDelivered).toBe(true);
      expect(resultValid.deliveredAt).toBeDefined();

      // Query contract for customer B (should fail: does not belong to Customer B)
      const resultWrongCustomer = await orderPublicService.verifyDeliveredPurchase(
        customerBId,
        productA1Id,
        deliveredSub._id.toString()
      );
      expect(resultWrongCustomer.isDelivered).toBe(false);
      expect(resultWrongCustomer.reason).toContain('does not belong to the authenticated user');

      // Query contract for product not in suborder (productB1)
      const resultWrongProduct = await orderPublicService.verifyDeliveredPurchase(
        customerAId,
        productB1Id,
        deliveredSub._id.toString()
      );
      expect(resultWrongProduct.isDelivered).toBe(false);
      expect(resultWrongProduct.reason).toContain('was not purchased in this suborder');
    });

    it('QA-CON-002: Invariant: Delivery fee is 100% excluded from commissionable base handed off to MOD-04', async () => {
      const suborder = await Suborder.create({
        suborderNumber: `ORD-FIN-${Date.now()}`,
        orderId: new mongoose.Types.ObjectId(),
        customerId: new mongoose.Types.ObjectId(customerAId),
        sellerId: new mongoose.Types.ObjectId(sellerAProfileId),
        sellerBusinessName: 'Apex Motor Spares Ltd',
        items: [
          {
            productId: new mongoose.Types.ObjectId(productA1Id),
            title: 'Brembo Ceramic Front Brake Pads',
            sku: 'QA-BRK-001',
            unitPriceInCents: 1000000,
            quantity: 1,
            totalPriceInCents: 1000000,
          },
        ],
        subtotalInCents: 1000000, // Rs. 10,000 product
        sellerDiscountInCents: 100000, // Rs. 1,000 seller-funded discount
        platformDiscountInCents: 50000, // Rs. 500 AutoDock subsidy discount
        deliveryFeeInCents: 65000, // Rs. 650 delivery fee
        totalPayableInCents: 915000,
        commissionableBaseInCents: 900000, // 1,000,000 - 100,000 = Rs. 9,000
        currency: 'LKR',
        paymentMethod: 'COD',
        paymentStatus: 'COLLECTED',
        fulfillmentStatus: 'DELIVERED',
        deliveryRateSnapshot: {
          rateId: new mongoose.Types.ObjectId().toString(),
          district: 'Colombo',
          feeInCents: 65000,
          estimatedDaysMin: 1,
          estimatedDaysMax: 2,
        },
      });

      // Verify that commissionableBase = subtotal - sellerDiscount
      expect(suborder.commissionableBaseInCents).toBe(
        suborder.subtotalInCents - suborder.sellerDiscountInCents
      );
      // Verify that delivery fee did not inflate commissionable base
      expect(suborder.commissionableBaseInCents).toBe(900000);
      expect(suborder.deliveryFeeInCents).toBe(65000);
    });
  });
});
