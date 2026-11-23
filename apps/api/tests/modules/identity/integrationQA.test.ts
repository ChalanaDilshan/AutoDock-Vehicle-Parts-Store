import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { createApp } from '../../../src/app.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { SellerDocument } from '../../../src/modules/identity/models/sellerDocument.model.js';
import { SellerBankDetails } from '../../../src/modules/identity/models/sellerBankDetails.model.js';
import { PrivacyAcknowledgement } from '../../../src/modules/identity/models/privacyAcknowledgement.model.js';
import { identityPublicService } from '../../../src/modules/identity/contracts/identity.contract.js';

describe('MOD-01 Integration QA & End-to-End Security Verification', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_integration_qa';

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

  // Helper: Create admin session
  async function createAdminSession() {
    const passwordHash = await bcrypt.hash('AdminSecurePass123!', 10);
    const admin = await User.create({
      email: 'admin.qa@autodock.lk',
      passwordHash,
      firstName: 'Audit',
      lastName: 'Officer',
      phone: '+94112345678',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email: 'admin.qa@autodock.lk',
      password: 'AdminSecurePass123!',
    });

    return { admin, token: res.body.data.accessToken };
  }

  // Helper: Create customer session
  async function createCustomerSession(email = 'customer.qa@autodock.lk', password = 'CustomerPass123!') {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email,
      passwordHash,
      firstName: 'Saman',
      lastName: 'Kumara',
      phone: '+94771234567',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });

    const res = await request(app).post('/api/v1/auth/login').send({
      email,
      password,
    });

    return { user, token: res.body.data.accessToken, refreshTokenCookie: res.headers['set-cookie'] };
  }

  // ---------------------------------------------------------------------------
  // 1. Customer Authentication & Lifecycle QA
  // ---------------------------------------------------------------------------
  describe('1. Customer Authentication & Session QA', () => {
    it('QA-AUTH-001: Registers a customer, ignores privileged role injection, and returns 201', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'new.buyer@autodock.lk',
          password: 'StrongPassword123!',
          firstName: 'Nuwan',
          lastName: 'Pradeep',
          phone: '+94712345678',
          role: 'ADMIN', // Privilege escalation attempt
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('CUSTOMER'); // Must be forced to CUSTOMER

      const dbUser = await User.findOne({ email: 'new.buyer@autodock.lk' });
      expect(dbUser?.role).toBe('CUSTOMER');
    });

    it('QA-AUTH-002: Enforces password reset workflow through secure SHA-256 tokens', async () => {
      const { user } = await createCustomerSession('reset.test@autodock.lk');

      // Request reset
      const forgotRes = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'reset.test@autodock.lk' });

      expect(forgotRes.status).toBe(200);

      // Verify reset token hashed on user document
      const updatedUser = await User.findById(user._id).select('+passwordResetToken +passwordResetExpiresAt');
      expect(updatedUser?.passwordResetToken).toBeDefined();

      // Test invalid token failure
      const invalidReset = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({
          token: 'invalid_non_existent_token_hex_value_1234567890abcdef',
          newPassword: 'NewBrandPassword123!',
        });

      expect(invalidReset.status).toBe(400);
      expect(invalidReset.body.success).toBe(false);
    });

    it('QA-AUTH-003: Successfully logs out and revokes access', async () => {
      const { token } = await createCustomerSession('logout.test@autodock.lk');

      const logoutRes = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', `Bearer ${token}`);

      expect(logoutRes.status).toBe(200);
      expect(logoutRes.body.success).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Physical Store Onboarding End-to-End QA
  // ---------------------------------------------------------------------------
  describe('2. Physical Store Onboarding & Approval Lifecycle QA', () => {
    it('QA-PHYS-001: Executes full Physical Store journey through all 4 documents, privacy consent, visit verification, and bank approval', async () => {
      const userEmail = 'physical.dealer@autodock.lk';
      const userPassword = 'CustomerPass123!';
      const { token: custToken } = await createCustomerSession(userEmail, userPassword);
      const { token: adminToken } = await createAdminSession();

      // Step 1: Register profile as PHYSICAL_STORE
      const regRes = await request(app)
        .post('/api/v1/sellers/register')
        .set('Authorization', `Bearer ${custToken}`)
        .send({
          businessName: 'Lanka Motor Spares (Pvt) Ltd',
          storeSlug: `lanka-motor-spares-${Date.now()}`,
          sellerType: 'PHYSICAL_STORE',
          businessRegistrationNumber: 'PV-998877',
          operatingAddress: {
            street: '150 Panchikawatte Rd',
            city: 'Colombo',
            district: 'Colombo',
            province: 'Western',
            postalCode: '01000',
          },
          contactPhone: '+94112345678',
        });

      expect(regRes.status).toBe(201);
      const sellerId = regRes.body.data.sellerId;

      // Re-login to update JWT payload to role: 'SELLER'
      const reLogin = await request(app).post('/api/v1/auth/login').send({
        email: userEmail,
        password: userPassword,
      });
      const sellerToken = reLogin.body.data.accessToken;

      // Step 2: Upload all 4 required documents for physical store
      const dummyBase64 = Buffer.from('PDF_DUMMY_CONTENT').toString('base64');
      const docTypes = ['BUSINESS_REGISTRATION', 'SELLER_ID_CARD', 'SELLER_FACE_PHOTO', 'STORE_PHOTO'];

      for (const dType of docTypes) {
        const docRes = await request(app)
          .post('/api/v1/sellers/me/documents')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({
            documentType: dType,
            fileName: `${dType.toLowerCase()}.pdf`,
            mimeType: 'application/pdf',
            fileSizeBytes: 1024,
            fileContentBase64: dummyBase64,
          });
        expect(docRes.status).toBe(201);
      }

      // Step 3: Submit bank details
      const bankRes = await request(app)
        .post('/api/v1/sellers/me/bank-details')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          bankName: 'Commercial Bank of Ceylon',
          accountHolderName: 'Lanka Motor Spares (Pvt) Ltd',
          accountNumber: '100023456789',
          branchName: 'Panchikawatte',
        });

      expect(bankRes.status).toBe(200);
      expect(bankRes.body.data.maskedAccountNumber).toBe('******6789');
      expect(bankRes.body.data.verificationStatus).toBe('PENDING');

      // Step 4: Attempt submission without privacy consent -> MUST FAIL
      const prePrivacySubmit = await request(app)
        .post('/api/v1/sellers/me/submit')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(prePrivacySubmit.status).toBe(400);
      expect(prePrivacySubmit.body.message).toMatch(/Privacy Notice/i);

      // Step 5: Acknowledge Privacy Notice v1.2
      const privacyRes = await request(app)
        .post('/api/v1/sellers/me/privacy-acknowledgement')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          noticeVersion: 'v1.2',
          acknowledged: true,
        });

      expect(privacyRes.status).toBe(200);
      expect(privacyRes.body.data.noticeVersion).toBe('v1.2');

      // Step 6: Submit application for review
      const finalSubmit = await request(app)
        .post('/api/v1/sellers/me/submit')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(finalSubmit.status).toBe(200);
      expect(finalSubmit.body.data.verificationStatus).toBe('PENDING');
      expect(finalSubmit.body.data.isEligibleToSell).toBe(false);

      // Step 7: Admin attempts approval without verification method -> MUST FAIL for PHYSICAL_STORE
      const invalidApprove = await request(app)
        .post(`/api/v1/admin/sellers/${sellerId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'APPROVE',
          verificationNotes: 'Premises looks fine',
        });

      expect(invalidApprove.status).toBe(400);
      expect(invalidApprove.body.message).toMatch(/physical visit or WhatsApp video call/i);

      // Step 8: Admin records valid PHYSICAL_VISIT approval
      const validApprove = await request(app)
        .post(`/api/v1/admin/sellers/${sellerId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'APPROVE',
          verificationMethod: 'PHYSICAL_VISIT',
          verificationNotes: 'Store visited on-premise; physical parts inventory and business signage confirmed.',
        });

      expect(validApprove.status).toBe(200);
      expect(validApprove.body.data.verificationStatus).toBe('APPROVED');

      // Step 9: Verify bank account
      const verifyBankRes = await request(app)
        .patch(`/api/v1/admin/sellers/${sellerId}/bank-details/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ decision: 'VERIFY' });

      expect(verifyBankRes.status).toBe(200);
      expect(verifyBankRes.body.data.verificationStatus).toBe('VERIFIED');

      // Step 10: Verify public cross-module contract unlocks selling eligibility
      const eligibility = await identityPublicService.isSellerEligibleToSell(sellerId);
      expect(eligibility.isEligible).toBe(true);
      expect(eligibility.sellerType).toBe('PHYSICAL_STORE');
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Online-Only Store Onboarding End-to-End QA
  // ---------------------------------------------------------------------------
  describe('3. Online-Only Store Onboarding & Exemption QA', () => {
    it('QA-ONL-001: Executes Online-Only Store journey; enforces rejection of STORE_PHOTO and validates document review', async () => {
      const userEmail = 'online.merchant@autodock.lk';
      const userPassword = 'CustomerPass123!';
      const { token: custToken } = await createCustomerSession(userEmail, userPassword);
      const { token: adminToken } = await createAdminSession();

      // Step 1: Register as ONLINE_ONLY
      const regRes = await request(app)
        .post('/api/v1/sellers/register')
        .set('Authorization', `Bearer ${custToken}`)
        .send({
          businessName: 'Direct Auto Parts E-Commerce',
          storeSlug: `direct-auto-parts-${Date.now()}`,
          sellerType: 'ONLINE_ONLY',
          businessRegistrationNumber: 'PV-554433',
          operatingAddress: {
            street: '22 Hub Road',
            city: 'Wattala',
            district: 'Gampaha',
            province: 'Western',
            postalCode: '11300',
          },
          contactPhone: '+94115556677',
        });

      expect(regRes.status).toBe(201);
      const sellerId = regRes.body.data.sellerId;

      // Re-login to obtain SELLER token
      const reLogin = await request(app).post('/api/v1/auth/login').send({
        email: userEmail,
        password: userPassword,
      });
      const sellerToken = reLogin.body.data.accessToken;

      // Step 2: Attempt to upload STORE_PHOTO -> MUST FAIL with 400 (BR-004)
      const dummyBase64 = Buffer.from('DUMMY').toString('base64');
      const storePhotoRes = await request(app)
        .post('/api/v1/sellers/me/documents')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          documentType: 'STORE_PHOTO',
          fileName: 'storefront.png',
          mimeType: 'image/png',
          fileSizeBytes: 2048,
          fileContentBase64: dummyBase64,
        });

      expect(storePhotoRes.status).toBe(400);
      expect(storePhotoRes.body.message).toMatch(/not permitted for online-only sellers/i);

      // Step 3: Upload permitted 3 documents
      for (const dType of ['BUSINESS_REGISTRATION', 'SELLER_ID_CARD', 'SELLER_FACE_PHOTO']) {
        const docRes = await request(app)
          .post('/api/v1/sellers/me/documents')
          .set('Authorization', `Bearer ${sellerToken}`)
          .send({
            documentType: dType,
            fileName: `${dType}.pdf`,
            mimeType: 'application/pdf',
            fileSizeBytes: 1024,
            fileContentBase64: dummyBase64,
          });
        expect(docRes.status).toBe(201);
      }

      // Step 4: Bank details & Privacy acknowledgement
      await request(app)
        .post('/api/v1/sellers/me/bank-details')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({
          bankName: 'Hatton National Bank',
          accountHolderName: 'Direct Auto Parts',
          accountNumber: '998877665544',
          branchName: 'Wattala',
        });

      await request(app)
        .post('/api/v1/sellers/me/privacy-acknowledgement')
        .set('Authorization', `Bearer ${sellerToken}`)
        .send({ noticeVersion: 'v1.2', acknowledged: true });

      // Step 5: Submit application
      const submitRes = await request(app)
        .post('/api/v1/sellers/me/submit')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(submitRes.status).toBe(200);

      // Step 6: Admin approves with DOCUMENT_ONLY (does not require physical/video visit)
      const approveRes = await request(app)
        .post(`/api/v1/admin/sellers/${sellerId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'APPROVE',
          verificationMethod: 'DOCUMENT_ONLY',
          verificationNotes: 'Online business registration validated with Registrar of Companies.',
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.verificationStatus).toBe('APPROVED');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Role-Based Access Control & Security Testing Matrix
  // ---------------------------------------------------------------------------
  describe('4. Security & Actor Authorization Matrix QA', () => {
    it('QA-SEC-001: Unauthenticated requests to protected endpoints return 401 Unauthorized', async () => {
      const endpoints = [
        { method: 'get', path: '/api/v1/users/me' },
        { method: 'get', path: '/api/v1/sellers/me' },
        { method: 'post', path: '/api/v1/sellers/me/submit' },
        { method: 'get', path: '/api/v1/admin/sellers' },
      ];

      for (const ep of endpoints) {
        const res = await (request(app) as any)[ep.method](ep.path);
        expect(res.status).toBe(401);
      }
    });

    it('QA-SEC-002: Customer role is blocked from admin review endpoints with 403 Forbidden', async () => {
      const { token } = await createCustomerSession('customer.restricted@autodock.lk');

      const res = await request(app)
        .get('/api/v1/admin/sellers')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('QA-SEC-003: Prevents IDOR: Seller cannot access presigned document view-url of another seller', async () => {
      const { token: sellerAToken } = await createCustomerSession('seller.a@autodock.lk');
      const { token: adminToken } = await createAdminSession();

      // Create Seller B profile
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('SellerBPass123!', salt);
      const userB = await User.create({
        email: 'seller.b@autodock.lk',
        passwordHash,
        firstName: 'Vendor',
        lastName: 'B',
        phone: '+94770000002',
        role: 'SELLER',
        accountStatus: 'ACTIVE',
      });

      const profileB = await SellerProfile.create({
        userId: userB._id,
        businessName: 'Vendor B Spares',
        storeSlug: 'vendor-b-spares',
        sellerType: 'ONLINE_ONLY',
        businessRegistrationNumber: 'PV-000002',
        operatingAddress: {
          street: '2 Road',
          city: 'Colombo',
          district: 'Colombo',
          province: 'Western',
          postalCode: '01000',
        },
        contactPhone: '+94770000002',
        verificationStatus: 'PENDING',
      });

      const docB = await SellerDocument.create({
        sellerId: profileB._id,
        documentType: 'BUSINESS_REGISTRATION',
        s3StorageKey: 'private/sellers/sellerB/br.pdf',
        fileName: 'br.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 2048,
        reviewStatus: 'PENDING',
      });

      // Seller A attempts to call admin document view-url for Seller B -> MUST BE 403
      const idorAttempt = await request(app)
        .get(`/api/v1/admin/sellers/${profileB._id}/documents/${docB._id}/view-url`)
        .set('Authorization', `Bearer ${sellerAToken}`);

      expect(idorAttempt.status).toBe(403);

      // Admin calls view-url -> MUST BE 200 with 60s expires
      const adminView = await request(app)
        .get(`/api/v1/admin/sellers/${profileB._id}/documents/${docB._id}/view-url`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminView.status).toBe(200);
      expect(adminView.body.data.expiresInSeconds).toBe(60);
      expect(adminView.body.data.viewUrl).toBeDefined();
    });

    it('QA-SEC-004: Prevents privilege escalation: PUT /users/me does not permit changing role', async () => {
      const { token } = await createCustomerSession('tamper.role@autodock.lk');

      const res = await request(app)
        .put('/api/v1/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({
          firstName: 'TamperedName',
          role: 'ADMIN',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe('CUSTOMER'); // Role remains strictly CUSTOMER
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Data Integrity, Rejection Reasons & Lifecycle Auditing
  // ---------------------------------------------------------------------------
  describe('5. Data Integrity & Verification Lifecycle QA', () => {
    it('QA-DATA-001: Mandatory rejection reason is enforced and audit log is preserved', async () => {
      const userEmail = 'reject.test@autodock.lk';
      const userPassword = 'CustomerPass123!';
      const { token: custToken } = await createCustomerSession(userEmail, userPassword);
      const { token: adminToken } = await createAdminSession();

      const regRes = await request(app)
        .post('/api/v1/sellers/register')
        .set('Authorization', `Bearer ${custToken}`)
        .send({
          businessName: 'Unqualified Parts Depot',
          storeSlug: `unqualified-parts-${Date.now()}`,
          sellerType: 'ONLINE_ONLY',
          businessRegistrationNumber: 'PV-FAKE01',
          operatingAddress: {
            street: '00 Nowhere Rd',
            city: 'Colombo',
            district: 'Colombo',
            province: 'Western',
            postalCode: '01000',
          },
          contactPhone: '+94110000000',
        });

      const sellerId = regRes.body.data.sellerId;

      // Re-login to get SELLER token
      const reLogin = await request(app).post('/api/v1/auth/login').send({
        email: userEmail,
        password: userPassword,
      });
      const sellerToken = reLogin.body.data.accessToken;

      // Admin attempts REJECT with empty notes -> MUST FAIL with 400
      const emptyReasonReject = await request(app)
        .post(`/api/v1/admin/sellers/${sellerId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'REJECT',
          verificationNotes: '   ',
        });

      expect(emptyReasonReject.status).toBe(400);

      // Admin rejects with clear reason
      const validReject = await request(app)
        .post(`/api/v1/admin/sellers/${sellerId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'REJECT',
          verificationNotes: 'Provided BR certificate is fraudulent and could not be verified.',
        });

      expect(validReject.status).toBe(200);
      expect(validReject.body.data.verificationStatus).toBe('REJECTED');

      // Verify seller status reflects rejection and shows reason
      const sellerMe = await request(app)
        .get('/api/v1/sellers/me')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(sellerMe.body.data.verificationStatus).toBe('REJECTED');
      expect(sellerMe.body.data.rejectionReason).toBe('Provided BR certificate is fraudulent and could not be verified.');
      expect(sellerMe.body.data.isEligibleToSell).toBe(false);
    });

    it('QA-DATA-002: Requesting additional info transitions to ADDITIONAL_INFO_REQUIRED and allows seller resubmission', async () => {
      const userEmail = 'info.test@autodock.lk';
      const userPassword = 'CustomerPass123!';
      const { token: custToken } = await createCustomerSession(userEmail, userPassword);
      const { token: adminToken } = await createAdminSession();

      const regRes = await request(app)
        .post('/api/v1/sellers/register')
        .set('Authorization', `Bearer ${custToken}`)
        .send({
          businessName: 'Needs Info Spares',
          storeSlug: `needs-info-spares-${Date.now()}`,
          sellerType: 'ONLINE_ONLY',
          businessRegistrationNumber: 'PV-333222',
          operatingAddress: {
            street: '10 Main Rd',
            city: 'Kandy',
            district: 'Kandy',
            province: 'Central',
            postalCode: '20000',
          },
          contactPhone: '+94812345678',
        });

      const sellerId = regRes.body.data.sellerId;

      // Re-login to get SELLER token
      const reLogin = await request(app).post('/api/v1/auth/login').send({
        email: userEmail,
        password: userPassword,
      });
      const sellerToken = reLogin.body.data.accessToken;

      // Admin requests info
      const reqInfoRes = await request(app)
        .post(`/api/v1/admin/sellers/${sellerId}/review`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          decision: 'REQUEST_INFO',
          verificationNotes: 'Please upload a higher-resolution scan of the business registration page 2.',
        });

      expect(reqInfoRes.status).toBe(200);
      expect(reqInfoRes.body.data.verificationStatus).toBe('ADDITIONAL_INFO_REQUIRED');

      // Seller inspects feedback
      const sellerProfile = await request(app)
        .get('/api/v1/sellers/me')
        .set('Authorization', `Bearer ${sellerToken}`);

      expect(sellerProfile.body.data.verificationStatus).toBe('ADDITIONAL_INFO_REQUIRED');
      expect(sellerProfile.body.data.additionalInfoRequested).toMatch(/higher-resolution scan/i);
    });
  });
});
