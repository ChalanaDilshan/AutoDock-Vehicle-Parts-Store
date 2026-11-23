import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { createApp } from '../../../src/app.js';
import { env } from '../../../src/config/env.js';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { SellerBankDetails } from '../../../src/modules/identity/models/sellerBankDetails.model.js';
import { Product } from '../../../src/modules/customer-experience/models/product.model.js';
import { Category } from '../../../src/modules/customer-experience/models/category.model.js';
import { Brand } from '../../../src/modules/customer-experience/models/brand.model.js';
import { Order } from '../../../src/modules/orders-delivery/models/order.model.js';
import { Suborder } from '../../../src/modules/orders-delivery/models/suborder.model.js';
import { PaymentSlip } from '../../../src/modules/orders-delivery/models/paymentSlip.model.js';

describe('MOD-03 Bank Transfer Instructions & Receipt Verification Tests', () => {
  const app = createApp();
  const testDbUri = 'mongodb://localhost:27017/autodock_test_payments';

  let customerToken: string;
  let customerId: string;

  let seller1Token: string;
  let seller1ProfileId: string;

  let seller2Token: string;
  let seller2ProfileId: string;

  let productId: string;

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);

    // 1. Customer
    const customer = await User.create({
      email: 'buyer.pay@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Buyer',
      lastName: 'Pay',
      phone: '+94779991111',
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    customerId = customer._id.toString();
    customerToken = jwt.sign(
      { userId: customerId, email: customer.email, role: customer.role },
      env.JWT_ACCESS_SECRET
    );

    // 2. Seller 1 (Bank Details VERIFIED)
    const s1User = await User.create({
      email: 'seller1.bank@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Verified',
      lastName: 'BankStore',
      phone: '+94771110001',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const s1Profile = await SellerProfile.create({
      userId: s1User._id,
      businessName: 'Kandy Auto Spares (Pvt) Ltd',
      storeSlug: 'kandy-auto-spares',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-BANK-01',
      operatingAddress: {
        street: '100 Dalada Veediya',
        city: 'Kandy',
        district: 'Kandy',
        province: 'Central',
        postalCode: '20000',
      },
      contactPhone: '+94771110001',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    seller1ProfileId = s1Profile._id.toString();
    seller1Token = jwt.sign(
      { userId: s1User._id.toString(), email: s1User.email, role: s1User.role, sellerId: seller1ProfileId },
      env.JWT_ACCESS_SECRET
    );

    // Verified bank details in MOD-01
    await SellerBankDetails.create({
      sellerId: s1Profile._id,
      bankName: 'Commercial Bank of Ceylon',
      accountHolderName: 'Kandy Auto Spares (Pvt) Ltd',
      accountNumber: '8001234567',
      maskedAccountNumber: '******4567',
      branchName: 'Kandy City Centre Branch',
      branchCode: '045',
      verificationStatus: 'VERIFIED',
    });

    // 3. Seller 2 (Bank Details PENDING - UNVERIFIED)
    const s2User = await User.create({
      email: 'seller2.bank@autodock.lk',
      passwordHash: 'hashed',
      firstName: 'Unverified',
      lastName: 'BankStore',
      phone: '+94771110002',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
      isEmailVerified: true,
    });
    const s2Profile = await SellerProfile.create({
      userId: s2User._id,
      businessName: 'Galle Spare Hub',
      storeSlug: 'galle-spare-hub',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-BANK-02',
      operatingAddress: {
        street: '20 Fort Rd',
        city: 'Galle',
        district: 'Galle',
        province: 'Southern',
        postalCode: '80000',
      },
      contactPhone: '+94771110002',
      verificationStatus: 'APPROVED',
      isEligibleToSell: true,
    });
    seller2ProfileId = s2Profile._id.toString();
    seller2Token = jwt.sign(
      { userId: s2User._id.toString(), email: s2User.email, role: s2User.role, sellerId: seller2ProfileId },
      env.JWT_ACCESS_SECRET
    );

    // Unverified bank details in MOD-01
    await SellerBankDetails.create({
      sellerId: s2Profile._id,
      bankName: 'Hatton National Bank',
      accountHolderName: 'Galle Spare Hub',
      accountNumber: '9007654321',
      maskedAccountNumber: '******4321',
      branchName: 'Galle Fort Branch',
      verificationStatus: 'PENDING',
    });

    // 4. Product
    const cat = await Category.create({ name: 'Filters', slug: 'filters' });
    const br = await Brand.create({ name: 'Bosch', slug: 'bosch' });
    const p = await Product.create({
      sellerId: s1Profile._id,
      title: 'Bosch Premium Oil Filter',
      sku: 'BOS-OF-01',
      partNumber: 'OF-01',
      categoryId: cat._id,
      brandId: br._id,
      condition: 'BRAND_NEW',
      description: 'High efficiency filter.',
      priceInCents: 150000,
      stock: 20,
      status: 'ACTIVE',
      images: [{ url: 'https://cdn.autodock.lk/filter.jpg', isPrimary: true }],
    });
    productId = p._id.toString();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await SellerProfile.deleteMany({});
    await SellerBankDetails.deleteMany({});
    await Category.deleteMany({});
    await Brand.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Suborder.deleteMany({});
    await PaymentSlip.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Order.deleteMany({});
    await Suborder.deleteMany({});
    await PaymentSlip.deleteMany({});
  });

  it('TC-PAY-01: Displays verified bank instructions for approved seller', async () => {
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0010',
      customerId: new mongoose.Types.ObjectId(customerId),
      customerEmail: 'buyer.pay@autodock.lk',
      shippingAddress: {
        fullName: 'Buyer Pay',
        phone: '+94779991111',
        street: '10 Queens Rd',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 150000,
      totalDeliveryFeeInCents: 45000,
      finalPayableAmountInCents: 195000,
      currency: 'LKR',
      overallStatus: 'PENDING_PAYMENT',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0010-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
      sellerBusinessName: 'Kandy Auto Spares (Pvt) Ltd',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Bosch Oil Filter',
          sku: 'BOS-OF-01',
          unitPriceInCents: 150000,
          quantity: 1,
          totalPriceInCents: 150000,
        },
      ],
      subtotalInCents: 150000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 195000,
      commissionableBaseInCents: 150000,
      currency: 'LKR',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PENDING_PAYMENT',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Kandy',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    const res = await request(app)
      .get(`/api/v1/orders/suborders/${suborder._id}/bank-instructions`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.bankDetails.bankName).toBe('Commercial Bank of Ceylon');
    expect(res.body.data.bankDetails.accountNumber).toBe('8001234567');
    expect(res.body.data.amountDueInCents).toBe(195000);
    expect(res.body.data.depositReference).toBe('ORD-20261118-0010-01');
  });

  it('TC-PAY-02: Enforces UNVERIFIED_SELLER_BANK gate: returns 403 if seller bank is pending', async () => {
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0011',
      customerId: new mongoose.Types.ObjectId(customerId),
      customerEmail: 'buyer.pay@autodock.lk',
      shippingAddress: {
        fullName: 'Buyer Pay',
        phone: '+94779991111',
        street: '10 Queens Rd',
        city: 'Galle',
        district: 'Galle',
        postalCode: '80000',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 150000,
      totalDeliveryFeeInCents: 45000,
      finalPayableAmountInCents: 195000,
      currency: 'LKR',
      overallStatus: 'PENDING_PAYMENT',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0011-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(seller2ProfileId), // Seller 2 has unverified bank details
      sellerBusinessName: 'Galle Spare Hub',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Bosch Oil Filter',
          sku: 'BOS-OF-01',
          unitPriceInCents: 150000,
          quantity: 1,
          totalPriceInCents: 150000,
        },
      ],
      subtotalInCents: 150000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 195000,
      commissionableBaseInCents: 150000,
      currency: 'LKR',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PENDING_PAYMENT',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'r-02',
        district: 'Galle',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    const res = await request(app)
      .get(`/api/v1/orders/suborders/${suborder._id}/bank-instructions`)
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('UNVERIFIED_SELLER_BANK');
  });

  it('TC-PAY-03: Uploads payment slip and transitions suborder to PAYMENT_PENDING_VERIFICATION', async () => {
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0012',
      customerId: new mongoose.Types.ObjectId(customerId),
      customerEmail: 'buyer.pay@autodock.lk',
      shippingAddress: {
        fullName: 'Buyer Pay',
        phone: '+94779991111',
        street: '10 Queens Rd',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 150000,
      totalDeliveryFeeInCents: 45000,
      finalPayableAmountInCents: 195000,
      currency: 'LKR',
      overallStatus: 'PENDING_PAYMENT',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0012-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
      sellerBusinessName: 'Kandy Auto Spares (Pvt) Ltd',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Bosch Oil Filter',
          sku: 'BOS-OF-01',
          unitPriceInCents: 150000,
          quantity: 1,
          totalPriceInCents: 150000,
        },
      ],
      subtotalInCents: 150000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 195000,
      commissionableBaseInCents: 150000,
      currency: 'LKR',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PENDING_PAYMENT',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Kandy',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    const res = await request(app)
      .post(`/api/v1/orders/suborders/${suborder._id}/receipt`)
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        fileName: 'bank_deposit_slip_ref99.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 102400,
        fileContentBase64: Buffer.from('%PDF-1.4 synthetic deposit slip').toString('base64'),
        depositedAmountInCents: 195000,
        referenceNumber: 'REF-TX-998877',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.verificationStatus).toBe('PENDING_VERIFICATION');

    const updatedSuborder = await Suborder.findById(suborder._id);
    expect(updatedSuborder!.paymentStatus).toBe('PAYMENT_PENDING_VERIFICATION');
  });

  it('TC-PAY-04: IDOR Protection: Seller 2 cannot view or verify Seller 1 payment slip', async () => {
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0013',
      customerId: new mongoose.Types.ObjectId(customerId),
      customerEmail: 'buyer.pay@autodock.lk',
      shippingAddress: {
        fullName: 'Buyer Pay',
        phone: '+94779991111',
        street: '10 Queens Rd',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 150000,
      totalDeliveryFeeInCents: 45000,
      finalPayableAmountInCents: 195000,
      currency: 'LKR',
      overallStatus: 'PENDING_PAYMENT',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0013-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId), // Belongs to Seller 1
      sellerBusinessName: 'Kandy Auto Spares (Pvt) Ltd',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Bosch Oil Filter',
          sku: 'BOS-OF-01',
          unitPriceInCents: 150000,
          quantity: 1,
          totalPriceInCents: 150000,
        },
      ],
      subtotalInCents: 150000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 195000,
      commissionableBaseInCents: 150000,
      currency: 'LKR',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAYMENT_PENDING_VERIFICATION',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Kandy',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    await PaymentSlip.create({
      suborderId: suborder._id,
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
      storageKey: 'suborder_test_key.pdf',
      originalFileName: 'slip.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 2048,
      depositedAmountInCents: 195000,
      verificationStatus: 'PENDING_VERIFICATION',
    });

    // Seller 2 attempts to view Seller 1's slip
    const resGet = await request(app)
      .get(`/api/v1/seller/suborders/${suborder._id}/receipt`)
      .set('Authorization', `Bearer ${seller2Token}`);

    expect(resGet.status).toBe(403);

    // Seller 2 attempts to approve Seller 1's slip
    const resVerify = await request(app)
      .post(`/api/v1/seller/suborders/${suborder._id}/receipt/verify`)
      .set('Authorization', `Bearer ${seller2Token}`)
      .send({ action: 'APPROVE' });

    expect(resVerify.status).toBe(403);
  });

  it('TC-PAY-05: Seller approves receipt: transitions suborder to PAID and PROCESSING', async () => {
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0014',
      customerId: new mongoose.Types.ObjectId(customerId),
      customerEmail: 'buyer.pay@autodock.lk',
      shippingAddress: {
        fullName: 'Buyer Pay',
        phone: '+94779991111',
        street: '10 Queens Rd',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 150000,
      totalDeliveryFeeInCents: 45000,
      finalPayableAmountInCents: 195000,
      currency: 'LKR',
      overallStatus: 'PENDING_PAYMENT',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0014-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
      sellerBusinessName: 'Kandy Auto Spares (Pvt) Ltd',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Bosch Oil Filter',
          sku: 'BOS-OF-01',
          unitPriceInCents: 150000,
          quantity: 1,
          totalPriceInCents: 150000,
        },
      ],
      subtotalInCents: 150000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 195000,
      commissionableBaseInCents: 150000,
      currency: 'LKR',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAYMENT_PENDING_VERIFICATION',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Kandy',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    await PaymentSlip.create({
      suborderId: suborder._id,
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
      storageKey: 'suborder_test_slip_01.pdf',
      originalFileName: 'valid_deposit_slip.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 2048,
      depositedAmountInCents: 195000,
      verificationStatus: 'PENDING_VERIFICATION',
    });

    const res = await request(app)
      .post(`/api/v1/seller/suborders/${suborder._id}/receipt/verify`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ action: 'APPROVE' });

    expect(res.status).toBe(200);
    expect(res.body.data.verificationStatus).toBe('APPROVED');
    expect(res.body.data.paymentStatus).toBe('PAID');
    expect(res.body.data.fulfillmentStatus).toBe('PROCESSING');

    const updatedSuborder = await Suborder.findById(suborder._id);
    expect(updatedSuborder!.paymentStatus).toBe('PAID');
    expect(updatedSuborder!.fulfillmentStatus).toBe('PROCESSING');
  });

  it('TC-PAY-06: Seller rejects receipt with reason: transitions suborder to PAYMENT_REJECTED', async () => {
    const masterOrder = await Order.create({
      orderNumber: 'ORD-20261118-0015',
      customerId: new mongoose.Types.ObjectId(customerId),
      customerEmail: 'buyer.pay@autodock.lk',
      shippingAddress: {
        fullName: 'Buyer Pay',
        phone: '+94779991111',
        street: '10 Queens Rd',
        city: 'Kandy',
        district: 'Kandy',
        postalCode: '20000',
      },
      suborderIds: [],
      suborderCount: 1,
      totalProductAmountInCents: 150000,
      totalDeliveryFeeInCents: 45000,
      finalPayableAmountInCents: 195000,
      currency: 'LKR',
      overallStatus: 'PENDING_PAYMENT',
    });

    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0015-01',
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
      sellerBusinessName: 'Kandy Auto Spares (Pvt) Ltd',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Bosch Oil Filter',
          sku: 'BOS-OF-01',
          unitPriceInCents: 150000,
          quantity: 1,
          totalPriceInCents: 150000,
        },
      ],
      subtotalInCents: 150000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 195000,
      commissionableBaseInCents: 150000,
      currency: 'LKR',
      paymentMethod: 'BANK_TRANSFER',
      paymentStatus: 'PAYMENT_PENDING_VERIFICATION',
      fulfillmentStatus: 'AWAITING_FULFILLMENT',
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Kandy',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
      rejectionCount: 0,
    });

    await PaymentSlip.create({
      suborderId: suborder._id,
      orderId: masterOrder._id,
      customerId: new mongoose.Types.ObjectId(customerId),
      sellerId: new mongoose.Types.ObjectId(seller1ProfileId),
      storageKey: 'suborder_test_slip_02.pdf',
      originalFileName: 'illegible_slip.pdf',
      mimeType: 'application/pdf',
      fileSizeBytes: 2048,
      depositedAmountInCents: 195000,
      verificationStatus: 'PENDING_VERIFICATION',
    });

    // Rejection without reason should fail validation (400)
    const resFail = await request(app)
      .post(`/api/v1/seller/suborders/${suborder._id}/receipt/verify`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ action: 'REJECT' });

    expect(resFail.status).toBe(400);

    // Rejection with reason
    const res = await request(app)
      .post(`/api/v1/seller/suborders/${suborder._id}/receipt/verify`)
      .set('Authorization', `Bearer ${seller1Token}`)
      .send({ action: 'REJECT', rejectionReason: 'Transfer amount does not match suborder amount due' });

    expect(res.status).toBe(200);
    expect(res.body.data.verificationStatus).toBe('REJECTED');
    expect(res.body.data.paymentStatus).toBe('PAYMENT_REJECTED');

    const updatedSuborder = await Suborder.findById(suborder._id);
    expect(updatedSuborder!.paymentStatus).toBe('PAYMENT_REJECTED');
    expect(updatedSuborder!.rejectionCount).toBe(1);
  });
});
