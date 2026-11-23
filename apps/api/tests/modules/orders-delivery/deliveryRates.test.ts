import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { DeliveryRateProposal } from '../../../src/modules/orders-delivery/models/deliveryRateProposal.model.js';
import { DeliveryZoneRate } from '../../../src/modules/orders-delivery/models/deliveryZone.model.js';

describe('MOD-03 Delivery Rate Proposal & Admin Approval Lifecycle Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_delivery_rates';

  let sellerToken: string;
  let sellerProfileId: string;

  let adminToken: string;
  let adminUserId: string;

  let customerToken: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // 1. Seller
    const sUser = await User.create({
      email: 'seller.rates@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Rate',
      lastName: 'Seller',
      phone: '+94773330001',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const sProfile = await SellerProfile.create({
      userId: sUser._id,
      businessName: 'Express Parts Colombo',
      storeSlug: 'express-parts-colombo',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-RATES-01',
      operatingAddress: {
        street: '150 Highlevel Rd',
        city: 'Nugegoda',
        district: 'Colombo',
        province: 'Western',
        postalCode: '10250',
      },
      contactPhone: '+94773330001',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    sellerProfileId = sProfile._id.toString();
    sellerToken = jwt.sign(
      { userId: sUser._id.toString(), email: sUser.email, role: sUser.role, sellerId: sellerProfileId },
      env.JWT_ACCESS_SECRET
    );

    // 2. Admin
    const admin = await User.create({
      email: 'admin.rates@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+94773330002',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    adminUserId = admin._id.toString();
    adminToken = jwt.sign(
      { userId: adminUserId, email: admin.email, role: admin.role },
      env.JWT_ACCESS_SECRET
    );

    // 3. Customer
    const customer = await User.create({
      email: 'customer.rates@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Normal',
      lastName: 'Customer',
      phone: '+94773330003',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerToken = jwt.sign(
      { userId: customer._id.toString(), email: customer.email, role: customer.role },
      env.JWT_ACCESS_SECRET
    );
  });

  afterAll(async () => {
    await User.deleteMany({});
    await SellerProfile.deleteMany({});
    await DeliveryRateProposal.deleteMany({});
    await DeliveryZoneRate.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await DeliveryRateProposal.deleteMany({});
    await DeliveryZoneRate.deleteMany({});
  });

  it('TC-RATE-01: Seller submits delivery rate proposals in PENDING_APPROVAL status', async () => {
    const res = await request(app)
      .post('/api/v1/seller/delivery-rates/proposals')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        rates: [
          { district: 'Colombo', feeInCents: 40000, estimatedDaysMin: 1, estimatedDaysMax: 2 },
          { district: 'Gampaha', feeInCents: 45000, estimatedDaysMin: 1, estimatedDaysMax: 3 },
          { district: 'Kalutara', feeInCents: 50000, estimatedDaysMin: 2, estimatedDaysMax: 4 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING_APPROVAL');
    expect(res.body.data.rates).toHaveLength(3);

    // Active rates must remain 0 because proposal has not been approved
    const activeRates = await DeliveryZoneRate.countDocuments({ sellerId: sellerProfileId, status: 'ACTIVE' });
    expect(activeRates).toBe(0);
  });

  it('TC-RATE-02: Non-admin is blocked from approving proposals (403 Forbidden)', async () => {
    const proposal = await DeliveryRateProposal.create({
      sellerId: new mongoose.Types.ObjectId(sellerProfileId),
      rates: [{ district: 'Colombo', feeInCents: 40000, estimatedDaysMin: 1, estimatedDaysMax: 2 }],
      status: 'PENDING_APPROVAL',
    });

    // Customer attempts approval
    const resCust = await request(app)
      .post(`/api/v1/admin/delivery-rates/proposals/${proposal._id}/decision`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ decision: 'APPROVE' });

    expect(resCust.status).toBe(403);

    // Seller attempts approval
    const resSeller = await request(app)
      .post(`/api/v1/admin/delivery-rates/proposals/${proposal._id}/decision`)
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({ decision: 'APPROVE' });

    expect(resSeller.status).toBe(403);
  });

  it('TC-RATE-03: Admin approves proposal: activates new rates and supersedes previous rates', async () => {
    // 1. Existing initial active rate for Colombo (Rs. 350.00)
    const oldProposal = await DeliveryRateProposal.create({
      sellerId: new mongoose.Types.ObjectId(sellerProfileId),
      rates: [{ district: 'Colombo', feeInCents: 35000, estimatedDaysMin: 2, estimatedDaysMax: 4 }],
      status: 'APPROVED',
    });

    const oldRate = await DeliveryZoneRate.create({
      sellerId: new mongoose.Types.ObjectId(sellerProfileId),
      district: 'Colombo',
      feeInCents: 35000,
      estimatedDaysMin: 2,
      estimatedDaysMax: 4,
      proposalId: oldProposal._id,
      status: 'ACTIVE',
    });

    // 2. Seller submits new proposal for Colombo (Rs. 450.00) and Kandy (Rs. 600.00)
    const newProposal = await DeliveryRateProposal.create({
      sellerId: new mongoose.Types.ObjectId(sellerProfileId),
      rates: [
        { district: 'Colombo', feeInCents: 45000, estimatedDaysMin: 1, estimatedDaysMax: 2 },
        { district: 'Kandy', feeInCents: 60000, estimatedDaysMin: 2, estimatedDaysMax: 4 },
      ],
      status: 'PENDING_APPROVAL',
    });

    // 3. Admin approves
    const res = await request(app)
      .post(`/api/v1/admin/delivery-rates/proposals/${newProposal._id}/decision`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'APPROVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('APPROVED');

    // Verify old rate is SUPERSEDED
    const checkOldRate = await DeliveryZoneRate.findById(oldRate._id);
    expect(checkOldRate!.status).toBe('SUPERSEDED');

    // Verify new rates are ACTIVE
    const colomboRate = await DeliveryZoneRate.findOne({
      sellerId: sellerProfileId,
      district: 'Colombo',
      status: 'ACTIVE',
    });
    expect(colomboRate!.feeInCents).toBe(45000);

    const kandyRate = await DeliveryZoneRate.findOne({
      sellerId: sellerProfileId,
      district: 'Kandy',
      status: 'ACTIVE',
    });
    expect(kandyRate!.feeInCents).toBe(60000);
  });

  it('TC-RATE-04: Admin rejects proposal with mandatory reason', async () => {
    const proposal = await DeliveryRateProposal.create({
      sellerId: new mongoose.Types.ObjectId(sellerProfileId),
      rates: [{ district: 'Colombo', feeInCents: 200000, estimatedDaysMin: 1, estimatedDaysMax: 2 }], // Rs. 2,000 is unreasonable
      status: 'PENDING_APPROVAL',
    });

    // Rejection without reason fails validation (400)
    const resFail = await request(app)
      .post(`/api/v1/admin/delivery-rates/proposals/${proposal._id}/decision`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'REJECT' });

    expect(resFail.status).toBe(400);

    // Rejection with reason
    const res = await request(app)
      .post(`/api/v1/admin/delivery-rates/proposals/${proposal._id}/decision`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'REJECT', rejectionReason: 'Fee exceeds maximum threshold for district' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('REJECTED');
    expect(res.body.data.rejectionReason).toBe('Fee exceeds maximum threshold for district');

    // No active rates should be created
    const activeRates = await DeliveryZoneRate.countDocuments({ proposalId: proposal._id });
    expect(activeRates).toBe(0);
  });
});
