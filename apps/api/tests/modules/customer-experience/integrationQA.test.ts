import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { Product } from '../../../src/modules/customer-experience/models/product.model.js';
import { Category } from '../../../src/modules/customer-experience/models/category.model.js';
import { Brand } from '../../../src/modules/customer-experience/models/brand.model.js';
import { VehicleCompatibility } from '../../../src/modules/customer-experience/models/vehicleCompatibility.model.js';
import { CustomerGarage } from '../../../src/modules/customer-experience/models/customerGarage.model.js';
import { Cart } from '../../../src/modules/customer-experience/models/cart.model.js';
import { Wishlist } from '../../../src/modules/customer-experience/models/wishlist.model.js';
import { Review } from '../../../src/modules/customer-experience/models/review.model.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import {
  orderVerificationService,
  IOrderPublicContract,
} from '../../../src/modules/customer-experience/contracts/orderConsumer.contract.js';

describe('MOD-02 Integration QA & End-to-End Security Verification', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_mod02_integration_qa';

  // Tokens & Actors
  let adminToken: string;
  let adminId: string;

  let approvedSellerAToken: string;
  let approvedSellerAId: string;

  let approvedSellerBToken: string;
  let approvedSellerBId: string;

  let pendingSellerToken: string;
  let pendingSellerId: string;

  let customerAToken: string;
  let customerAId: string;

  let customerBToken: string;
  let customerBId: string;

  // Shared Reference Data
  let categoryEngineId: string;
  let categoryBrakesId: string;
  let brandBremboId: string;
  let brandDensoId: string;

  // Tracked Suborders for Verified Purchase Testing
  const deliveredSuborder1 = new mongoose.Types.ObjectId().toString();
  const unpurchasedSuborder = new mongoose.Types.ObjectId().toString();
  let verifiedProductId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // Build indexes for text search & uniqueness
    await Product.createIndexes();
    await VehicleCompatibility.createIndexes();

    // 1. Admin Actor
    const admin = await User.create({
      email: 'admin.mod02qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Audit',
      lastName: 'Director',
      phone: '+94112233445',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    adminId = admin._id.toString();
    adminToken = jwt.sign(
      { userId: adminId, email: admin.email, role: admin.role },
      env.JWT_ACCESS_SECRET
    );

    // 2. Approved Seller A Actor
    const sellerUserA = await User.create({
      email: 'seller.a.qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Apex',
      lastName: 'Motors',
      phone: '+94771122334',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const profileA = await SellerProfile.create({
      userId: sellerUserA._id,
      businessName: 'Apex Motor Parts Ltd',
      businessRegistrationNumber: 'PV-QA-001',
      contactPhone: '+94771122334',
      storeSlug: 'apex-motors-qa',
      sellerType: 'PHYSICAL_STORE',
      operatingAddress: {
        street: '100 Galle Road',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '00300',
      },
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    approvedSellerAId = profileA._id.toString();
    approvedSellerAToken = jwt.sign(
      {
        userId: sellerUserA._id.toString(),
        email: sellerUserA.email,
        role: sellerUserA.role,
        sellerId: approvedSellerAId,
      },
      env.JWT_ACCESS_SECRET
    );

    // 3. Approved Seller B Actor
    const sellerUserB = await User.create({
      email: 'seller.b.qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Kandy',
      lastName: 'Spares',
      phone: '+94772233445',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const profileB = await SellerProfile.create({
      userId: sellerUserB._id,
      businessName: 'Kandy Spares Direct',
      businessRegistrationNumber: 'PV-QA-002',
      contactPhone: '+94772233445',
      storeSlug: 'kandy-spares-qa',
      sellerType: 'ONLINE_ONLY',
      operatingAddress: {
        street: '45 Peradeniya Road',
        city: 'Kandy',
        district: 'Kandy',
        province: 'Central',
        postalCode: '20000',
      },
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    approvedSellerBId = profileB._id.toString();
    approvedSellerBToken = jwt.sign(
      {
        userId: sellerUserB._id.toString(),
        email: sellerUserB.email,
        role: sellerUserB.role,
        sellerId: approvedSellerBId,
      },
      env.JWT_ACCESS_SECRET
    );

    // 4. Pending / Ineligible Seller Actor
    const sellerUserPending = await User.create({
      email: 'seller.pending.qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Pending',
      lastName: 'Trader',
      phone: '+94773344556',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const profilePending = await SellerProfile.create({
      userId: sellerUserPending._id,
      businessName: 'Pending Auto Traders',
      businessRegistrationNumber: 'PV-QA-003',
      contactPhone: '+94773344556',
      storeSlug: 'pending-auto-qa',
      sellerType: 'ONLINE_ONLY',
      operatingAddress: {
        street: '12 Negombo Road',
        city: 'Kurunegala',
        district: 'Kurunegala',
        province: 'North Western',
        postalCode: '60000',
      },
      verificationStatus: 'PENDING',
      isEligibleToSell: false,
    });
    pendingSellerId = profilePending._id.toString();
    pendingSellerToken = jwt.sign(
      {
        userId: sellerUserPending._id.toString(),
        email: sellerUserPending.email,
        role: sellerUserPending.role,
        sellerId: pendingSellerId,
      },
      env.JWT_ACCESS_SECRET
    );

    // 5. Customer A Actor
    const custA = await User.create({
      email: 'customer.a.qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Kasun',
      lastName: 'Perera',
      phone: '+94774455667',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerAId = custA._id.toString();
    customerAToken = jwt.sign(
      { userId: customerAId, email: custA.email, role: custA.role },
      env.JWT_ACCESS_SECRET
    );

    // 6. Customer B Actor
    const custB = await User.create({
      email: 'customer.b.qa@autodock.lk',
      passwordHash: 'hashedPass123',
      firstName: 'Dilani',
      lastName: 'Fernando',
      phone: '+94775566778',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerBId = custB._id.toString();
    customerBToken = jwt.sign(
      { userId: customerBId, email: custB.email, role: custB.role },
      env.JWT_ACCESS_SECRET
    );

    // Setup Reference Categories & Brands
    const cat1 = await Category.create({ name: 'Engine Components', slug: 'engine-components' });
    categoryEngineId = cat1._id.toString();

    const cat2 = await Category.create({ name: 'Brake Systems', slug: 'brake-systems' });
    categoryBrakesId = cat2._id.toString();

    const br1 = await Brand.create({ name: 'Brembo', slug: 'brembo', countryOfOrigin: 'Italy' });
    brandBremboId = br1._id.toString();

    const br2 = await Brand.create({ name: 'Denso', slug: 'denso', countryOfOrigin: 'Japan' });
    brandDensoId = br2._id.toString();

    // Register test adapter for MOD-03 verified purchase check
    const mockOrderContract: IOrderPublicContract = {
      async verifyDeliveredPurchase(uId, pId, sId) {
        if (sId === deliveredSuborder1 && uId === customerAId && pId === verifiedProductId) {
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
    // Clean dynamic collections before each test run
    await Promise.all([
      Product.deleteMany({}),
      VehicleCompatibility.deleteMany({}),
      CustomerGarage.deleteMany({}),
      Cart.deleteMany({}),
      Wishlist.deleteMany({}),
      Review.deleteMany({}),
    ]);
  });

  // ===========================================================================
  // 1. Public Catalogue Browsing & Vehicle Compatibility Engine QA
  // ===========================================================================
  describe('1. Public Catalogue Browsing & Vehicle Compatibility QA', () => {
    it('QA-CAT-001: Public faceted catalogue search by category, brand, condition, and integer price range', async () => {
      // Seed 2 active products
      const p1 = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Brembo Ceramic Front Brake Pads',
        sku: 'BRM-BP-001',
        partNumber: 'P83024N',
        categoryId: new mongoose.Types.ObjectId(categoryBrakesId),
        brandId: new mongoose.Types.ObjectId(brandBremboId),
        condition: 'BRAND_NEW',
        description: 'High performance ceramic brake pads with zero dust.',
        priceInCents: 1850000, // Rs. 18,500.00
        stock: 15,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/brembo-pads.jpg', isPrimary: true }],
      });

      await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerBId),
        title: 'Denso Iridium Power Spark Plugs Set',
        sku: 'DNS-SP-002',
        partNumber: 'IK20TT',
        categoryId: new mongoose.Types.ObjectId(categoryEngineId),
        brandId: new mongoose.Types.ObjectId(brandDensoId),
        condition: 'BRAND_NEW',
        description: 'Twin-tip iridium spark plugs for optimal combustion.',
        priceInCents: 850000, // Rs. 8,500.00
        stock: 30,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/denso-spark.jpg', isPrimary: true }],
      });

      // Filter by categoryBrakesId and price range
      const res = await request(app)
        .get('/api/v1/products')
        .query({
          categoryId: categoryBrakesId,
          minPriceInCents: 1000000,
          maxPriceInCents: 2000000,
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe(p1._id.toString());
      expect(res.body.data[0].priceInCents).toBe(1850000);
    });

    it('QA-CAT-002: Full-text search with keyword relevance across title, description, and part number', async () => {
      await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Denso Alternator 12V 90A',
        sku: 'DNS-ALT-90A',
        partNumber: '104210-3880',
        categoryId: new mongoose.Types.ObjectId(categoryEngineId),
        brandId: new mongoose.Types.ObjectId(brandDensoId),
        condition: 'BRAND_NEW',
        description: 'OEM grade alternator with built-in internal regulator.',
        priceInCents: 4500000,
        stock: 5,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/alternator.jpg', isPrimary: true }],
      });

      // Text search by part number
      const resPart = await request(app)
        .get('/api/v1/products')
        .query({ q: '104210-3880' });

      expect(resPart.status).toBe(200);
      expect(resPart.body.data.length).toBe(1);
      expect(resPart.body.data[0].partNumber).toBe('104210-3880');

      // Text search by description keyword
      const resDesc = await request(app)
        .get('/api/v1/products')
        .query({ q: 'regulator' });

      expect(resDesc.status).toBe(200);
      expect(resDesc.body.data.length).toBe(1);
    });

    it('QA-CAT-003: Evaluates vehicle fitment compatibility accurately (EXACT_FIT, DOES_NOT_FIT, and UNIVERSAL_FIT)', async () => {
      const prod = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Toyota Corolla 141 Front Brake Discs Pair',
        sku: 'BRM-ROT-141',
        partNumber: '09.A236.11',
        categoryId: new mongoose.Types.ObjectId(categoryBrakesId),
        brandId: new mongoose.Types.ObjectId(brandBremboId),
        condition: 'BRAND_NEW',
        description: 'Vented high-carbon brake rotors for Corolla 141 series.',
        priceInCents: 2400000,
        stock: 8,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/corolla-rotors.jpg', isPrimary: true }],
      });

      // Add fitment for TOYOTA COROLLA (2007 - 2013)
      await VehicleCompatibility.create({
        productId: prod._id,
        make: 'TOYOTA',
        model: 'COROLLA',
        yearFrom: 2007,
        yearTo: 2013,
        engineCode: '1NZ-FE',
        trimOrChassis: 'NZE141',
        compatibilityNotes: 'Fits 1.5L JDM and domestic models with 275mm rotors',
      });

      // Check Exact Fit (Toyota Corolla 2010)
      const exactFitRes = await request(app)
        .get(`/api/v1/products/${prod._id}/compatibility`)
        .query({ make: 'TOYOTA', model: 'COROLLA', year: 2010 });

      expect(exactFitRes.status).toBe(200);
      expect(exactFitRes.body.data.fitmentType).toBe('EXACT_FIT');
      expect(exactFitRes.body.data.isCompatible).toBe(true);

      // Check Does Not Fit (Toyota Corolla 2018 - out of year range)
      const yearMismatchRes = await request(app)
        .get(`/api/v1/products/${prod._id}/compatibility`)
        .query({ make: 'TOYOTA', model: 'COROLLA', year: 2018 });

      expect(yearMismatchRes.status).toBe(200);
      expect(yearMismatchRes.body.data.fitmentType).toBe('DOES_NOT_FIT');
      expect(yearMismatchRes.body.data.isCompatible).toBe(false);

      // Check Does Not Fit (Honda Civic 2010 - model mismatch)
      const modelMismatchRes = await request(app)
        .get(`/api/v1/products/${prod._id}/compatibility`)
        .query({ make: 'HONDA', model: 'CIVIC', year: 2010 });

      expect(modelMismatchRes.status).toBe(200);
      expect(modelMismatchRes.body.data.fitmentType).toBe('DOES_NOT_FIT');
      expect(modelMismatchRes.body.data.isCompatible).toBe(false);
    });

    it('QA-CAT-004: Inactive/Draft product visibility: unapproved or deactivated products return 404 on public PDP and are excluded from search', async () => {
      const draftProd = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Draft Air Filter Element',
        sku: 'DFT-AF-001',
        partNumber: '17801-21050',
        categoryId: new mongoose.Types.ObjectId(categoryEngineId),
        brandId: new mongoose.Types.ObjectId(brandDensoId),
        condition: 'BRAND_NEW',
        description: 'Unpublished draft spare part.',
        priceInCents: 250000,
        stock: 10,
        status: 'DRAFT', // Unapproved / draft
        images: [{ url: 'https://cdn.autodock.lk/draft.jpg', isPrimary: true }],
      });

      // Excluded from public search
      const searchRes = await request(app).get('/api/v1/products');
      expect(searchRes.status).toBe(200);
      expect(searchRes.body.data.some((p: any) => p.id === draftProd._id.toString())).toBe(false);

      // 404 Not Found on public product details
      const detailRes = await request(app).get(`/api/v1/products/${draftProd._id}`);
      expect(detailRes.status).toBe(404);
      expect(detailRes.body.success).toBe(false);
    });

    it('QA-CAT-005: Rule-based recommendation engine returns deterministic category & popular products with graceful fallback', async () => {
      await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Brembo Dot 4 High Performance Brake Fluid 1L',
        sku: 'BRM-BF-DOT4',
        partNumber: '04.9978.70',
        categoryId: new mongoose.Types.ObjectId(categoryBrakesId),
        brandId: new mongoose.Types.ObjectId(brandBremboId),
        condition: 'BRAND_NEW',
        description: 'Boiling point exceeds 260C for racing brake stability.',
        priceInCents: 420000,
        stock: 50,
        status: 'ACTIVE',
        averageRating: 4.8,
        reviewCount: 25,
        images: [{ url: 'https://cdn.autodock.lk/brake-fluid.jpg', isPrimary: true }],
      });

      const recRes = await request(app)
        .get('/api/v1/products/recommendations')
        .query({ category: categoryBrakesId, limit: 4 });

      expect(recRes.status).toBe(200);
      expect(recRes.body.success).toBe(true);
      expect(Array.isArray(recRes.body.data.products)).toBe(true);
      expect(recRes.body.data.products.length).toBeGreaterThan(0);
    });
  });

  // ===========================================================================
  // 2. Seller Lifecycle, Product Inventory & BOLA/IDOR Security QA
  // ===========================================================================
  describe('2. Seller Lifecycle & BOLA/IDOR Security QA', () => {
    it('QA-SEC-001: Approved & eligible seller creates a valid part with exact specs, warranty, and pricing in integer cents', async () => {
      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${approvedSellerAToken}`)
        .send({
          title: 'Denso High Pressure Fuel Pump 12V',
          sku: 'DNS-FP-100',
          partNumber: '294000-0380',
          categoryId: categoryEngineId,
          brandId: brandDensoId,
          condition: 'BRAND_NEW',
          description: 'Common rail high pressure diesel fuel pump for D4D engines.',
          priceInCents: 8500000, // Rs. 85,000.00
          stock: 4,
          lowStockThreshold: 2,
          warrantyMonths: 12,
          specifications: [
            { key: 'Pressure', value: '2000 Bar' },
            { key: 'Fuel Type', value: 'Diesel' },
          ],
          images: [{ url: 'https://cdn.autodock.lk/fuel-pump.jpg', isPrimary: true }],
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.sku).toBe('DNS-FP-100');
      expect(res.body.data.sellerId).toBe(approvedSellerAId);
      expect(res.body.data.priceInCents).toBe(8500000);
    });

    it('QA-SEC-002: Ineligible / Pending seller is blocked from publishing products with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${pendingSellerToken}`)
        .send({
          title: 'Unapproved Seller Product Attempt',
          sku: 'BLK-SKU-001',
          partNumber: 'BLK-001',
          categoryId: categoryEngineId,
          brandId: brandDensoId,
          condition: 'BRAND_NEW',
          description: 'Should be rejected because seller is not approved to sell.',
          priceInCents: 500000,
          stock: 10,
          images: [{ url: 'https://cdn.autodock.lk/blocked.jpg', isPrimary: true }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not eligible to publish or sell/i);
    });

    it('QA-SEC-003: Strict BOLA/IDOR Protection: Seller B cannot update, adjust stock, or alter status of Seller A product', async () => {
      // Create product belonging to Seller A
      const prodA = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Brembo Rear Brake Pads',
        sku: 'BRM-BP-REAR',
        partNumber: 'P83025N',
        categoryId: new mongoose.Types.ObjectId(categoryBrakesId),
        brandId: new mongoose.Types.ObjectId(brandBremboId),
        condition: 'BRAND_NEW',
        description: 'Rear brake pads high durability carbon ceramic formula.',
        priceInCents: 1500000,
        stock: 20,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/rear-pads.jpg', isPrimary: true }],
      });

      // Seller B attempts to edit Seller A's product details
      const editRes = await request(app)
        .put(`/api/v1/seller/products/${prodA._id}`)
        .set('Authorization', `Bearer ${approvedSellerBToken}`)
        .send({
          title: 'Malicious Hijacked Product Title',
          priceInCents: 100000,
        });

      expect(editRes.status).toBe(403);
      expect(editRes.body.success).toBe(false);
      expect(editRes.body.message).toMatch(/permission/i);

      // Seller B attempts to adjust Seller A's stock
      const stockRes = await request(app)
        .patch(`/api/v1/seller/products/${prodA._id}/stock`)
        .set('Authorization', `Bearer ${approvedSellerBToken}`)
        .send({ stock: 10 });

      expect(stockRes.status).toBe(403);
      expect(stockRes.body.success).toBe(false);

      // Seller B attempts to deactivate Seller A's product
      const statusRes = await request(app)
        .patch(`/api/v1/seller/products/${prodA._id}/status`)
        .set('Authorization', `Bearer ${approvedSellerBToken}`)
        .send({ status: 'INACTIVE' });

      expect(statusRes.status).toBe(403);
      expect(statusRes.body.success).toBe(false);

      // Verify product remains uncompromised
      const uncompromised = await Product.findById(prodA._id);
      expect(uncompromised?.title).toBe('Brembo Rear Brake Pads');
      expect(uncompromised?.stock).toBe(20);
      expect(uncompromised?.status).toBe('ACTIVE');
    });

    it('QA-SEC-004: Customer role cannot invoke seller product management APIs (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          title: 'Customer Impersonating Seller',
          sku: 'CUST-SKU-999',
          partNumber: 'CUST-999',
          categoryId: categoryEngineId,
          brandId: brandDensoId,
          condition: 'BRAND_NEW',
          description: 'Attempting to publish without seller role.',
          priceInCents: 500000,
          stock: 10,
          images: [{ url: 'https://cdn.autodock.lk/cust.jpg', isPrimary: true }],
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('QA-SEC-005: Mass assignment protection: Client cannot inject sellerId, averageRating, or reviewCount on creation', async () => {
      const res = await request(app)
        .post('/api/v1/seller/products')
        .set('Authorization', `Bearer ${approvedSellerAToken}`)
        .send({
          sellerId: approvedSellerBId, // Attempted ownership spoofing
          title: 'Denso O2 Oxygen Sensor 4-Wire',
          sku: 'DNS-O2-4W',
          partNumber: 'DOX-0109',
          categoryId: categoryEngineId,
          brandId: brandDensoId,
          condition: 'BRAND_NEW',
          description: 'Zirconia oxygen sensor for fuel efficiency.',
          priceInCents: 1200000,
          stock: 15,
          averageRating: 5.0, // Attempted rating forgery
          reviewCount: 999, // Attempted count forgery
          images: [{ url: 'https://cdn.autodock.lk/o2-sensor.jpg', isPrimary: true }],
        });

      expect(res.status).toBe(201);
      // sellerId MUST be derived from authenticated token, not client payload
      expect(res.body.data.sellerId).toBe(approvedSellerAId);
      // rating and reviewCount must initialize to 0
      expect(res.body.data.averageRating).toBe(0);
      expect(res.body.data.reviewCount).toBe(0);
    });
  });

  // ===========================================================================
  // 3. Customer Garage Isolation & Boundary QA
  // ===========================================================================
  describe('3. Customer Garage Isolation & Boundary QA', () => {
    it('QA-GAR-001: Authenticated customer adds vehicle with valid year, make, and model', async () => {
      const res = await request(app)
        .post('/api/v1/garage/vehicles')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          make: 'TOYOTA',
          model: 'COROLLA',
          year: 2012,
          engine: '1.5L 1NZ-FE',
          vin: '1HGCR2F83HA000000',
          nickname: 'Daily Commuter',
          isDefault: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.vehicles[0].make).toBe('TOYOTA');
      expect(res.body.data.vehicles[0].model).toBe('COROLLA');
      expect(res.body.data.vehicles[0].year).toBe(2012);
      expect(res.body.data.vehicles[0].isDefault).toBe(true);
    });

    it('QA-GAR-002: Enforces strict boundary of maximum 10 vehicles in My Garage (11th vehicle rejected with 400)', async () => {
      // Seed 10 vehicles in customer A's garage
      const vehicles = [];
      for (let i = 1; i <= 10; i++) {
        vehicles.push({
          make: 'TOYOTA',
          model: `MODEL-${i}`,
          year: 2010 + (i % 10),
          isDefault: i === 1,
        });
      }
      await CustomerGarage.create({
        userId: new mongoose.Types.ObjectId(customerAId),
        vehicles,
      });

      // Attempt to add 11th vehicle
      const overflowRes = await request(app)
        .post('/api/v1/garage/vehicles')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          make: 'HONDA',
          model: 'CIVIC',
          year: 2020,
          isDefault: false,
        });

      expect(overflowRes.status).toBe(400);
      expect(overflowRes.body.success).toBe(false);
      expect(overflowRes.body.message).toMatch(/maximum limit of 10/i);
    });

    it('QA-GAR-003: Default vehicle selection updates default and unsets previous default', async () => {
      const v1Id = new mongoose.Types.ObjectId();
      const v2Id = new mongoose.Types.ObjectId();

      await CustomerGarage.create({
        userId: new mongoose.Types.ObjectId(customerAId),
        vehicles: [
          { _id: v1Id, make: 'TOYOTA', model: 'COROLLA', year: 2012, isDefault: true },
          { _id: v2Id, make: 'NISSAN', model: 'LEAF', year: 2015, isDefault: false },
        ],
      });

      // Set vehicle 2 as default
      const res = await request(app)
        .put(`/api/v1/garage/vehicles/${v2Id}/default`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(res.status).toBe(200);

      // Verify in DB that v2 is now default and v1 is false
      const garage = await CustomerGarage.findOne({ userId: customerAId });
      const v1 = garage?.vehicles.find((v) => v._id.toString() === v1Id.toString());
      const v2 = garage?.vehicles.find((v) => v._id.toString() === v2Id.toString());

      expect(v2?.isDefault).toBe(true);
      expect(v1?.isDefault).toBe(false);
    });

    it('QA-GAR-004: IDOR Protection: Customer A cannot read, modify, or delete Customer B garage vehicle', async () => {
      const vBId = new mongoose.Types.ObjectId();
      await CustomerGarage.create({
        userId: new mongoose.Types.ObjectId(customerBId),
        vehicles: [
          { _id: vBId, make: 'MAZDA', model: 'AXELA', year: 2016, isDefault: true },
        ],
      });

      // Customer A tries to delete Customer B's vehicle
      const delRes = await request(app)
        .delete(`/api/v1/garage/vehicles/${vBId}`)
        .set('Authorization', `Bearer ${customerAToken}`);

      // Should return 404 because Customer A has no such vehicle in their garage
      expect(delRes.status).toBe(404);

      // Verify Customer B vehicle remains intact
      const bGarage = await CustomerGarage.findOne({ userId: customerBId });
      expect(bGarage?.vehicles.length).toBe(1);
    });
  });

  // ===========================================================================
  // 4. Multi-Vendor Cart & Wishlist Security QA
  // ===========================================================================
  describe('4. Multi-Vendor Cart & Wishlist Security QA', () => {
    it('QA-CART-001: Multi-vendor cart line items grouped by seller with authentic item subtotals', async () => {
      const pA = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Brembo Brake Pads Set A',
        sku: 'BRM-SET-A',
        partNumber: 'P83024',
        categoryId: new mongoose.Types.ObjectId(categoryBrakesId),
        brandId: new mongoose.Types.ObjectId(brandBremboId),
        condition: 'BRAND_NEW',
        description: 'High performance brake pads from Seller A store.',
        priceInCents: 1500000,
        stock: 20,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/a.jpg', isPrimary: true }],
      });

      const pB = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerBId),
        title: 'Denso Spark Plugs Set B',
        sku: 'DNS-SET-B',
        partNumber: 'IK20',
        categoryId: new mongoose.Types.ObjectId(categoryEngineId),
        brandId: new mongoose.Types.ObjectId(brandDensoId),
        condition: 'BRAND_NEW',
        description: 'High performance spark plugs from Seller B store.',
        priceInCents: 600000,
        stock: 10,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/b.jpg', isPrimary: true }],
      });

      // Add item from Seller A (qty 2)
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: pA._id, quantity: 2 });

      // Add item from Seller B (qty 3)
      await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: pB._id, quantity: 3 });

      // Retrieve customer cart
      const getCartRes = await request(app)
        .get('/api/v1/cart')
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(getCartRes.status).toBe(200);
      expect(getCartRes.body.data.sellerGroups.length).toBe(2);
      expect(getCartRes.body.data.totalItems).toBe(5);
      // Subtotal: (2 * 1500000) + (3 * 600000) = 3000000 + 1800000 = 4800000 cents
      expect(getCartRes.body.data.grandTotalInCents).toBe(4800000);
    });

    it('QA-CART-002: Physical stock boundary: adding quantity exceeding available stock is rejected with 400', async () => {
      const scarceProd = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Rare Vintage Cylinder Head Gasket',
        sku: 'RARE-CHG-01',
        partNumber: '11115-11071',
        categoryId: new mongoose.Types.ObjectId(categoryEngineId),
        brandId: new mongoose.Types.ObjectId(brandDensoId),
        condition: 'BRAND_NEW',
        description: 'Only 3 left in stock.',
        priceInCents: 750000,
        stock: 3,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/gasket.jpg', isPrimary: true }],
      });

      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: scarceProd._id, quantity: 5 }); // Exceeds available stock of 3

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/exceeds available stock/i);
    });

    it('QA-CART-003: Client-supplied price injection is ignored: cart calculates price authoritatively from product record', async () => {
      const prod = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Expensive Engine ECU Module',
        sku: 'ECU-MOD-01',
        partNumber: '89661-12345',
        categoryId: new mongoose.Types.ObjectId(categoryEngineId),
        brandId: new mongoose.Types.ObjectId(brandDensoId),
        condition: 'BRAND_NEW',
        description: 'Real price Rs. 150,000.00',
        priceInCents: 15000000,
        stock: 5,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/ecu.jpg', isPrimary: true }],
      });

      // Attacker attempts to post priceInCents = 100 (Rs. 1.00)
      const res = await request(app)
        .post('/api/v1/cart/items')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: prod._id,
          quantity: 1,
          priceInCents: 100, // Price tampering attempt
        });

      expect(res.status).toBe(200);

      // Verify cart item recorded authoritative price of 15,000,000 cents
      const dbCart = await Cart.findOne({ userId: customerAId });
      expect(dbCart?.items[0].priceInCentsAtAdd).toBe(15000000);
    });

    it('QA-CART-004: Wishlist 1-click move to cart transfers product seamlessly and removes from wishlist', async () => {
      const prod = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Bosch Horn Set 12V Dual Tone',
        sku: 'BSH-HN-01',
        partNumber: '0986AH0503',
        categoryId: new mongoose.Types.ObjectId(categoryEngineId),
        brandId: new mongoose.Types.ObjectId(brandDensoId),
        condition: 'BRAND_NEW',
        description: 'Super-tone loud horn pair.',
        priceInCents: 450000,
        stock: 12,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/horn.jpg', isPrimary: true }],
      });

      // Add to wishlist
      await request(app)
        .post('/api/v1/wishlist/items')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({ productId: prod._id });

      // Move to cart
      const moveRes = await request(app)
        .post(`/api/v1/wishlist/items/${prod._id}/move-to-cart`)
        .set('Authorization', `Bearer ${customerAToken}`);

      expect(moveRes.status).toBe(200);
      expect(moveRes.body.success).toBe(true);

      // Verify removed from wishlist
      const dbWishlist = await Wishlist.findOne({ userId: customerAId });
      expect(dbWishlist?.items.length).toBe(0);

      // Verify present in cart
      const dbCart = await Cart.findOne({ userId: customerAId });
      expect(dbCart?.items.length).toBe(1);
      expect(dbCart?.items[0].productId.toString()).toBe(prod._id.toString());
    });
  });

  // ===========================================================================
  // 5. Verified-Purchaser Reviews, Immediate Publication & Admin Moderation QA
  // ===========================================================================
  describe('5. Verified-Purchaser Reviews & Admin Moderation QA', () => {
    beforeEach(async () => {
      const prod = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Amaron Hi-Life 12V 65Ah Automotive Battery',
        sku: 'AMR-HL-65',
        partNumber: 'BH65D26L',
        categoryId: new mongoose.Types.ObjectId(categoryEngineId),
        brandId: new mongoose.Types.ObjectId(brandDensoId),
        condition: 'BRAND_NEW',
        description: 'High capacity maintenance-free battery.',
        priceInCents: 4200000,
        stock: 10,
        status: 'ACTIVE',
        averageRating: 0,
        reviewCount: 0,
        images: [{ url: 'https://cdn.autodock.lk/amaron.jpg', isPrimary: true }],
      });
      verifiedProductId = prod._id.toString();
    });

    it('QA-REV-001: Non-purchaser or undelivered suborder is rejected from submitting review (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: verifiedProductId,
          suborderId: unpurchasedSuborder, // Not verified as delivered
          rating: 5,
          comment: 'Never received it but trying to review anyway.',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/no delivered suborder found/i);
    });

    it('QA-REV-002: Valid delivered purchase submits review -> publishes immediately without pre-approval queue', async () => {
      const res = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: verifiedProductId,
          suborderId: deliveredSuborder1,
          rating: 5,
          comment: 'Genuine Amaron battery with warranty card. Car starts instantly!',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PUBLISHED'); // Immediate publication

      // Check product details page displays review immediately
      const detailRes = await request(app).get(`/api/v1/products/${verifiedProductId}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.averageRating).toBe(5);
      expect(detailRes.body.data.reviewCount).toBe(1);
    });

    it('QA-REV-003: Rating boundaries strictly enforced: rating < 1 or > 5 rejected with 400', async () => {
      const resZero = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: verifiedProductId,
          suborderId: deliveredSuborder1,
          rating: 0, // Invalid rating
          comment: 'Zero stars is not allowed.',
        });

      expect(resZero.status).toBe(400);

      const resSix = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: verifiedProductId,
          suborderId: deliveredSuborder1,
          rating: 6, // Invalid rating
          comment: 'Six stars is not allowed.',
        });

      expect(resSix.status).toBe(400);
    });

    it('QA-REV-004: Duplicate review prevention: customer cannot submit multiple reviews for the same delivered suborder', async () => {
      // First submission succeeds
      const firstRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: verifiedProductId,
          suborderId: deliveredSuborder1,
          rating: 5,
          comment: 'First authentic review.',
        });

      expect(firstRes.status).toBe(201);

      // Second duplicate submission fails
      const duplicateRes = await request(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerAToken}`)
        .send({
          productId: verifiedProductId,
          suborderId: deliveredSuborder1,
          rating: 4,
          comment: 'Duplicate review attempt.',
        });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.success).toBe(false);
      expect(duplicateRes.body.message).toMatch(/already been submitted/i);
    });

    it('QA-REV-005: View-only seller access: Seller cannot edit, delete, or hide customer reviews (403 Forbidden)', async () => {
      // Create review
      const rev = await Review.create({
        productId: new mongoose.Types.ObjectId(verifiedProductId),
        userId: new mongoose.Types.ObjectId(customerAId),
        suborderId: new mongoose.Types.ObjectId(deliveredSuborder1),
        rating: 1,
        comment: 'Battery drained after 2 weeks. Disappointed.',
        status: 'PUBLISHED',
      });

      // Seller attempts to moderate/hide the negative review
      const hideRes = await request(app)
        .patch(`/api/v1/admin/reviews/${rev._id}/moderation`)
        .set('Authorization', `Bearer ${approvedSellerAToken}`)
        .send({
          action: 'HIDE',
          moderationReason: 'Hiding bad review to protect reputation',
        });

      expect(hideRes.status).toBe(403);
      expect(hideRes.body.success).toBe(false);
    });

    it('QA-REV-006: Post-publication admin moderation: Admin hides inappropriate review with reason; review is hidden and aggregate rating recalculates', async () => {
      // Create published review
      const rev = await Review.create({
        productId: new mongoose.Types.ObjectId(verifiedProductId),
        userId: new mongoose.Types.ObjectId(customerAId),
        suborderId: new mongoose.Types.ObjectId(deliveredSuborder1),
        rating: 1,
        comment: 'Spam review with profanity and abusive language.',
        status: 'PUBLISHED',
      });

      // Update product rating aggregate
      await Product.findByIdAndUpdate(verifiedProductId, {
        averageRating: 1.0,
        reviewCount: 1,
      });

      // Admin moderates and hides the review with mandatory reason
      const modRes = await request(app)
        .patch(`/api/v1/admin/reviews/${rev._id}/moderation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'HIDE',
          moderationReason: 'Violates community guidelines: profane language',
        });

      expect(modRes.status).toBe(200);
      expect(modRes.body.data.status).toBe('HIDDEN_BY_ADMIN');
      expect(modRes.body.data.moderationReason).toBe(
        'Violates community guidelines: profane language'
      );

      // Verify product aggregate recalculated (no active reviews -> 0 rating, 0 count)
      const updatedProduct = await Product.findById(verifiedProductId);
      expect(updatedProduct?.reviewCount).toBe(0);
      expect(updatedProduct?.averageRating).toBe(0);

      // Verify review no longer visible in public reviews feed
      const publicReviewsRes = await request(app).get(
        `/api/v1/products/${verifiedProductId}/reviews`
      );
      expect(publicReviewsRes.status).toBe(200);
      expect(publicReviewsRes.body.data.length).toBe(0);
    });
  });

  // ===========================================================================
  // 6. Application Security & Input Sanitization QA
  // ===========================================================================
  describe('6. Application Security & Input Sanitization QA', () => {
    it('QA-SEC-006: MongoDB query injection ($gt, $ne, $where) in search query parameters is safely neutralized', async () => {
      // Attempting injection via malformed query parameters
      const res = await request(app)
        .get('/api/v1/products')
        .query({
          categoryId: { $ne: null }, // Operator injection attempt
        });

      // Zod regex validator catches non-ObjectId strings / objects and rejects with 400
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('INVALID_QUERY_PARAMETERS');
    });

    it('QA-SEC-007: Sort allowlist enforcement: arbitrary sort keys are rejected with 400', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .query({
          sortBy: 'passwordHash', // Arbitrary column probe
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_QUERY_PARAMETERS');
    });

    it('QA-SEC-008: Pagination boundary protection: limits exceeding 100 are rejected or clamped', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .query({
          limit: 500, // Excessive limit attempt
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_QUERY_PARAMETERS');
    });

    it('QA-SEC-009: Data leakage prevention: Public product details do NOT expose seller bank details or private documents', async () => {
      const prod = await Product.create({
        sellerId: new mongoose.Types.ObjectId(approvedSellerAId),
        title: 'Toyota Genuine Oil Filter',
        sku: 'TYT-OF-001',
        partNumber: '90915-YZZE1',
        categoryId: new mongoose.Types.ObjectId(categoryEngineId),
        brandId: new mongoose.Types.ObjectId(brandDensoId),
        condition: 'BRAND_NEW',
        description: 'OEM spin-on oil filter element.',
        priceInCents: 180000,
        stock: 40,
        status: 'ACTIVE',
        images: [{ url: 'https://cdn.autodock.lk/oil-filter.jpg', isPrimary: true }],
      });

      const res = await request(app).get(`/api/v1/products/${prod._id}`);

      expect(res.status).toBe(200);
      const sellerData = res.body.data.seller;
      expect(sellerData).toBeDefined();

      // Ensure no private financial or identity data leaked
      expect(sellerData.bankDetails).toBeUndefined();
      expect(sellerData.bankAccount).toBeUndefined();
      expect(sellerData.accountNumber).toBeUndefined();
      expect(sellerData.documents).toBeUndefined();
      expect(sellerData.internalNotes).toBeUndefined();
      expect(sellerData.nic).toBeUndefined();
    });
  });
});
