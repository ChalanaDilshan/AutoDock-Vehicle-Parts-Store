import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../../../src/app.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { SellerDocument } from '../../../src/modules/identity/models/sellerDocument.model.js';
import { SellerBankDetails } from '../../../src/modules/identity/models/sellerBankDetails.model.js';
import { PrivacyAcknowledgement } from '../../../src/modules/identity/models/privacyAcknowledgement.model.js';

describe('MOD-01 Seller Onboarding & Document Verification Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_seller_onboarding';

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
      PrivacyAcknowledgement.deleteMany({}),
    ]);
  });

  async function createAuthenticatedUser(email: string) {
    await request(app).post('/api/v1/auth/register').send({
      email,
      password: 'Password@123',
      firstName: 'Applicant',
      lastName: 'User',
      phone: '+94772223344',
    });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email,
      password: 'Password@123',
    });

    return loginRes.body.data.accessToken;
  }

  it('Initiates seller registration and stores selected store type (PHYSICAL_STORE)', async () => {
    const token = await createAuthenticatedUser('seller.physical@example.com');

    const res = await request(app)
      .post('/api/v1/sellers/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessName: 'Lanka Auto Spares (Pvt) Ltd',
        storeSlug: 'lanka-auto-spares',
        sellerType: 'PHYSICAL_STORE',
        businessRegistrationNumber: 'PV-00123984',
        operatingAddress: {
          street: '124 Panchikawatta Road',
          city: 'Colombo',
          district: 'Colombo',
          province: 'Western',
          postalCode: '01000',
        },
        contactPhone: '+94112345678',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sellerType).toBe('PHYSICAL_STORE');
    expect(res.body.data.verificationStatus).toBe('DRAFT');
  });

  it('Rejects duplicate store slug with 409 Conflict', async () => {
    const token1 = await createAuthenticatedUser('seller1@example.com');
    const token2 = await createAuthenticatedUser('seller2@example.com');

    await request(app)
      .post('/api/v1/sellers/register')
      .set('Authorization', `Bearer ${token1}`)
      .send({
        businessName: 'Kandy Motors',
        storeSlug: 'kandy-motors',
        sellerType: 'ONLINE_ONLY',
        businessRegistrationNumber: 'PV-999888',
        operatingAddress: {
          street: 'Main St',
          city: 'Kandy',
          district: 'Kandy',
          province: 'Central',
          postalCode: '20000',
        },
        contactPhone: '+94812345678',
      });

    const res = await request(app)
      .post('/api/v1/sellers/register')
      .set('Authorization', `Bearer ${token2}`)
      .send({
        businessName: 'Kandy Motors Duplicate',
        storeSlug: 'kandy-motors',
        sellerType: 'PHYSICAL_STORE',
        businessRegistrationNumber: 'PV-777666',
        operatingAddress: {
          street: 'Main St',
          city: 'Kandy',
          district: 'Kandy',
          province: 'Central',
          postalCode: '20000',
        },
        contactPhone: '+94812345679',
      });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('SLUG_IN_USE');
  });

  it('Enforces BR-004: STORE_PHOTO upload is rejected for ONLINE_ONLY store type', async () => {
    const token = await createAuthenticatedUser('online.seller@example.com');

    // Register as ONLINE_ONLY
    await request(app)
      .post('/api/v1/sellers/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessName: 'Direct Parts Online',
        storeSlug: 'direct-parts-online',
        sellerType: 'ONLINE_ONLY',
        businessRegistrationNumber: 'PV-444555',
        operatingAddress: {
          street: 'Galle Road',
          city: 'Colombo',
          district: 'Colombo',
          province: 'Western',
          postalCode: '00300',
        },
        contactPhone: '+94112888999',
      });

    // Refresh token / login to update role to SELLER
    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'online.seller@example.com',
      password: 'Password@123',
    });
    const sellerToken = loginRes.body.data.accessToken;

    // Attempt to upload STORE_PHOTO
    const uploadRes = await request(app)
      .post('/api/v1/sellers/me/documents')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        documentType: 'STORE_PHOTO',
        fileName: 'shop_front.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 204850,
      });

    expect(uploadRes.status).toBe(400);
    expect(uploadRes.body.success).toBe(false);
    expect(uploadRes.body.message).toContain('Storefront photographs are not permitted for online-only sellers');
  });

  it('Submits seller bank details and masks account number in response', async () => {
    const token = await createAuthenticatedUser('bank.seller@example.com');
    await request(app)
      .post('/api/v1/sellers/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessName: 'Colombo Auto Hub',
        storeSlug: 'colombo-auto-hub',
        sellerType: 'PHYSICAL_STORE',
        businessRegistrationNumber: 'PV-111222',
        operatingAddress: {
          street: 'Negombo Road',
          city: 'Wattala',
          district: 'Gampaha',
          province: 'Western',
          postalCode: '11300',
        },
        contactPhone: '+94112999000',
      });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'bank.seller@example.com',
      password: 'Password@123',
    });
    const sellerToken = loginRes.body.data.accessToken;

    const bankRes = await request(app)
      .post('/api/v1/sellers/me/bank-details')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        bankName: 'Commercial Bank of Ceylon',
        accountHolderName: 'Colombo Auto Hub (Pvt) Ltd',
        accountNumber: '80012345678471',
        branchName: 'Wattala Branch',
        branchCode: '045',
      });

    expect(bankRes.status).toBe(200);
    expect(bankRes.body.success).toBe(true);
    expect(bankRes.body.data.bankName).toBe('Commercial Bank of Ceylon');
    expect(bankRes.body.data.maskedAccountNumber).toBe('******8471');
    expect(bankRes.body.data.verificationStatus).toBe('PENDING');

    // Confirm raw account number is NOT returned in seller profile response
    const profileRes = await request(app)
      .get('/api/v1/sellers/me')
      .set('Authorization', `Bearer ${sellerToken}`);
    expect(profileRes.status).toBe(200);
    expect(profileRes.body.data.bankVerificationStatus).toBe('PENDING');
  });

  it('Enforces mandatory Privacy Notice acknowledgement gate prior to final submission', async () => {
    const token = await createAuthenticatedUser('privacy.seller@example.com');
    await request(app)
      .post('/api/v1/sellers/register')
      .set('Authorization', `Bearer ${token}`)
      .send({
        businessName: 'Negombo Parts Center',
        storeSlug: 'negombo-parts-center',
        sellerType: 'ONLINE_ONLY',
        businessRegistrationNumber: 'PV-333444',
        operatingAddress: {
          street: 'Main Street',
          city: 'Negombo',
          district: 'Gampaha',
          province: 'Western',
          postalCode: '11500',
        },
        contactPhone: '+94312223344',
      });

    const loginRes = await request(app).post('/api/v1/auth/login').send({
      email: 'privacy.seller@example.com',
      password: 'Password@123',
    });
    const sellerToken = loginRes.body.data.accessToken;

    // Upload required documents
    await request(app)
      .post('/api/v1/sellers/me/documents')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        documentType: 'BUSINESS_REGISTRATION',
        fileName: 'br.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 102400,
      });

    await request(app)
      .post('/api/v1/sellers/me/documents')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        documentType: 'SELLER_ID_CARD',
        fileName: 'nic.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 102400,
      });

    await request(app)
      .post('/api/v1/sellers/me/documents')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        documentType: 'SELLER_FACE_PHOTO',
        fileName: 'face.jpg',
        mimeType: 'image/jpeg',
        fileSizeBytes: 102400,
      });

    // Submit bank details
    await request(app)
      .post('/api/v1/sellers/me/bank-details')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        bankName: 'Bank of Ceylon',
        accountHolderName: 'Negombo Parts Center',
        accountNumber: '100022334455',
        branchName: 'Negombo City',
      });

    // Try final submit WITHOUT acknowledging privacy notice
    const failedSubmitRes = await request(app)
      .post('/api/v1/sellers/me/submit')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(failedSubmitRes.status).toBe(400);
    expect(failedSubmitRes.body.code).toBe('PRIVACY_NOT_ACKNOWLEDGED');

    // Now actively acknowledge privacy notice v1.2
    const ackRes = await request(app)
      .post('/api/v1/sellers/me/privacy-acknowledgement')
      .set('Authorization', `Bearer ${sellerToken}`)
      .send({
        noticeVersion: 'v1.2',
        acknowledged: true,
      });

    expect(ackRes.status).toBe(200);
    expect(ackRes.body.data.noticeVersion).toBe('v1.2');

    // Final submit should now succeed and move status to PENDING
    const successSubmitRes = await request(app)
      .post('/api/v1/sellers/me/submit')
      .set('Authorization', `Bearer ${sellerToken}`);

    expect(successSubmitRes.status).toBe(200);
    expect(successSubmitRes.body.data.verificationStatus).toBe('PENDING');
    expect(successSubmitRes.body.data.isEligibleToSell).toBe(false);
  });
});
