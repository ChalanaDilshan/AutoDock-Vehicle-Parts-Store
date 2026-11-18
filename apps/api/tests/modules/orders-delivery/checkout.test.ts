import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { Product } from '../../../src/modules/customer-experience/models/product.model.js';
import { Category } from '../../../src/modules/customer-experience/models/category.model.js';
import { Brand } from '../../../src/modules/customer-experience/models/brand.model.js';
import { Cart } from '../../../src/modules/customer-experience/models/cart.model.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { DeliveryZoneRate } from '../../../src/modules/orders-delivery/models/deliveryZone.model.js';
import { DeliveryRateProposal } from '../../../src/modules/orders-delivery/models/deliveryRateProposal.model.js';
import { Order } from '../../../src/modules/orders-delivery/models/order.model.js';
import { Suborder } from '../../../src/modules/orders-delivery/models/suborder.model.js';

describe('MOD-03 Multi-Vendor Checkout Orchestration Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_checkout';

  let customerToken: string;
  let customerId: string;
  let customerEmail: string;

  let seller1ProfileId: string;
  let seller2ProfileId: string;

  let product1Id: string;
  let product2Id: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // 1. Create Customer
    customerEmail = 'customer.orders@autodock.lk';
    const customer = await User.create({
      email: customerEmail,
      passwordHash: 'hashedpassword',
      firstName: 'Kamal',
      lastName: 'Perera',
      phone: '+94771234567',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerId = customer._id.toString();
    customerToken = jwt.sign(
      { userId: customerId, email: customer.email, role: customer.role },
      env.JWT_ACCESS_SECRET
    );

    // 2. Create Seller Profiles (Approved and Active in MOD-01)
    const sellerUser1 = await User.create({
      email: 'seller1.orders@autodock.lk',
      passwordHash: 'hashedpassword',
      firstName: 'Seller',
      lastName: 'One',
      phone: '+94771112233',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const profile1 = await SellerProfile.create({
      userId: sellerUser1._id,
      businessName: 'Colombo Auto Parts (Pvt) Ltd',
      storeSlug: 'colombo-auto-parts',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-12345',
      operatingAddress: {
        street: '100 Baseline Rd',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '00500',
      },
      contactPhone: '+94771112233',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    seller1ProfileId = profile1._id.toString();

    const sellerUser2 = await User.create({
      email: 'seller2.orders@autodock.lk',
      passwordHash: 'hashedpassword',
      firstName: 'Seller',
      lastName: 'Two',
      phone: '+94774445566',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const profile2 = await SellerProfile.create({
      userId: sellerUser2._id,
      businessName: 'Kandy Motor Spares',
      storeSlug: 'kandy-motor-spares',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-67890',
      operatingAddress: {
        street: '45 Peradeniya Rd',
        city: 'Kandy',
        district: 'Kandy',
        province: 'Central',
        postalCode: '20000',
      },
      contactPhone: '+94774445566',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    seller2ProfileId = profile2._id.toString();

    // 3. Create Approved Active Delivery Rates
    const dummyProposal = await DeliveryRateProposal.create({
      sellerId: profile1._id,
      rates: [{ district: 'Colombo', feeInCents: 45000, estimatedDaysMin: 1, estimatedDaysMax: 3 }],
      status: 'APPROVED',
    });

    await DeliveryZoneRate.create({
      sellerId: profile1._id,
      district: 'Colombo',
      feeInCents: 45000, // Rs. 450.00
      estimatedDaysMin: 1,
      estimatedDaysMax: 3,
      proposalId: dummyProposal._id,
      status: 'ACTIVE',
    });

    await DeliveryZoneRate.create({
      sellerId: profile2._id,
      district: 'Colombo',
      feeInCents: 60000, // Rs. 600.00
      estimatedDaysMin: 2,
      estimatedDaysMax: 5,
      proposalId: dummyProposal._id,
      status: 'ACTIVE',
    });

    // 4. Create Catalogue Items in MOD-02
    const category = await Category.create({ name: 'Brakes', slug: 'brakes' });
    const brand = await Brand.create({ name: 'Brembo', slug: 'brembo' });

    const p1 = await Product.create({
      sellerId: profile1._id,
      title: 'Brembo Front Brake Rotor',
      sku: 'BRM-ROT-001',
      partNumber: 'BRM-001',
      categoryId: category._id,
      brandId: brand._id,
      condition: 'BRAND_NEW',
      description: 'High performance brake rotor.',
      priceInCents: 1250000, // Rs. 12,500.00
      stock: 10,
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/b1.jpg', isPrimary: true }],
    });
    product1Id = p1._id.toString();

    const p2 = await Product.create({
      sellerId: profile2._id,
      title: 'Brembo Ceramic Brake Pads',
      sku: 'BRM-PAD-002',
      partNumber: 'BRM-002',
      categoryId: category._id,
      brandId: brand._id,
      condition: 'BRAND_NEW',
      description: 'Quiet ceramic compound pads.',
      priceInCents: 850000, // Rs. 8,500.00
      stock: 5,
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/b2.jpg', isPrimary: true }],
    });
    product2Id = p2._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await SellerProfile.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});
    await DeliveryRateProposal.deleteMany({});
    await DeliveryZoneRate.deleteMany({});
    await Order.deleteMany({});
    await Suborder.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Cart.deleteMany({});
    await Order.deleteMany({});
    await Suborder.deleteMany({});
  });

  it('TC-ORD-01: Generates an authoritative checkout quote with split delivery fees', async () => {
    // Populate customer's cart in MOD-02
    await Cart.create({
      userId: new mongoose.Types.ObjectId(customerId),
      items: [
        {
          productId: new mongoose.Types.ObjectId(product1Id),
          sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
          quantity: 2,
          priceInCentsAtAdd: 1250000,
        },
        {
          productId: new mongoose.Types.ObjectId(product2Id),
          sellerId: new mongoose.Types.ObjectId(seller2ProfileId),
          quantity: 1,
          priceInCentsAtAdd: 850000,
        },
      ],
    });

    const res = await request(app)
      .post('/api/v1/checkout/quote')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shippingDistrict: 'Colombo' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('QUOTE_GENERATED');

    const quote = res.body.data;
    // Product 1: 2 * 1,250,000 = 2,500,000
    // Product 2: 1 * 850,000 = 850,000
    // Total product = 3,350,000 cents
    expect(quote.totalProductAmountInCents).toBe(3350000);

    // Delivery: Seller 1 = 45,000; Seller 2 = 60,000; Total delivery = 105,000
    expect(quote.totalDeliveryFeeInCents).toBe(105000);
    expect(quote.finalPayableAmountInCents).toBe(3455000);

    expect(quote.sellerSuborderQuotes).toHaveLength(2);
    const s1Quote = quote.sellerSuborderQuotes.find((s: any) => s.sellerId === seller1ProfileId);
    expect(s1Quote.deliveryFeeInCents).toBe(45000);
    expect(s1Quote.productSubtotalInCents).toBe(2500000);

    const s2Quote = quote.sellerSuborderQuotes.find((s: any) => s.sellerId === seller2ProfileId);
    expect(s2Quote.deliveryFeeInCents).toBe(60000);
    expect(s2Quote.productSubtotalInCents).toBe(850000);
  });

  it('TC-ORD-02: Rejects quote when a seller has no approved rate for destination district', async () => {
    await Cart.create({
      userId: new mongoose.Types.ObjectId(customerId),
      items: [
        {
          productId: new mongoose.Types.ObjectId(product1Id),
          sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
          quantity: 1,
          priceInCentsAtAdd: 1250000,
        },
      ],
    });

    const res = await request(app)
      .post('/api/v1/checkout/quote')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ shippingDistrict: 'Jaffna' }); // Neither seller delivers to Jaffna

    expect(res.status).toBe(422);
    expect(res.body.code).toBe('DELIVERY_UNAVAILABLE');
  });

  it('TC-ORD-03: Places multi-vendor order: creates 1 master order and 2 seller suborders', async () => {
    await Cart.create({
      userId: new mongoose.Types.ObjectId(customerId),
      items: [
        {
          productId: new mongoose.Types.ObjectId(product1Id),
          sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
          quantity: 2,
          priceInCentsAtAdd: 1250000,
        },
        {
          productId: new mongoose.Types.ObjectId(product2Id),
          sellerId: new mongoose.Types.ObjectId(seller2ProfileId),
          quantity: 1,
          priceInCentsAtAdd: 850000,
        },
      ],
    });

    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', 'test-idempotency-key-001')
      .send({
        paymentMethod: 'BANK_TRANSFER',
        shippingAddress: {
          fullName: 'Kamal Perera',
          phone: '+94771234567',
          street: '12 Galle Road',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00300',
        },
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('ORDER_PLACED');

    const data = res.body.data;
    expect(data.orderNumber).toMatch(/^ORD-\d{8}-[A-F0-9]{6}$/);
    expect(data.suborders).toHaveLength(2);
    expect(data.finalPayableAmountInCents).toBe(3455000);

    // Verify suborders in DB
    const dbSuborders = await Suborder.find({ orderId: data.orderId });
    expect(dbSuborders).toHaveLength(2);
    expect(dbSuborders[0].paymentMethod).toBe('BANK_TRANSFER');
    expect(dbSuborders[0].paymentStatus).toBe('PENDING_PAYMENT');
    expect(dbSuborders[0].fulfillmentStatus).toBe('AWAITING_FULFILLMENT');

    // Verify stock decremented in MOD-02
    const p1 = await Product.findById(product1Id);
    expect(p1!.stock).toBe(8); // 10 - 2

    const p2 = await Product.findById(product2Id);
    expect(p2!.stock).toBe(4); // 5 - 1

    // Verify cart cleared in MOD-02
    const cart = await Cart.findOne({ userId: customerId });
    expect(cart!.items).toHaveLength(0);
  });

  it('TC-ORD-04: Enforces Idempotency-Key replay protection against duplicate submissions', async () => {
    await Cart.create({
      userId: new mongoose.Types.ObjectId(customerId),
      items: [
        {
          productId: new mongoose.Types.ObjectId(product1Id),
          sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
          quantity: 1,
          priceInCentsAtAdd: 1250000,
        },
      ],
    });

    const idempotencyKey = 'unique-replay-test-key-999';

    // First placement
    const res1 = await request(app)
      .post('/api/v1/checkout/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        paymentMethod: 'COD',
        shippingAddress: {
          fullName: 'Kamal Perera',
          phone: '+94771234567',
          street: '12 Galle Road',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00300',
        },
      });

    expect(res1.status).toBe(201);
    const orderNumber1 = res1.body.data.orderNumber;

    // Second placement with identical idempotency key
    const res2 = await request(app)
      .post('/api/v1/checkout/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({
        paymentMethod: 'COD',
        shippingAddress: {
          fullName: 'Kamal Perera',
          phone: '+94771234567',
          street: '12 Galle Road',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00300',
        },
      });

    // Should return existing order without creating a duplicate
    expect(res2.status).toBe(201);
    expect(res2.body.data.orderNumber).toBe(orderNumber1);

    const orderCount = await Order.countDocuments({ customerId });
    expect(orderCount).toBe(1);
  });

  it('TC-ORD-05: Rejects checkout when product stock is insufficient', async () => {
    // Product 2 only has 4 in stock currently
    await Cart.create({
      userId: new mongoose.Types.ObjectId(customerId),
      items: [
        {
          productId: new mongoose.Types.ObjectId(product2Id),
          sellerId: new mongoose.Types.ObjectId(seller2ProfileId),
          quantity: 10,
          priceInCentsAtAdd: 850000,
        },
      ],
    });

    const res = await request(app)
      .post('/api/v1/checkout/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        paymentMethod: 'COD',
        shippingAddress: {
          fullName: 'Kamal Perera',
          phone: '+94771234567',
          street: '12 Galle Road',
          city: 'Colombo',
          district: 'Colombo',
          postalCode: '00300',
        },
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INSUFFICIENT_STOCK');

    // Cart must not be cleared on failure
    const cart = await Cart.findOne({ userId: customerId });
    expect(cart!.items).toHaveLength(1);
  });
});
