import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { Category } from '../../../src/modules/customer-experience/models/category.model.js';
import { Brand } from '../../../src/modules/customer-experience/models/brand.model.js';
import { Product } from '../../../src/modules/customer-experience/models/product.model.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';

describe('MOD-02 Product Catalogue & Seller Management Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_products';

  let adminToken: string;
  let approvedSellerToken: string;
  let pendingSellerToken: string;
  let otherSellerToken: string;

  let approvedSellerId: string;
  let otherSellerId: string;
  let testCategoryId: string;
  let testBrandId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // Setup Admin
    const adminUser = await User.create({
      email: 'admin.prod@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+94771112233',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    adminToken = jwt.sign(
      { userId: adminUser._id.toString(), email: adminUser.email, role: adminUser.role },
      env.JWT_ACCESS_SECRET
    );

    // Setup Approved Seller 1
    const sellerUser1 = await User.create({
      email: 'seller1.prod@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Seller',
      lastName: 'One',
      phone: '+94772223344',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const profile1 = await SellerProfile.create({
      userId: sellerUser1._id,
      businessName: 'Apex Auto Parts (Pvt) Ltd',
      businessRegistrationNumber: 'PV-10001',
      contactPhone: '+94772223344',
      storeSlug: 'apex-auto-parts',
      sellerType: 'PHYSICAL_STORE',
      operatingAddress: {
        street: '100 Main Road',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '00100',
      },
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    approvedSellerId = profile1._id.toString();
    approvedSellerToken = jwt.sign(
      {
        userId: sellerUser1._id.toString(),
        email: sellerUser1.email,
        role: sellerUser1.role,
        sellerId: approvedSellerId,
      },
      env.JWT_ACCESS_SECRET
    );

    // Setup Pending Seller 2
    const sellerUser2 = await User.create({
      email: 'seller2.pending@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Pending',
      lastName: 'Seller',
      phone: '+94773334455',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const profile2 = await SellerProfile.create({
      userId: sellerUser2._id,
      businessName: 'Pending Motors (Pvt) Ltd',
      businessRegistrationNumber: 'PV-10002',
      contactPhone: '+94773334455',
      storeSlug: 'pending-motors',
      sellerType: 'ONLINE_ONLY',
      operatingAddress: {
        street: '200 Lake Road',
        city: 'Gampaha',
        district: 'Gampaha',
        province: 'Western',
        postalCode: '11000',
      },
      verificationStatus: 'PENDING',
      isEligibleToSell: false,
    });
    pendingSellerToken = jwt.sign(
      {
        userId: sellerUser2._id.toString(),
        email: sellerUser2.email,
        role: sellerUser2.role,
        sellerId: profile2._id.toString(),
      },
      env.JWT_ACCESS_SECRET
    );

    // Setup Other Seller 3 (for IDOR testing)
    const sellerUser3 = await User.create({
      email: 'seller3.other@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Other',
      lastName: 'Seller',
      phone: '+94774445566',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const profile3 = await SellerProfile.create({
      userId: sellerUser3._id,
      businessName: 'Lanka Spares (Pvt) Ltd',
      businessRegistrationNumber: 'PV-10003',
      contactPhone: '+94774445566',
      storeSlug: 'lanka-spares',
      sellerType: 'PHYSICAL_STORE',
      operatingAddress: {
        street: '300 Kandy Road',
        city: 'Kandy',
        district: 'Kandy',
        province: 'Central',
        postalCode: '20000',
      },
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    otherSellerId = profile3._id.toString();
    otherSellerToken = jwt.sign(
      {
        userId: sellerUser3._id.toString(),
        email: sellerUser3.email,
        role: sellerUser3.role,
        sellerId: otherSellerId,
      },
      env.JWT_ACCESS_SECRET
    );

    // Create Test Category and Brand
    const cat = await Category.create({
      name: 'Brake Pads',
      slug: 'brake-pads',
      description: 'Friction brake pads for vehicles',
      isActive: true,
    });
    testCategoryId = cat._id.toString();

    const brand = await Brand.create({
      name: 'Brembo',
      slug: 'brembo',
      countryOfOrigin: 'Italy',
      isActive: true,
    });
    testBrandId = brand._id.toString();
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  it('TC-MOD02-001: Allows approved seller to create product with integer price in cents', async () => {
    const res = await request(app)
      .post('/api/v1/seller/products')
      .set('Authorization', `Bearer ${approvedSellerToken}`)
      .send({
        title: 'Brembo Front Ceramic Brake Pads (Set of 4)',
        sku: 'APX-BRM-001',
        partNumber: 'P83071N',
        categoryId: testCategoryId,
        brandId: testBrandId,
        condition: 'BRAND_NEW',
        description: 'High performance ceramic brake pads providing exceptional stopping power.',
        priceInCents: 1250000, // Rs. 12,500.00
        stock: 15,
        lowStockThreshold: 3,
        warrantyMonths: 12,
        images: [
          { url: 'https://cdn.autodock.lk/products/brembo_main.jpg', isPrimary: true },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.code).toBe('PRODUCT_CREATED');
    expect(res.body.data.priceInCents).toBe(1250000);
    expect(res.body.data.stock).toBe(15);
    expect(res.body.data.status).toBe('ACTIVE');

    // Confirm in database
    const inDb = await Product.findById(res.body.data.id);
    expect(inDb).toBeDefined();
    expect(inDb?.sellerId.toString()).toBe(approvedSellerId);
    expect(inDb?.priceInCents).toBe(1250000);
  });

  it('TC-MOD02-002: Rejects negative or non-integer floating-point prices', async () => {
    const res = await request(app)
      .post('/api/v1/seller/products')
      .set('Authorization', `Bearer ${approvedSellerToken}`)
      .send({
        title: 'Brembo Front Ceramic Brake Pads',
        sku: 'APX-BRM-002',
        partNumber: 'P83071N',
        categoryId: testCategoryId,
        brandId: testBrandId,
        description: 'High performance ceramic brake pads with invalid pricing.',
        priceInCents: 1250.75, // Invalid float
        stock: 5,
        images: [{ url: 'https://cdn.autodock.lk/products/b1.jpg', isPrimary: true }],
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('TC-MOD02-003: Enforces SKU uniqueness per seller store', async () => {
    await request(app)
      .post('/api/v1/seller/products')
      .set('Authorization', `Bearer ${approvedSellerToken}`)
      .send({
        title: 'Brembo Front Brake Pads A',
        sku: 'APX-SAME-SKU',
        partNumber: 'P83071A',
        categoryId: testCategoryId,
        brandId: testBrandId,
        description: 'First product with this SKU.',
        priceInCents: 1000000,
        stock: 10,
        images: [{ url: 'https://cdn.autodock.lk/products/b1.jpg', isPrimary: true }],
      });

    const duplicateRes = await request(app)
      .post('/api/v1/seller/products')
      .set('Authorization', `Bearer ${approvedSellerToken}`)
      .send({
        title: 'Brembo Front Brake Pads B',
        sku: 'APX-SAME-SKU',
        partNumber: 'P83071B',
        categoryId: testCategoryId,
        brandId: testBrandId,
        description: 'Second product with exact same SKU for same seller.',
        priceInCents: 1200000,
        stock: 5,
        images: [{ url: 'https://cdn.autodock.lk/products/b2.jpg', isPrimary: true }],
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.code).toBe('SKU_ALREADY_EXISTS');
  });

  it('TC-MOD02-004: Enforces BR: Pending seller is blocked from creating products', async () => {
    const res = await request(app)
      .post('/api/v1/seller/products')
      .set('Authorization', `Bearer ${pendingSellerToken}`)
      .send({
        title: 'Unapproved Seller Product Listing',
        sku: 'PND-001',
        partNumber: 'PART-001',
        categoryId: testCategoryId,
        brandId: testBrandId,
        description: 'This listing should be rejected because seller is not approved.',
        priceInCents: 500000,
        stock: 5,
        images: [{ url: 'https://cdn.autodock.lk/products/p1.jpg', isPrimary: true }],
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('SELLER_NOT_ELIGIBLE_TO_SELL');
  });

  it('TC-MOD02-005: Strict IDOR Protection: Seller cannot edit or adjust stock of another seller product', async () => {
    // 1. Seller 1 creates product
    const createRes = await request(app)
      .post('/api/v1/seller/products')
      .set('Authorization', `Bearer ${approvedSellerToken}`)
      .send({
        title: 'Seller 1 Proprietary Brake Disc',
        sku: 'APX-DSC-001',
        partNumber: 'BD-100',
        categoryId: testCategoryId,
        brandId: testBrandId,
        description: 'Brake disc belonging to Seller 1.',
        priceInCents: 2000000,
        stock: 8,
        images: [{ url: 'https://cdn.autodock.lk/products/disc.jpg', isPrimary: true }],
      });

    const productId = createRes.body.data.id;

    // 2. Seller 3 attempts to update Seller 1's product
    const updateRes = await request(app)
      .put(`/api/v1/seller/products/${productId}`)
      .set('Authorization', `Bearer ${otherSellerToken}`)
      .send({
        title: 'Malicious Title Tamper',
        priceInCents: 100,
      });

    expect(updateRes.status).toBe(403);
    expect(updateRes.body.code).toBe('PRODUCT_ACCESS_DENIED');

    // 3. Seller 3 attempts to adjust stock of Seller 1's product
    const stockRes = await request(app)
      .patch(`/api/v1/seller/products/${productId}/stock`)
      .set('Authorization', `Bearer ${otherSellerToken}`)
      .send({
        stock: 999,
      });

    expect(stockRes.status).toBe(403);
    expect(stockRes.body.code).toBe('PRODUCT_ACCESS_DENIED');

    // Verify product was untouched
    const untouched = await Product.findById(productId);
    expect(untouched?.priceInCents).toBe(2000000);
    expect(untouched?.stock).toBe(8);
  });

  it('TC-MOD02-006: Public catalogue search, filtering by price, and bounded pagination', async () => {
    // Seed 3 products with different prices
    await Product.create([
      {
        sellerId: new mongoose.Types.ObjectId(approvedSellerId),
        title: 'Budget Organic Brake Pads',
        sku: 'PAD-ORG-01',
        partNumber: 'ORG-01',
        categoryId: new mongoose.Types.ObjectId(testCategoryId),
        brandId: new mongoose.Types.ObjectId(testBrandId),
        condition: 'BRAND_NEW',
        description: 'Standard organic brake pads for daily commuting.',
        priceInCents: 400000, // Rs. 4,000.00
        stock: 10,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/p1.jpg', isPrimary: true }],
      },
      {
        sellerId: new mongoose.Types.ObjectId(approvedSellerId),
        title: 'Premium Semi-Metallic Brake Pads',
        sku: 'PAD-MET-02',
        partNumber: 'MET-02',
        categoryId: new mongoose.Types.ObjectId(testCategoryId),
        brandId: new mongoose.Types.ObjectId(testBrandId),
        condition: 'BRAND_NEW',
        description: 'Semi-metallic high friction pads for heavy braking.',
        priceInCents: 900000, // Rs. 9,000.00
        stock: 5,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/p2.jpg', isPrimary: true }],
      },
      {
        sellerId: new mongoose.Types.ObjectId(approvedSellerId),
        title: 'Ultra Ceramic Carbon Brake Pads',
        sku: 'PAD-CAR-03',
        partNumber: 'CAR-03',
        categoryId: new mongoose.Types.ObjectId(testCategoryId),
        brandId: new mongoose.Types.ObjectId(testBrandId),
        condition: 'BRAND_NEW',
        description: 'Track rated carbon ceramic racing pads.',
        priceInCents: 2500000, // Rs. 25,000.00
        stock: 2,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/p3.jpg', isPrimary: true }],
      },
    ]);

    // Query with price filter: between Rs. 5,000 and Rs. 15,000 (500000 to 1500000 cents)
    const res = await request(app)
      .get('/api/v1/products')
      .query({
        minPriceInCents: 500000,
        maxPriceInCents: 1500000,
        sortBy: 'priceInCents',
        sortOrder: 'asc',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].sku).toBe('PAD-MET-02');
    expect(res.body.meta.pagination.totalRecords).toBe(1);
  });

  it('TC-MOD02-007: Rejects invalid or malicious sort fields', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .query({
        sortBy: 'passwordHash;DROP TABLE',
      });

    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_QUERY_PARAMETERS');
  });

  it('TC-MOD02-008: Admin can create and update categories', async () => {
    const createRes = await request(app)
      .post('/api/v1/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Suspension Systems',
        slug: 'suspension-systems',
        description: 'Shocks, struts, and control arms.',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.slug).toBe('suspension-systems');

    // Public retrieval
    const treeRes = await request(app).get('/api/v1/categories');
    expect(treeRes.status).toBe(200);
    expect(treeRes.body.data.some((c: any) => c.slug === 'suspension-systems')).toBe(true);
  });
});
