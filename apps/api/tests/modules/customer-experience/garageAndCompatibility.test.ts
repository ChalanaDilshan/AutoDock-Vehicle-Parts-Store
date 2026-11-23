import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { Product } from '../../../src/modules/customer-experience/models/product.model.js';
import { Category } from '../../../src/modules/customer-experience/models/category.model.js';
import { Brand } from '../../../src/modules/customer-experience/models/brand.model.js';
import { CustomerGarage } from '../../../src/modules/customer-experience/models/customerGarage.model.js';
import { VehicleCompatibility } from '../../../src/modules/customer-experience/models/vehicleCompatibility.model.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';

describe('MOD-02 Vehicle Fitment & My Garage Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_garage';

  let customerToken: string;
  let customerId: string;
  let sellerToken: string;
  let sellerId: string;
  let testProductId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // Setup Customer
    const customer = await User.create({
      email: 'customer.garage@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Garage',
      lastName: 'Owner',
      phone: '+94771239876',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerId = customer._id.toString();
    customerToken = jwt.sign(
      { userId: customerId, email: customer.email, role: customer.role },
      env.JWT_ACCESS_SECRET
    );

    // Setup Approved Seller
    const seller = await User.create({
      email: 'seller.garage@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Seller',
      lastName: 'Garage',
      phone: '+94775556677',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const profile = await SellerProfile.create({
      userId: seller._id,
      businessName: 'Fitment Pro Parts',
      businessRegistrationNumber: 'PV-99999',
      contactPhone: '+94775556677',
      storeSlug: 'fitment-pro',
      sellerType: 'ONLINE_ONLY',
      operatingAddress: {
        street: '10 Port Road',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '00100',
      },
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    sellerId = profile._id.toString();
    sellerToken = jwt.sign(
      { userId: seller._id.toString(), email: seller.email, role: seller.role, sellerId },
      env.JWT_ACCESS_SECRET
    );

    const cat = await Category.create({ name: 'Air Filters', slug: 'air-filters' });
    const brand = await Brand.create({ name: 'Denso', slug: 'denso' });

    const prod = await Product.create({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      title: 'Denso High Flow Air Filter',
      sku: 'DNS-AF-01',
      partNumber: '17801-21050',
      categoryId: cat._id,
      brandId: brand._id,
      condition: 'BRAND_NEW',
      description: 'Factory replacement air filter for Toyota passenger cars.',
      priceInCents: 450000,
      stock: 20,
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/af.jpg', isPrimary: true }],
    });
    testProductId = prod._id.toString();

    // Add compatibility for Toyota Corolla 2012-2018
    await VehicleCompatibility.create({
      productId: prod._id,
      make: 'TOYOTA',
      model: 'COROLLA',
      yearFrom: 2012,
      yearTo: 2018,
      engineCode: '1NZ-FE',
      compatibilityNotes: 'Fits all 1.5L Axio and Fielder models.',
    });
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await CustomerGarage.deleteMany({});
  });

  it('TC-MOD02-009: Checks compatibility: Exact fit within year range, Does not fit outside range', async () => {
    // 1. Within range: 2016 Corolla
    const fitRes = await request(app)
      .get(`/api/v1/products/${testProductId}/compatibility`)
      .query({ make: 'TOYOTA', model: 'COROLLA', year: 2016 });

    expect(fitRes.status).toBe(200);
    expect(fitRes.body.data.isCompatible).toBe(true);
    expect(fitRes.body.data.fitmentType).toBe('EXACT_FIT');

    // 2. Outside range: 2022 Corolla
    const noFitRes = await request(app)
      .get(`/api/v1/products/${testProductId}/compatibility`)
      .query({ make: 'TOYOTA', model: 'COROLLA', year: 2022 });

    expect(noFitRes.status).toBe(200);
    expect(noFitRes.body.data.isCompatible).toBe(false);
    expect(noFitRes.body.data.fitmentType).toBe('DOES_NOT_FIT');
  });

  it('TC-MOD02-010: Allows authenticated customer to add vehicle to My Garage and set default', async () => {
    const res = await request(app)
      .post('/api/v1/garage/vehicles')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        make: 'TOYOTA',
        model: 'COROLLA',
        year: 2016,
        engine: '1.5L 1NZ-FE',
        nickname: 'Daily Driver Axio',
        isDefault: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.vehicles.length).toBe(1);
    expect(res.body.data.vehicles[0].make).toBe('TOYOTA');
    expect(res.body.data.vehicles[0].isDefault).toBe(true);
  });

  it('TC-MOD02-011: Enforces maximum limit of 10 vehicles in My Garage', async () => {
    // Pre-populate garage with 10 vehicles
    const vehicles = Array.from({ length: 10 }, (_, i) => ({
      _id: new mongoose.Types.ObjectId(),
      make: 'TOYOTA',
      model: `MODEL-${i}`,
      year: 2010 + i,
      isDefault: i === 0,
    }));

    await CustomerGarage.create({
      userId: new mongoose.Types.ObjectId(customerId),
      vehicles,
    });

    // Attempt to add 11th vehicle
    const overflowRes = await request(app)
      .post('/api/v1/garage/vehicles')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        make: 'HONDA',
        model: 'CIVIC',
        year: 2018,
      });

    expect(overflowRes.status).toBe(400);
    expect(overflowRes.body.code).toBe('GARAGE_MAX_LIMIT_REACHED');
  });

  it('TC-MOD02-012: Filters public catalogue by vehicle fitment parameters', async () => {
    const res = await request(app)
      .get('/api/v1/products')
      .query({
        make: 'TOYOTA',
        model: 'COROLLA',
        year: 2016,
      });

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].id).toBe(testProductId);
  });
});
