import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { Product } from '../../../src/modules/customer-experience/models/product.model.js';
import { Category } from '../../../src/modules/customer-experience/models/category.model.js';
import { Brand } from '../../../src/modules/customer-experience/models/brand.model.js';
import { Review } from '../../../src/modules/customer-experience/models/review.model.js';
import { Cart } from '../../../src/modules/customer-experience/models/cart.model.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import {
  orderVerificationService,
  IOrderPublicContract,
} from '../../../src/modules/customer-experience/contracts/orderConsumer.contract.js';
import { productPublicService } from '../../../src/modules/customer-experience/contracts/product.contract.js';

describe('MOD-02 Customer Reviews & Public Service Contract Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_reviews';

  let customerToken: string;
  let customerId: string;
  let adminToken: string;
  let sellerToken: string;
  let sellerId: string;
  let testProductId: string;
  const deliveredSuborderId = new mongoose.Types.ObjectId().toString();
  const undeliveredSuborderId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // Setup Customer
    const customer = await User.create({
      email: 'reviewer@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Reviewer',
      lastName: 'Customer',
      phone: '+94778881122',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerId = customer._id.toString();
    customerToken = jwt.sign(
      { userId: customerId, email: customer.email, role: customer.role },
      env.JWT_ACCESS_SECRET
    );

    // Setup Admin
    const admin = await User.create({
      email: 'admin.review@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Admin',
      lastName: 'Mod',
      phone: '+94770001122',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    adminToken = jwt.sign(
      { userId: admin._id.toString(), email: admin.email, role: admin.role },
      env.JWT_ACCESS_SECRET
    );

    // Setup Seller
    sellerId = new mongoose.Types.ObjectId().toString();
    const seller = await User.create({
      email: 'seller.review@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Seller',
      lastName: 'Parts',
      phone: '+94772228899',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    sellerToken = jwt.sign(
      { userId: seller._id.toString(), email: seller.email, role: seller.role, sellerId },
      env.JWT_ACCESS_SECRET
    );

    const cat = await Category.create({ name: 'Batteries', slug: 'batteries' });
    const brand = await Brand.create({ name: 'Amaron', slug: 'amaron' });

    const prod = await Product.create({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      title: 'Amaron Pro 12V 45Ah Maintenance Free Battery',
      sku: 'AMR-PRO-45',
      partNumber: 'BH45D20L',
      categoryId: cat._id,
      brandId: brand._id,
      condition: 'BRAND_NEW',
      description: 'High CCA maintenance free automotive battery with 36 months warranty.',
      priceInCents: 3200000,
      stock: 12,
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/battery.jpg', isPrimary: true }],
    });
    testProductId = prod._id.toString();

    // Plug mock MOD-03 order verification provider into adapter
    const mockOrderContract: IOrderPublicContract = {
      async verifyDeliveredPurchase(uId, pId, sId) {
        if (sId === deliveredSuborderId && uId === customerId && pId === testProductId) {
          return { isDelivered: true, deliveredAt: new Date() };
        }
        return { isDelivered: false, reason: 'No delivered suborder found' };
      },
    };
    orderVerificationService.registerProvider(mockOrderContract);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Review.deleteMany({});
    await Cart.deleteMany({});
  });

  it('TC-MOD02-017: Enforces BR: Verified purchase required to submit review', async () => {
    // Attempt with undelivered suborder
    const unverifiedRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProductId,
        suborderId: undeliveredSuborderId,
        rating: 5,
        comment: 'Great battery, fast delivery!',
      });

    expect(unverifiedRes.status).toBe(403);
    expect(unverifiedRes.body.code).toBe('VERIFIED_PURCHASE_REQUIRED');
  });

  it('TC-MOD02-018: Verified purchaser submits review, publishes immediately, and updates product averageRating atomically', async () => {
    // Submit review with delivered suborder
    const res = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProductId,
        suborderId: deliveredSuborderId,
        rating: 5,
        title: 'Cranked instantly in the morning',
        comment: 'Replaced my old OEM battery with this Amaron. Excellent cranking power and zero issues.',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('REVIEW_PUBLISHED');
    expect(res.body.data.status).toBe('PUBLISHED');

    // Verify product averageRating was updated atomically
    const product = await Product.findById(testProductId);
    expect(product?.averageRating).toBe(5);
    expect(product?.reviewCount).toBe(1);

    // Verify public product review feed returns the published review
    const feedRes = await request(app).get(`/api/v1/products/${testProductId}/reviews`);
    expect(feedRes.status).toBe(200);
    expect(feedRes.body.data.length).toBe(1);
    expect(feedRes.body.meta.ratingDistribution['5']).toBe(1);
  });

  it('TC-MOD02-019: Rejects duplicate review submission for the same delivered suborder', async () => {
    // First review
    await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProductId,
        suborderId: deliveredSuborderId,
        rating: 5,
        comment: 'Initial review for purchase.',
      });

    // Duplicate review for same suborder
    const dupRes = await request(app)
      .post('/api/v1/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        productId: testProductId,
        suborderId: deliveredSuborderId,
        rating: 4,
        comment: 'Attempting duplicate review for same suborder.',
      });

    expect(dupRes.status).toBe(409);
    expect(dupRes.body.code).toBe('DUPLICATE_REVIEW_FOR_ORDER');
  });

  it('TC-MOD02-020: Seller has read-only review view, and Administrator can moderate reviews', async () => {
    // Create published review
    const review = await Review.create({
      productId: new mongoose.Types.ObjectId(testProductId),
      userId: new mongoose.Types.ObjectId(customerId),
      suborderId: new mongoose.Types.ObjectId(deliveredSuborderId),
      rating: 1,
      comment: 'Contains offensive inappropriate language!',
      status: 'PUBLISHED',
    });

    // 1. Seller view-only check
    const sellerReviewsRes = await request(app)
      .get('/api/v1/seller/products/reviews')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(sellerReviewsRes.status).toBe(200);
    expect(sellerReviewsRes.body.data.length).toBe(1);

    // 2. Administrator hides review with reason
    const modRes = await request(app)
      .patch(`/api/v1/admin/reviews/${review._id}/moderation`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'HIDE',
        moderationReason: 'Contains abusive language violating marketplace policies',
      });

    expect(modRes.status).toBe(200);
    expect(modRes.body.data.status).toBe('HIDDEN_BY_ADMIN');

    // Confirm hidden review is omitted from public storefront feed
    const publicFeed = await request(app).get(`/api/v1/products/${testProductId}/reviews`);
    expect(publicFeed.body.data.length).toBe(0);
  });

  it('TC-MOD02-021: ProductModulePublicService handles stock reservation, decrement, and cart checkout handoff', async () => {
    // 1. Test verifyAndReserveStock
    const reserveRes = await productPublicService.verifyAndReserveStock([
      { productId: testProductId, quantity: 2 },
    ]);
    expect(reserveRes.isAvailable).toBe(true);
    expect(reserveRes.reservedItems.length).toBe(1);
    expect(reserveRes.reservedItems[0].unitPriceInCents).toBe(3200000);

    // 2. Test decrementStock
    const initialStock = (await Product.findById(testProductId))!.stock;
    const decSuccess = await productPublicService.decrementStock([
      { productId: testProductId, quantity: 2 },
    ]);
    expect(decSuccess).toBe(true);

    const postStock = (await Product.findById(testProductId))!.stock;
    expect(postStock).toBe(initialStock - 2);

    // 3. Test releaseStock
    await productPublicService.releaseStock([{ productId: testProductId, quantity: 2 }]);
    const restoredStock = (await Product.findById(testProductId))!.stock;
    expect(restoredStock).toBe(initialStock);

    // 4. Test getCartForCheckout
    await Cart.create({
      userId: new mongoose.Types.ObjectId(customerId),
      items: [
        {
          productId: new mongoose.Types.ObjectId(testProductId),
          sellerId: new mongoose.Types.ObjectId(sellerId),
          quantity: 2,
          priceInCentsAtAdd: 3200000,
        },
      ],
    });

    const handoff = await productPublicService.getCartForCheckout(customerId);
    expect(handoff).toBeDefined();
    expect(handoff?.cartGrandTotalInCents).toBe(6400000);
    expect(handoff?.sellerGroups.length).toBe(1);

    // 5. Test clearCart
    await productPublicService.clearCart(customerId);
    const clearedCart = await Cart.findOne({ userId: customerId });
    expect(clearedCart?.items.length).toBe(0);
  });

  it('TC-MOD02-022: Rule-based recommendations return items using deterministic fallback', async () => {
    const res = await request(app)
      .get('/api/v1/products/recommendations')
      .query({ limit: 4 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.products.length).toBeGreaterThan(0);
    expect(res.body.data.ruleApplied).toBe('POPULAR_ITEMS');
  });
});
