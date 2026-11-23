import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { orderPublicService } from '../../../src/modules/orders-delivery/contracts/order.contract.js';
import { orderVerificationService } from '../../../src/modules/customer-experience/contracts/orderConsumer.contract.js';
import { Suborder } from '../../../src/modules/orders-delivery/models/suborder.model.js';

describe('MOD-03 Cross-Module Public Contract Tests (MOD-02 Integration)', () => {
  const testDbUri = 'mongodb://localhost:27017/autodock_test_contracts';

  const buyerId = new mongoose.Types.ObjectId().toString();
  const foreignBuyerId = new mongoose.Types.ObjectId().toString();
  const sellerId = new mongoose.Types.ObjectId().toString();
  const productId = new mongoose.Types.ObjectId().toString();
  const otherProductId = new mongoose.Types.ObjectId().toString();

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);
    orderVerificationService.registerProvider(orderPublicService);
  });

  afterAll(async () => {
    await Suborder.deleteMany({});
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Suborder.deleteMany({});
  });

  it('TC-CON-01: Returns isDelivered: true when buyer has a DELIVERED suborder containing the product', async () => {
    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0099-01',
      orderId: new mongoose.Types.ObjectId(),
      customerId: new mongoose.Types.ObjectId(buyerId),
      sellerId: new mongoose.Types.ObjectId(sellerId),
      sellerBusinessName: 'Test Seller Store',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Purchased Item',
          sku: 'SKU-001',
          unitPriceInCents: 100000,
          quantity: 1,
          totalPriceInCents: 100000,
        },
      ],
      subtotalInCents: 100000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 145000,
      commissionableBaseInCents: 100000,
      currency: 'LKR',
      paymentMethod: 'COD',
      paymentStatus: 'COLLECTED',
      fulfillmentStatus: 'DELIVERED',
      deliveredAt: new Date(),
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Colombo',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    // Test through MOD-02 consumer adapter
    const result = await orderVerificationService.verifyDeliveredPurchase(
      buyerId,
      productId,
      suborder._id.toString()
    );

    expect(result.isDelivered).toBe(true);
    expect(result.deliveredAt).toBeDefined();
  });

  it('TC-CON-02: Rejects claim if suborder is not yet delivered (e.g. PROCESSING or DISPATCHED)', async () => {
    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0099-02',
      orderId: new mongoose.Types.ObjectId(),
      customerId: new mongoose.Types.ObjectId(buyerId),
      sellerId: new mongoose.Types.ObjectId(sellerId),
      sellerBusinessName: 'Test Seller Store',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Purchased Item',
          sku: 'SKU-001',
          unitPriceInCents: 100000,
          quantity: 1,
          totalPriceInCents: 100000,
        },
      ],
      subtotalInCents: 100000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 145000,
      commissionableBaseInCents: 100000,
      currency: 'LKR',
      paymentMethod: 'COD',
      paymentStatus: 'PENDING_COLLECTION',
      fulfillmentStatus: 'DISPATCHED',
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Colombo',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    const result = await orderVerificationService.verifyDeliveredPurchase(
      buyerId,
      productId,
      suborder._id.toString()
    );

    expect(result.isDelivered).toBe(false);
    expect(result.reason).toContain('DISPATCHED');
  });

  it('TC-CON-03: Rejects claim if suborder belongs to another customer', async () => {
    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0099-03',
      orderId: new mongoose.Types.ObjectId(),
      customerId: new mongoose.Types.ObjectId(foreignBuyerId), // Foreign buyer
      sellerId: new mongoose.Types.ObjectId(sellerId),
      sellerBusinessName: 'Test Seller Store',
      items: [
        {
          productId: new mongoose.Types.ObjectId(productId),
          title: 'Purchased Item',
          sku: 'SKU-001',
          unitPriceInCents: 100000,
          quantity: 1,
          totalPriceInCents: 100000,
        },
      ],
      subtotalInCents: 100000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 145000,
      commissionableBaseInCents: 100000,
      currency: 'LKR',
      paymentMethod: 'COD',
      paymentStatus: 'COLLECTED',
      fulfillmentStatus: 'DELIVERED',
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Colombo',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    const result = await orderVerificationService.verifyDeliveredPurchase(
      buyerId, // Current user is NOT foreignBuyerId
      productId,
      suborder._id.toString()
    );

    expect(result.isDelivered).toBe(false);
    expect(result.reason).toContain('does not belong to the authenticated user');
  });

  it('TC-CON-04: Rejects claim if delivered suborder does not contain the requested product', async () => {
    const suborder = await Suborder.create({
      suborderNumber: 'ORD-20261118-0099-04',
      orderId: new mongoose.Types.ObjectId(),
      customerId: new mongoose.Types.ObjectId(buyerId),
      sellerId: new mongoose.Types.ObjectId(sellerId),
      sellerBusinessName: 'Test Seller Store',
      items: [
        {
          productId: new mongoose.Types.ObjectId(otherProductId), // Different product
          title: 'Different Item',
          sku: 'SKU-DIFF',
          unitPriceInCents: 100000,
          quantity: 1,
          totalPriceInCents: 100000,
        },
      ],
      subtotalInCents: 100000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 45000,
      totalPayableInCents: 145000,
      commissionableBaseInCents: 100000,
      currency: 'LKR',
      paymentMethod: 'COD',
      paymentStatus: 'COLLECTED',
      fulfillmentStatus: 'DELIVERED',
      deliveryRateSnapshot: {
        rateId: 'r-01',
        district: 'Colombo',
        feeInCents: 45000,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
      },
    });

    const result = await orderVerificationService.verifyDeliveredPurchase(
      buyerId,
      productId,
      suborder._id.toString()
    );

    expect(result.isDelivered).toBe(false);
    expect(result.reason).toContain('was not purchased in this suborder');
  });
});
