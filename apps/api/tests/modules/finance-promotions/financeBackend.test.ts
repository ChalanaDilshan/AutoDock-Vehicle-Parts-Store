import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { CommissionRateConfig } from '../../../src/modules/finance-promotions/models/commissionRate.model.js';
import { SellerCommissionExemption } from '../../../src/modules/finance-promotions/models/commissionExemption.model.js';
import { CommissionLedger } from '../../../src/modules/finance-promotions/models/commissionLedger.model.js';
import { SellerInvoice } from '../../../src/modules/finance-promotions/models/sellerInvoice.model.js';
import { InvoicePaymentReceipt } from '../../../src/modules/finance-promotions/models/invoicePaymentReceipt.model.js';
import { Promotion } from '../../../src/modules/finance-promotions/models/promotion.model.js';
import { PromotionRedemption } from '../../../src/modules/finance-promotions/models/promotionRedemption.model.js';
import { PlatformSubsidyLedger } from '../../../src/modules/finance-promotions/models/platformSubsidyLedger.model.js';
import { PlatformFinancialSettings } from '../../../src/modules/finance-promotions/models/platformFinancialSettings.model.js';
import { commissionService } from '../../../src/modules/finance-promotions/services/commission.service.js';
import { promotionPublicService } from '../../../src/modules/finance-promotions/contracts/promotion.contract.js';
import { financePublicService } from '../../../src/modules/finance-promotions/contracts/finance.contract.js';

describe('MOD-04 Finance & Promotion Management Backend Test Suite', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_finance';

  let adminToken: string;
  let adminId: string;

  let seller1Token: string;
  let seller1Id: string;
  let seller1UserId: string;

  let seller2Token: string;
  let seller2Id: string;
  let seller2UserId: string;

  let customerToken: string;
  let customerId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // 1. Admin
    const adminUser = await User.create({
      email: 'admin.fin@autodock.lk',
      passwordHash: 'hashed_pw',
      firstName: 'Finance',
      lastName: 'Director',
      phone: '+94770001122',
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    adminId = adminUser._id.toString();
    adminToken = jwt.sign(
      { userId: adminId, email: adminUser.email, role: 'ADMIN' },
      env.JWT_ACCESS_SECRET
    );

    // 2. Seller 1
    const s1User = await User.create({
      email: 'seller1.fin@autodock.lk',
      passwordHash: 'hashed_pw',
      firstName: 'Apex',
      lastName: 'Motors',
      phone: '+94771112233',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    seller1UserId = s1User._id.toString();

    const s1Profile = await SellerProfile.create({
      userId: s1User._id,
      businessName: 'Apex Motor Spares (Pvt) Ltd',
      storeSlug: 'apex-motor-spares',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-FIN-001',
      operatingAddress: {
        street: '45 Panchikawatta Road',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '01000',
      },
      contactPhone: '+94771112233',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    seller1Id = s1Profile._id.toString();
    seller1Token = jwt.sign(
      { userId: seller1UserId, email: s1User.email, role: 'SELLER', sellerId: seller1Id },
      env.JWT_ACCESS_SECRET
    );

    // 3. Seller 2
    const s2User = await User.create({
      email: 'seller2.fin@autodock.lk',
      passwordHash: 'hashed_pw',
      firstName: 'Ceylon',
      lastName: 'Brakes',
      phone: '+94772223344',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    seller2UserId = s2User._id.toString();

    const s2Profile = await SellerProfile.create({
      userId: s2User._id,
      businessName: 'Ceylon Brakes & Clutch',
      storeSlug: 'ceylon-brakes',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-FIN-002',
      operatingAddress: {
        street: '78 Kandy Road',
        city: 'Kelaniya',
        district: 'Gampaha',
        province: 'Western',
        postalCode: '11600',
      },
      contactPhone: '+94772223344',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    seller2Id = s2Profile._id.toString();
    seller2Token = jwt.sign(
      { userId: seller2UserId, email: s2User.email, role: 'SELLER', sellerId: seller2Id },
      env.JWT_ACCESS_SECRET
    );

    // 4. Customer
    const customer = await User.create({
      email: 'buyer.fin@autodock.lk',
      passwordHash: 'hashed_pw',
      firstName: 'Ruwan',
      lastName: 'Perera',
      phone: '+94773334455',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerId = customer._id.toString();
    customerToken = jwt.sign(
      { userId: customerId, email: customer.email, role: 'CUSTOMER' },
      env.JWT_ACCESS_SECRET
    );
  });

  afterAll(async () => {
    await User.deleteMany({ email: { $in: ['admin.fin@autodock.lk', 'seller1.fin@autodock.lk', 'seller2.fin@autodock.lk', 'buyer.fin@autodock.lk'] } });
    await SellerProfile.deleteMany({ _id: { $in: [seller1Id, seller2Id] } });
    await CommissionRateConfig.deleteMany({});
    await SellerCommissionExemption.deleteMany({});
    await CommissionLedger.deleteMany({});
    await SellerInvoice.deleteMany({});
    await InvoicePaymentReceipt.deleteMany({});
    await Promotion.deleteMany({});
    await PromotionRedemption.deleteMany({});
    await PlatformSubsidyLedger.deleteMany({});
    await PlatformFinancialSettings.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    // Clear financial transactional collections before each test block
    await CommissionLedger.deleteMany({});
    await SellerInvoice.deleteMany({});
    await InvoicePaymentReceipt.deleteMany({});
    await PlatformSubsidyLedger.deleteMany({});
    await PromotionRedemption.deleteMany({});
  });

  // ===========================================================================
  // SECTION 1: Commission Rate Configuration Tests
  // ===========================================================================
  describe('1. Commission Rate Configuration & History', () => {
    it('allows an authorized admin to configure a new commission rate', async () => {
      const res = await request(app)
        .post('/api/v1/admin/finance/commission-rate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          basisPoints: 850, // 8.50%
          description: 'Q4 2026 Revised Standard Commission Rate',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newRate.basisPoints).toBe(850);
      expect(res.body.data.newRate.status).toBe('ACTIVE');
    });

    it('rejects commission rate configuration by non-admin seller (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/finance/commission-rate')
        .set('Authorization', `Bearer ${seller1Token}`)
        .send({
          basisPoints: 500,
          description: 'Seller trying to lower rate',
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('rejects invalid rate range (> 35.00% or negative)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/finance/commission-rate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          basisPoints: 4000, // 40% exceeds 35% cap
          description: 'Exorbitant rate',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('retrieves rate history preserving prior rate versions', async () => {
      await request(app)
        .post('/api/v1/admin/finance/commission-rate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          basisPoints: 900,
          description: 'Updated rate version 2',
        });

      const res = await request(app)
        .get('/api/v1/admin/finance/commission-rate')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.currentRate.basisPoints).toBe(900);
      expect(res.body.data.history.length).toBeGreaterThanOrEqual(2);
    });
  });

  // ===========================================================================
  // SECTION 2: Seller Commission Exemptions
  // ===========================================================================
  describe('2. Seller Commission Exemptions', () => {
    it('admin grants an individual seller commission exemption', async () => {
      const res = await request(app)
        .post('/api/v1/admin/finance/exemptions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sellerId: seller1Id,
          reason: 'Strategic Founding Partner promotional exemption for 2026',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.exemption.status).toBe('ACTIVE');

      const check = await commissionService.isSellerExempt(seller1Id);
      expect(check.isExempt).toBe(true);
    });

    it('seller cannot grant an exemption to themselves (403 Forbidden)', async () => {
      const res = await request(app)
        .post('/api/v1/admin/finance/exemptions')
        .set('Authorization', `Bearer ${seller1Token}`)
        .send({
          sellerId: seller1Id,
          reason: 'Self-granted waiver attempt',
        });

      expect(res.status).toBe(403);
    });

    it('admin revokes an active exemption affecting future events only', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/finance/exemptions/${seller1Id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reason: 'Promotional grace period expired. Standard commission applies.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.exemption.status).toBe('REVOKED');

      const check = await commissionService.isSellerExempt(seller1Id);
      expect(check.isExempt).toBe(false);
    });
  });

  // ===========================================================================
  // SECTION 3: Authoritative Commission Accrual & Immutable Ledger
  // ===========================================================================
  describe('3. Commission Accrual & Ledger Invariants', () => {
    beforeEach(async () => {
      // Ensure standard active rate of 8.00% (800 bps)
      await CommissionRateConfig.deleteMany({});
      await CommissionRateConfig.create({
        basisPoints: 800,
        percentage: 8.0,
        description: 'Standard 8% Platform Commission',
        effectiveFrom: new Date(0),
        status: 'ACTIVE',
        configuredBy: new mongoose.Types.ObjectId(adminId),
      });
      // Ensure no active exemptions
      await SellerCommissionExemption.deleteMany({});
    });

    it('accrues commission strictly following the approved formula (Delivery Fee excluded, AutoDock discount excluded from base deduction)', async () => {
      // Approved Benchmark Example:
      // Product subtotal: Rs. 10,000 (1,000,000 Cents)
      // Seller discount: Rs. 1,000 (100,000 Cents)
      // AutoDock platform discount: Rs. 500 (50,000 Cents) [Does NOT reduce base]
      // Delivery fee: Rs. 500 (50,000 Cents) [EXCLUDED from base]
      // Expected Base = 1,000,000 - 100,000 = 900,000 Cents (Rs. 9,000)
      // Rate = 8.00% (800 bps)
      // Expected Commission = (900,000 * 800 + 5000) / 10000 = 72,000 Cents (Rs. 720.00)
      const suborderId = new mongoose.Types.ObjectId().toString();
      const orderId = new mongoose.Types.ObjectId().toString();

      const ledger = await commissionService.accrueCommissionForSuborder({
        suborderId,
        orderId,
        sellerId: seller1Id,
        productSubtotalInCents: 1000000,
        sellerDiscountInCents: 100000,
        platformDiscountInCents: 50000,
        deliveryFeeInCents: 50000,
      });

      expect(ledger.commissionableBaseInCents).toBe(900000);
      expect(ledger.commissionAmountInCents).toBe(72000);
      expect(ledger.appliedRateSnapshot.basisPoints).toBe(800);
      expect(ledger.appliedRateSnapshot.isExempt).toBe(false);
      expect(ledger.status).toBe('ACCRUED');
    });

    it('strictly accrues zero commission when seller has an active exemption', async () => {
      await commissionService.grantSellerExemption(
        seller1Id,
        'Active partner exemption test',
        adminId
      );

      const suborderId = new mongoose.Types.ObjectId().toString();
      const orderId = new mongoose.Types.ObjectId().toString();

      const ledger = await commissionService.accrueCommissionForSuborder({
        suborderId,
        orderId,
        sellerId: seller1Id,
        productSubtotalInCents: 1000000,
        sellerDiscountInCents: 100000,
        platformDiscountInCents: 0,
        deliveryFeeInCents: 50000,
      });

      expect(ledger.commissionableBaseInCents).toBe(900000);
      expect(ledger.commissionAmountInCents).toBe(0);
      expect(ledger.appliedRateSnapshot.isExempt).toBe(true);
      expect(ledger.appliedRateSnapshot.basisPoints).toBe(0);
    });

    it('enforces idempotency: duplicate completion events return existing ledger record without duplicate writes', async () => {
      const suborderId = new mongoose.Types.ObjectId().toString();
      const orderId = new mongoose.Types.ObjectId().toString();
      const completionEventId = `EVENT-${suborderId}`;

      const firstCall = await commissionService.accrueCommissionForSuborder({
        suborderId,
        orderId,
        sellerId: seller2Id,
        productSubtotalInCents: 500000,
        sellerDiscountInCents: 0,
        platformDiscountInCents: 0,
        deliveryFeeInCents: 30000,
        completionEventId,
      });

      const secondCall = await commissionService.accrueCommissionForSuborder({
        suborderId,
        orderId,
        sellerId: seller2Id,
        productSubtotalInCents: 500000,
        sellerDiscountInCents: 0,
        platformDiscountInCents: 0,
        deliveryFeeInCents: 30000,
        completionEventId,
      });

      expect(firstCall._id.toString()).toBe(secondCall._id.toString());
      expect(firstCall.ledgerReference).toBe(secondCall.ledgerReference);

      const totalCount = await CommissionLedger.countDocuments({ suborderId });
      expect(totalCount).toBe(1);
    });
  });

  // ===========================================================================
  // SECTION 4: Monthly Invoice Generation & Viewing
  // ===========================================================================
  describe('4. Monthly Seller Invoicing', () => {
    const billingPeriod = '2026-11';

    beforeEach(async () => {
      // Create two accrued ledger entries for seller 1 in Nov 2026
      await CommissionLedger.create({
        ledgerReference: 'LED-20261115-0001',
        sellerId: new mongoose.Types.ObjectId(seller1Id),
        orderId: new mongoose.Types.ObjectId(),
        suborderId: new mongoose.Types.ObjectId(),
        completionEventId: 'EVT-NOV-001',
        completionTimestamp: new Date('2026-11-15T10:00:00.000Z'),
        productSubtotalInCents: 1000000,
        sellerDiscountInCents: 0,
        platformDiscountInCents: 0,
        deliveryFeeInCents: 50000,
        commissionableBaseInCents: 1000000,
        appliedRateSnapshot: { basisPoints: 800, isExempt: false },
        commissionAmountInCents: 80000, // Rs. 800.00
        currency: 'LKR',
        calculationVersion: 1,
        status: 'ACCRUED',
      });

      await CommissionLedger.create({
        ledgerReference: 'LED-20261120-0002',
        sellerId: new mongoose.Types.ObjectId(seller1Id),
        orderId: new mongoose.Types.ObjectId(),
        suborderId: new mongoose.Types.ObjectId(),
        completionEventId: 'EVT-NOV-002',
        completionTimestamp: new Date('2026-11-20T14:30:00.000Z'),
        productSubtotalInCents: 500000,
        sellerDiscountInCents: 50000,
        platformDiscountInCents: 0,
        deliveryFeeInCents: 30000,
        commissionableBaseInCents: 450000,
        appliedRateSnapshot: { basisPoints: 800, isExempt: false },
        commissionAmountInCents: 36000, // Rs. 360.00
        currency: 'LKR',
        calculationVersion: 1,
        status: 'ACCRUED',
      });
    });

    it('admin triggers monthly invoice generation batch', async () => {
      const res = await request(app)
        .post('/api/v1/admin/finance/invoices/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingPeriod });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.generatedCount).toBeGreaterThanOrEqual(1);

      // Verify invoice created
      const invoice = await SellerInvoice.findOne({ sellerId: seller1Id, billingPeriod });
      expect(invoice).not.toBeNull();
      expect(invoice!.lineItemCount).toBe(2);
      expect(invoice!.grossProductTotalInCents).toBe(1500000);
      expect(invoice!.grossCommissionInCents).toBe(116000); // 80000 + 36000
      expect(invoice!.outstandingBalanceInCents).toBe(116000);
      expect(invoice!.status).toBe('ISSUED');

      // Verify ledger items transitioned to INVOICED
      const updatedLedgers = await CommissionLedger.find({ sellerId: seller1Id });
      for (const item of updatedLedgers) {
        expect(item.status).toBe('INVOICED');
        expect(item.invoiceId?.toString()).toBe(invoice!._id.toString());
      }
    });

    it('invoice generation is idempotent: repeated batch for same period skips existing invoices', async () => {
      // First generation
      await request(app)
        .post('/api/v1/admin/finance/invoices/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingPeriod });

      // Second generation
      const secondRun = await request(app)
        .post('/api/v1/admin/finance/invoices/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingPeriod });

      expect(secondRun.status).toBe(200);
      expect(secondRun.body.data.generatedCount).toBe(0);
      expect(secondRun.body.data.skippedCount).toBe(0); // All were already INVOICED
    });

    it('seller views own invoices and details', async () => {
      // Generate invoice first
      await request(app)
        .post('/api/v1/admin/finance/invoices/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingPeriod });

      const listRes = await request(app)
        .get('/api/v1/seller/finance/invoices')
        .set('Authorization', `Bearer ${seller1Token}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.data.invoices.length).toBe(1);

      const invoiceId = listRes.body.data.invoices[0].id;
      const detailRes = await request(app)
        .get(`/api/v1/seller/finance/invoices/${invoiceId}`)
        .set('Authorization', `Bearer ${seller1Token}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.data.invoice.invoiceNumber).toBeDefined();
      expect(detailRes.body.data.lineItems.length).toBe(2);
    });

    it('BOLA security: Seller 2 cannot access Seller 1 invoice (403 Forbidden)', async () => {
      // Generate invoice for Seller 1
      await request(app)
        .post('/api/v1/admin/finance/invoices/generate')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ billingPeriod });

      const s1Invoice = await SellerInvoice.findOne({ sellerId: seller1Id });

      const trespassRes = await request(app)
        .get(`/api/v1/seller/finance/invoices/${s1Invoice!._id}`)
        .set('Authorization', `Bearer ${seller2Token}`);

      expect(trespassRes.status).toBe(403);
      expect(trespassRes.body.success).toBe(false);
    });
  });

  // ===========================================================================
  // SECTION 5: Seller Invoice Payments & Admin Verification
  // ===========================================================================
  describe('5. Seller Invoice Payment Receipts & Admin Verification', () => {
    let invoiceId: string;

    beforeEach(async () => {
      const invoice = await SellerInvoice.create({
        invoiceNumber: 'INV-202611-TEST-0001',
        sellerId: new mongoose.Types.ObjectId(seller1Id),
        billingPeriod: '2026-11',
        periodStart: new Date('2026-11-01T00:00:00Z'),
        periodEnd: new Date('2026-11-30T23:59:59Z'),
        issueDate: new Date(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        sellerBillingSnapshot: {
          businessName: 'Apex Motor Spares (Pvt) Ltd',
          businessRegNumber: 'PV-FIN-001',
          billingEmail: 'billing@apexmotors.lk',
          contactPhone: '+94771112233',
          address: { street: '45 Main', city: 'Colombo', district: 'Colombo', province: 'Western', postalCode: '01000' },
        },
        lineItemCount: 1,
        grossProductTotalInCents: 1000000,
        grossCommissionInCents: 80000, // Rs. 800.00
        verifiedPaidInCents: 0,
        outstandingBalanceInCents: 80000,
        currency: 'LKR',
        status: 'ISSUED',
      });
      invoiceId = invoice._id.toString();
    });

    it('seller uploads bank transfer deposit receipt for invoice', async () => {
      const fakeBase64 = Buffer.from('TEST_RECEIPT_SLIP_CONTENT').toString('base64');

      const res = await request(app)
        .post(`/api/v1/seller/finance/invoices/${invoiceId}/receipt`)
        .set('Authorization', `Bearer ${seller1Token}`)
        .send({
          fileName: 'deposit_slip_nov2026.png',
          mimeType: 'image/png',
          fileSizeBytes: 2048,
          fileContentBase64: fakeBase64,
          claimedAmountInCents: 80000,
          depositDate: new Date().toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.receipt.reviewStatus).toBe('PENDING');
      expect(res.body.data.invoice.status).toBe('PAYMENT_PENDING_VERIFICATION');
    });

    it('BOLA security: Seller 2 cannot upload receipt for Seller 1 invoice (403 Forbidden)', async () => {
      const res = await request(app)
        .post(`/api/v1/seller/finance/invoices/${invoiceId}/receipt`)
        .set('Authorization', `Bearer ${seller2Token}`)
        .send({
          fileName: 'deposit_slip.png',
          mimeType: 'image/png',
          fileSizeBytes: 1024,
          claimedAmountInCents: 80000,
        });

      expect(res.status).toBe(403);
    });

    it('admin verifies and approves payment receipt updating invoice balance to PAID', async () => {
      // 1. Submit receipt
      const submitRes = await request(app)
        .post(`/api/v1/seller/finance/invoices/${invoiceId}/receipt`)
        .set('Authorization', `Bearer ${seller1Token}`)
        .send({
          fileName: 'boc_transfer.pdf',
          mimeType: 'application/pdf',
          fileSizeBytes: 2048,
          claimedAmountInCents: 80000,
        });

      const receiptId = submitRes.body.data.receipt.id;

      // 2. Admin approves receipt
      const verifyRes = await request(app)
        .post(`/api/v1/admin/finance/invoices/${invoiceId}/receipts/${receiptId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'APPROVE',
          bankTransactionReference: 'BOC-TXN-99882211',
          adminNotes: 'Verified against BOC corporate bank statement',
        });

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.data.receipt.reviewStatus).toBe('APPROVED');
      expect(verifyRes.body.data.receipt.bankTransactionReference).toBe('BOC-TXN-99882211');
      expect(verifyRes.body.data.invoice.verifiedPaidInCents).toBe(80000);
      expect(verifyRes.body.data.invoice.outstandingBalanceInCents).toBe(0);
      expect(verifyRes.body.data.invoice.status).toBe('PAID');
    });

    it('admin rejects receipt requiring a mandatory rejection reason', async () => {
      // 1. Submit receipt
      const submitRes = await request(app)
        .post(`/api/v1/seller/finance/invoices/${invoiceId}/receipt`)
        .set('Authorization', `Bearer ${seller1Token}`)
        .send({
          fileName: 'blurry_slip.jpg',
          mimeType: 'image/jpeg',
          fileSizeBytes: 1024,
          claimedAmountInCents: 80000,
        });

      const receiptId = submitRes.body.data.receipt.id;

      // 2. Try reject without reason -> should fail validation (400)
      const failRes = await request(app)
        .post(`/api/v1/admin/finance/invoices/${invoiceId}/receipts/${receiptId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REJECT',
        });

      expect(failRes.status).toBe(400);

      // 3. Reject with valid reason
      const rejectRes = await request(app)
        .post(`/api/v1/admin/finance/invoices/${invoiceId}/receipts/${receiptId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'REJECT',
          rejectionReason: 'Bank transfer slip is unreadable and amount is obscured.',
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.receipt.reviewStatus).toBe('REJECTED');
      expect(rejectRes.body.data.invoice.status).toBe('ISSUED');
    });

    it('rejects double verification / review on already finalized receipt (409 Conflict)', async () => {
      const submitRes = await request(app)
        .post(`/api/v1/seller/finance/invoices/${invoiceId}/receipt`)
        .set('Authorization', `Bearer ${seller1Token}`)
        .send({
          fileName: 'slip.png',
          mimeType: 'image/png',
          fileSizeBytes: 1024,
          claimedAmountInCents: 80000,
        });

      const receiptId = submitRes.body.data.receipt.id;

      // Approve once
      await request(app)
        .post(`/api/v1/admin/finance/invoices/${invoiceId}/receipts/${receiptId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'APPROVE',
          bankTransactionReference: 'TXN-12345',
        });

      // Try approve/reject second time -> 409
      const replayRes = await request(app)
        .post(`/api/v1/admin/finance/invoices/${invoiceId}/receipts/${receiptId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          action: 'APPROVE',
          bankTransactionReference: 'TXN-12345',
        });

      expect(replayRes.status).toBe(409);
    });
  });

  // ===========================================================================
  // SECTION 6: Promotion Management & Quote Allocations for MOD-03
  // ===========================================================================
  describe('6. Promotion Creation & MOD-03 Quote Validation', () => {
    it('seller creates a seller-funded coupon restricted to their own products', async () => {
      const res = await request(app)
        .post('/api/v1/seller/promotions')
        .set('Authorization', `Bearer ${seller1Token}`)
        .send({
          code: 'APEX10',
          title: '10% Off Apex Braking Parts',
          discountType: 'PERCENTAGE',
          discountValue: 1000, // 10.00%
          minSpendInCents: 200000, // Rs. 2,000
          maxDiscountInCents: 50000, // Rs. 500 cap
          startDate: new Date('2026-01-01').toISOString(),
          endDate: new Date('2026-12-31').toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.promotion.code).toBe('APEX10');
      expect(res.body.data.promotion.fundingSource).toBe('SELLER_FUNDED');
      expect(res.body.data.promotion.sellerId).toBe(seller1Id);
    });

    it('admin creates an AutoDock-funded marketplace-wide promotion', async () => {
      const res = await request(app)
        .post('/api/v1/admin/finance/promotions')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          code: 'AUTODEAL500',
          title: 'Rs. 500 Flat Marketplace Voucher',
          discountType: 'FIXED_AMOUNT',
          discountValue: 50000, // Rs. 500
          minSpendInCents: 300000, // Rs. 3,000 min spend
          startDate: new Date('2026-01-01').toISOString(),
          endDate: new Date('2026-12-31').toISOString(),
        });

      expect(res.status).toBe(201);
      expect(res.body.data.promotion.code).toBe('AUTODEAL500');
      expect(res.body.data.promotion.fundingSource).toBe('AUTODOCK_FUNDED');
      expect(res.body.data.promotion.sellerId).toBeNull();
    });

    it('MOD-03 Contract: quotes seller-funded promotion discounting ONLY seller 1 products', async () => {
      const quoteResult = await promotionPublicService.validateAndQuotePromotion({
        promoCode: 'APEX10',
        customerId,
        items: [
          {
            productId: new mongoose.Types.ObjectId().toString(),
            sellerId: seller1Id,
            categoryId: new mongoose.Types.ObjectId().toString(),
            quantity: 2,
            unitPriceInCents: 150000, // 2 * 1,500 = Rs. 3,000 (300,000 Cents)
          },
          {
            productId: new mongoose.Types.ObjectId().toString(),
            sellerId: seller2Id, // Seller 2 product in multi-seller cart
            categoryId: new mongoose.Types.ObjectId().toString(),
            quantity: 1,
            unitPriceInCents: 200000,
          },
        ],
      });

      expect(quoteResult.isValid).toBe(true);
      expect(quoteResult.fundingSource).toBe('SELLER_FUNDED');
      // 10% on 300,000 cents = 30,000 cents (Rs. 300.00). Max cap 50,000 cents not hit.
      expect(quoteResult.totalDiscountInCents).toBe(30000);
      expect(quoteResult.sellerAllocations.length).toBe(1);
      expect(quoteResult.sellerAllocations[0].sellerId).toBe(seller1Id);
      expect(quoteResult.sellerAllocations[0].sellerDiscountInCents).toBe(30000);
      expect(quoteResult.sellerAllocations[0].platformDiscountInCents).toBe(0);
    });

    it('MOD-03 Contract: rejects coupon if minimum spend is not met', async () => {
      const quoteResult = await promotionPublicService.validateAndQuotePromotion({
        promoCode: 'APEX10',
        customerId,
        items: [
          {
            productId: new mongoose.Types.ObjectId().toString(),
            sellerId: seller1Id,
            categoryId: new mongoose.Types.ObjectId().toString(),
            quantity: 1,
            unitPriceInCents: 100000, // Rs. 1,000 < min spend of Rs. 2,000
          },
        ],
      });

      expect(quoteResult.isValid).toBe(false);
      expect(quoteResult.rejectionCode).toBe('MIN_SPEND_NOT_MET');
      expect(quoteResult.totalDiscountInCents).toBe(0);
    });

    it('MOD-03 Contract: quotes marketplace promotion and allocates pro-rata across sellers with AUTODOCK_FUNDED classification', async () => {
      const prod1 = new mongoose.Types.ObjectId().toString();
      const prod2 = new mongoose.Types.ObjectId().toString();

      const quoteResult = await promotionPublicService.validateAndQuotePromotion({
        promoCode: 'AUTODEAL500',
        customerId,
        items: [
          {
            productId: prod1,
            sellerId: seller1Id,
            categoryId: new mongoose.Types.ObjectId().toString(),
            quantity: 1,
            unitPriceInCents: 300000, // Rs. 3,000 (60% of total)
          },
          {
            productId: prod2,
            sellerId: seller2Id,
            categoryId: new mongoose.Types.ObjectId().toString(),
            quantity: 1,
            unitPriceInCents: 200000, // Rs. 2,000 (40% of total)
          },
        ],
      });

      expect(quoteResult.isValid).toBe(true);
      expect(quoteResult.fundingSource).toBe('AUTODOCK_FUNDED');
      expect(quoteResult.totalDiscountInCents).toBe(50000); // Rs. 500
      expect(quoteResult.sellerAllocations.length).toBe(2);

      // Verify each seller allocation is marked platformDiscountInCents
      for (const alloc of quoteResult.sellerAllocations) {
        expect(alloc.sellerDiscountInCents).toBe(0);
        expect(alloc.platformDiscountInCents).toBeGreaterThan(0);
      }

      // Sum of allocated discounts equals 50,000 cents
      const sum = quoteResult.sellerAllocations.reduce((acc, a) => acc + a.platformDiscountInCents, 0);
      expect(sum).toBe(50000);
    });
  });

  // ===========================================================================
  // SECTION 7: AutoDock Promotional Subsidy Ledger
  // ===========================================================================
  describe('7. Platform Subsidy Ledger & Separation', () => {
    it('MOD-03 Public Contract: records platform subsidy when platform promotional discount applied to suborder', async () => {
      const suborderId = new mongoose.Types.ObjectId().toString();
      const orderId = new mongoose.Types.ObjectId().toString();

      const result = await financePublicService.accrueSuborderCommissionAndSubsidy({
        suborderId,
        orderId,
        sellerId: seller1Id,
        productSubtotalInCents: 500000,
        sellerDiscountInCents: 0,
        platformDiscountInCents: 30000, // Rs. 300 funded by platform
        deliveryFeeInCents: 20000,
        promotionCode: 'AUTODEAL500',
      });

      expect(result.commissionLedgerId).toBeDefined();
      expect(result.subsidyLedgerId).toBeDefined();
      expect(result.subsidyAmountInCents).toBe(30000);

      const subsidyRecord = await PlatformSubsidyLedger.findById(result.subsidyLedgerId);
      expect(subsidyRecord).not.toBeNull();
      expect(subsidyRecord!.status).toBe('ACCRUED');
      expect(subsidyRecord!.settlementMethod).toBeNull(); // Strictly NOT netted without explicit approved policy
    });

    it('does NOT record platform subsidy when only seller-funded discount applied', async () => {
      const suborderId = new mongoose.Types.ObjectId().toString();
      const orderId = new mongoose.Types.ObjectId().toString();

      const result = await financePublicService.accrueSuborderCommissionAndSubsidy({
        suborderId,
        orderId,
        sellerId: seller1Id,
        productSubtotalInCents: 500000,
        sellerDiscountInCents: 50000,
        platformDiscountInCents: 0,
        deliveryFeeInCents: 20000,
      });

      expect(result.commissionLedgerId).toBeDefined();
      expect(result.subsidyLedgerId).toBeUndefined();
      expect(result.subsidyAmountInCents).toBeUndefined();
    });
  });

  // ===========================================================================
  // SECTION 8: Platform Bank Account Details
  // ===========================================================================
  describe('8. Platform Corporate Bank Account Details', () => {
    it('retrieves platform bank deposit instructions for invoice payment', async () => {
      const res = await request(app)
        .get('/api/v1/finance/platform-bank-account')
        .set('Authorization', `Bearer ${seller1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bankName).toBeDefined();
      expect(res.body.data.accountNumber).toBeDefined();
    });

    it('admin updates platform bank account details', async () => {
      const res = await request(app)
        .put('/api/v1/admin/finance/platform-bank-account')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bankName: 'Commercial Bank of Ceylon',
          accountHolderName: 'AutoDock Marketplace (Pvt) Ltd',
          accountNumber: '1000998877',
          branchName: 'City Office, Colombo 01',
          branchCode: '7056',
          paymentInstructions: 'Transfer invoice total and enter invoice number as payment narration.',
        });

      expect(res.status).toBe(200);
      expect(res.body.data.settings.bankName).toBe('Commercial Bank of Ceylon');
      expect(res.body.data.settings.accountNumber).toBe('1000998877');
    });
  });
});
