import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createApp } from '../../../src/app.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { SellerDocument } from '../../../src/modules/identity/models/sellerDocument.model.js';
import { SellerBankDetails } from '../../../src/modules/identity/models/sellerBankDetails.model.js';

describe('MOD-01 Administrator Verification & Bank Approval Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_admin_verification';

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      SellerProfile.deleteMany({}),
      SellerDocument.deleteMany({}),
      SellerBankDetails.deleteMany({}),
    ]);
  });

  async function createAdminUser() {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('AdminSecret@123', salt);

    const admin = await User.create({
      email: 'admin.platform@autodock.lk',
      passwordHash,
      firstName: 'Chief',
      lastName: 'Administrator',
      phone: '+94119998877',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.platform@autodock.lk',
      password: 'AdminSecret@123',
    });

    return { admin, token: loginRes.body.data.accessToken };
  }

  async function createSampleSeller(
    type: 'PHYSICAL_STORE' | 'ONLINE_ONLY',
    status: 'PENDING' | 'DRAFT' = 'PENDING'
  ) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('SellerPass@123', salt);

    const user = await User.create({
      email: `seller.${type.toLowerCase()}@example.com`,
      passwordHash,
      firstName: 'Vendor',
      lastName: 'Owner',
      phone: '+94775556677',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
    });

    const profile = await SellerProfile.create({
      userId: user._id,
      businessName: `${type} Parts Corp`,
      storeSlug: `${type.toLowerCase()}-parts-corp`,
      sellerType: type,
      businessRegistrationNumber: 'PV-888999',
      operatingAddress: {
        street: 'Commercial Ave',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '00100',
      },
      contactPhone: '+94112555666',
      verificationStatus: status,
      isEligibleToSell: false,
    });

    user.sellerId = profile._id;
    await user.save();

    const bank = await SellerBankDetails.create({
      sellerId: profile._id,
      bankName: 'Sampath Bank',
      accountHolderName: `${type} Parts Corp`,
      accountNumber: '100234567890',
      maskedAccountNumber: '******7890',
      branchName: 'Headquarters',
      verificationStatus: 'PENDING',
    });

    const doc = await SellerDocument.create({
      sellerId: profile._id,
      documentType: 'BUSINESS_REGISTRATION',
      s3StorageKey: `sellers/${profile._id}/verification/br_test.pdf`,
      fileName: 'br.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 204800,
      reviewStatus: 'PENDING',
    });

    return { user, profile, bank, doc };
  }

  it('Blocks non-admin users from accessing administrator review endpoints with 403 Forbidden', async () => {
    // Normal customer token
    await request(app).post('/api/v1/auth/register').send({
      email: 'customer.intruder@example.com',
      password: 'Password@123',
      firstName: 'Intruder',
      lastName: 'Customer',
      phone: '+94770001122',
    });
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'customer.intruder@example.com',
      password: 'Password@123',
    });
    const customerToken = loginRes.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/admin/sellers')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
  });

  it('Allows administrator to list seller applications with filtering and pagination', async () => {
    const { token: adminToken } = await createAdminUser();
    await createSampleSeller('PHYSICAL_STORE', 'PENDING');
    await createSampleSeller('ONLINE_ONLY', 'PENDING');

    const res = await request(app)
      .get('/api/v1/admin/sellers?status=PENDING&page=1&limit=10')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.pagination.total).toBe(2);
  });

  it('Allows administrator to view full seller application dossier including documents and bank details', async () => {
    const { token: adminToken } = await createAdminUser();
    const { profile, doc } = await createSampleSeller('PHYSICAL_STORE', 'PENDING');

    const res = await request(app)
      .get(`/api/v1/admin/sellers/${profile._id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.businessName).toBe('PHYSICAL_STORE Parts Corp');
    expect(res.body.data.documents.length).toBe(1);
    expect(res.body.data.documents[0].documentId).toBe(doc._id.toString());
    expect(res.body.data.bankDetails.maskedAccountNumber).toBe('******7890');
  });

  it('Physical store approval requires verificationMethod (PHYSICAL_VISIT or WHATSAPP_VIDEO_CALL)', async () => {
    const { token: adminToken } = await createAdminUser();
    const { profile } = await createSampleSeller('PHYSICAL_STORE', 'PENDING');

    // Attempt approval without physical/video verification method
    const failRes = await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'APPROVE',
        verificationMethod: 'DOCUMENT_ONLY',
        verificationNotes: 'Approved purely based on paper',
      });

    expect(failRes.status).toBe(400);
    expect(failRes.body.code).toBe('VERIFICATION_METHOD_REQUIRED');

    // Now approve with valid WhatsApp video call verification log
    const successRes = await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'APPROVE',
        verificationMethod: 'WHATSAPP_VIDEO_CALL',
        verificationNotes: 'Conducted live WhatsApp call on 2026-11-16. Inspected storefront and stock shelves.',
      });

    expect(successRes.status).toBe(200);
    expect(successRes.body.data.verificationStatus).toBe('APPROVED');
  });

  it('Online-only store approval succeeds with DOCUMENT_ONLY verification method', async () => {
    const { token: adminToken } = await createAdminUser();
    const { profile } = await createSampleSeller('ONLINE_ONLY', 'PENDING');

    const res = await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'APPROVE',
        verificationMethod: 'DOCUMENT_ONLY',
        verificationNotes: 'BR certificate and NIC front/back audited and verified.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.verificationStatus).toBe('APPROVED');
  });

  it('Admin rejection updates status to REJECTED and records mandatory reason', async () => {
    const { token: adminToken } = await createAdminUser();
    const { profile } = await createSampleSeller('ONLINE_ONLY', 'PENDING');

    const res = await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'REJECT',
        verificationNotes: 'Business registration certificate could not be validated with Registrar of Companies.',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.verificationStatus).toBe('REJECTED');
    expect(res.body.data.rejectionReason).toContain('could not be validated');
  });

  it('Seller selling eligibility is unlocked ONLY when both Profile is APPROVED and Bank is VERIFIED', async () => {
    const { token: adminToken } = await createAdminUser();
    const { profile } = await createSampleSeller('ONLINE_ONLY', 'PENDING');

    // Step 1: Approve seller profile
    await request(app)
      .post(`/api/v1/admin/sellers/${profile._id}/review`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'APPROVE',
        verificationMethod: 'DOCUMENT_ONLY',
        verificationNotes: 'Documents verified',
      });

    // Profile is APPROVED, but Bank is still PENDING -> isEligibleToSell must be FALSE
    let updatedProfile = await SellerProfile.findById(profile._id);
    expect(updatedProfile?.verificationStatus).toBe('APPROVED');
    expect(updatedProfile?.isEligibleToSell).toBe(false);

    // Step 2: Administrator verifies Bank Account
    const bankRes = await request(app)
      .patch(`/api/v1/admin/sellers/${profile._id}/bank-details/verify`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        decision: 'VERIFY',
      });

    expect(bankRes.status).toBe(200);
    expect(bankRes.body.data.verificationStatus).toBe('VERIFIED');

    // Now both are approved -> isEligibleToSell MUST BE TRUE
    updatedProfile = await SellerProfile.findById(profile._id);
    expect(updatedProfile?.isEligibleToSell).toBe(true);
  });
});
