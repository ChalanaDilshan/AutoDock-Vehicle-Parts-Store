import crypto from 'crypto';
import mongoose from 'mongoose';
import { Order, IOrder, OrderOverallStatus } from '../models/order.model.js';
import { Suborder, ISuborder, SuborderPaymentMethod, SuborderPaymentStatus } from '../models/suborder.model.js';
import { deliveryRateService } from './deliveryRate.service.js';
import { productPublicService } from '../../customer-experience/contracts/product.contract.js';
import { identityPublicService } from '../../identity/contracts/identity.contract.js';
import { CheckoutQuoteInput, PlaceOrderInput } from '../validators/checkout.validator.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import { logger } from '../../../shared/utils/logger.js';

export interface SellerSuborderQuoteDTO {
  sellerId: string;
  businessName: string;
  productSubtotalInCents: number;
  sellerDiscountInCents: number;
  platformDiscountInCents: number;
  deliveryFeeInCents: number;
  totalSuborderInCents: number;
  deliveryRateId: string;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  items: Array<{
    productId: string;
    title: string;
    sku: string;
    quantity: number;
    unitPriceInCents: number;
    totalPriceInCents: number;
  }>;
}

export interface CheckoutQuoteResponseDTO {
  totalProductAmountInCents: number;
  totalSellerDiscountInCents: number;
  totalPlatformDiscountInCents: number;
  totalDeliveryFeeInCents: number;
  finalPayableAmountInCents: number;
  currency: string;
  shippingDistrict: string;
  sellerSuborderQuotes: SellerSuborderQuoteDTO[];
}

function supportsTransactions(): boolean {
  const description = (mongoose.connection as any).client?.topology?.description;
  if (!description) return false;
  return (
    description.type === 'ReplicaSetWithPrimary' ||
    description.type === 'Sharded' ||
    Boolean(description.setName)
  );
}

export class CheckoutService {
  /**
   * Generates authoritative server-side checkout price quote, stock validation,
   * and district delivery calculation partitioned by seller.
   */
  public async generateQuote(
    customerId: string,
    input: CheckoutQuoteInput
  ): Promise<CheckoutQuoteResponseDTO> {
    const cart = await productPublicService.getCartForCheckout(customerId);
    if (!cart || cart.sellerGroups.length === 0) {
      throw new AppError('Your cart is empty', 400, 'EMPTY_CART');
    }

    const allItems = cart.sellerGroups.flatMap((group) =>
      group.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }))
    );

    // 1. Authoritative Stock and Product Availability Validation
    const stockValidation = await productPublicService.verifyAndReserveStock(allItems);
    if (!stockValidation.isAvailable) {
      const errorList = stockValidation.insufficientItems?.map((it) => ({
        field: it.productId,
        message: `Requested ${it.requestedQuantity}, but only ${it.availableStock} in stock`,
        code: 'INSUFFICIENT_STOCK',
      }));
      throw new AppError(
        'One or more items in your cart are no longer available in the requested quantity',
        409,
        'INSUFFICIENT_STOCK',
        errorList
      );
    }

    let totalProductAmountInCents = 0;
    let totalDeliveryFeeInCents = 0;
    const sellerQuotes: SellerSuborderQuoteDTO[] = [];

    // 2. Validate Sellers and Resolve Delivery Rates
    for (const sellerGroup of cart.sellerGroups) {
      const sellerId = sellerGroup.sellerId;

      // Verify seller is approved and active in MOD-01
      const isSellerActive = await identityPublicService.isSellerActiveForOrder(sellerId);
      if (!isSellerActive) {
        throw new AppError(
          `Seller is currently not eligible to receive orders`,
          422,
          'INACTIVE_SELLER',
          [{ field: 'sellerId', message: `Seller ${sellerId} is not active` }]
        );
      }

      // Resolve approved active delivery rate for the shipping district
      const rate = await deliveryRateService.resolveDeliveryRate(sellerId, input.shippingDistrict);
      if (!rate) {
        const sellerProfile = await identityPublicService.getSellerPublicProfile(sellerId);
        const name = sellerProfile?.businessName || 'Seller';
        throw new AppError(
          `${name} does not deliver to ${input.shippingDistrict}. Please remove items from this seller to proceed.`,
          422,
          'DELIVERY_UNAVAILABLE',
          [{ field: 'shippingDistrict', message: `Delivery unavailable to ${input.shippingDistrict}` }]
        );
      }

      const sellerProfile = await identityPublicService.getSellerPublicProfile(sellerId);
      const businessName = sellerProfile?.businessName || 'Auto Parts Seller';

      const items = sellerGroup.items.map((item) => ({
        productId: item.productId,
        title: item.title,
        sku: item.sku,
        quantity: item.quantity,
        unitPriceInCents: item.priceInCents,
        totalPriceInCents: item.priceInCents * item.quantity,
      }));

      const productSubtotalInCents = items.reduce((sum, it) => sum + it.totalPriceInCents, 0);
      const deliveryFeeInCents = rate.feeInCents;
      const sellerDiscountInCents = 0;
      const platformDiscountInCents = 0;
      const totalSuborderInCents =
        productSubtotalInCents - sellerDiscountInCents - platformDiscountInCents + deliveryFeeInCents;

      totalProductAmountInCents += productSubtotalInCents;
      totalDeliveryFeeInCents += deliveryFeeInCents;

      sellerQuotes.push({
        sellerId,
        businessName,
        productSubtotalInCents,
        sellerDiscountInCents,
        platformDiscountInCents,
        deliveryFeeInCents,
        totalSuborderInCents,
        deliveryRateId: rate._id.toString(),
        estimatedDaysMin: rate.estimatedDaysMin,
        estimatedDaysMax: rate.estimatedDaysMax,
        items,
      });
    }

    const finalPayableAmountInCents = totalProductAmountInCents + totalDeliveryFeeInCents;

    return {
      totalProductAmountInCents,
      totalSellerDiscountInCents: 0,
      totalPlatformDiscountInCents: 0,
      totalDeliveryFeeInCents,
      finalPayableAmountInCents,
      currency: 'LKR',
      shippingDistrict: input.shippingDistrict,
      sellerSuborderQuotes: sellerQuotes,
    };
  }

  /**
   * Executes atomic checkout order placement:
   * 1. Revalidates cart, items, stock, sellers, delivery rates.
   * 2. Atomically decrements stock in MOD-02.
   * 3. Creates 1 master Order and N Suborders.
   * 4. Clears customer cart upon successful placement.
   */
  public async placeOrder(
    customerId: string,
    customerEmail: string,
    input: PlaceOrderInput,
    idempotencyKey?: string
  ): Promise<{ order: IOrder; suborders: ISuborder[] }> {
    // Check Idempotency Key Replay Protection
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        logger.info(`[CheckoutService] Idempotency key match: returning existing order ${existingOrder.orderNumber}`);
        const existingSuborders = await Suborder.find({ orderId: existingOrder._id });
        return { order: existingOrder, suborders: existingSuborders };
      }
    }

    // 1. Fetch live cart
    const cart = await productPublicService.getCartForCheckout(customerId);
    if (!cart || cart.sellerGroups.length === 0) {
      throw new AppError('Your cart is empty', 400, 'EMPTY_CART');
    }

    const commitItems = cart.sellerGroups.flatMap((group) =>
      group.items.map((it) => ({
        productId: it.productId,
        quantity: it.quantity,
      }))
    );

    // 2. Authoritative Price & Stock Revalidation
    const stockValidation = await productPublicService.verifyAndReserveStock(commitItems);
    if (!stockValidation.isAvailable) {
      const errorList = stockValidation.insufficientItems?.map((it) => ({
        field: it.productId,
        message: `Requested ${it.requestedQuantity}, but only ${it.availableStock} in stock`,
        code: 'INSUFFICIENT_STOCK',
      }));
      throw new AppError(
        'One or more items in your cart are no longer available in the requested quantity',
        409,
        'INSUFFICIENT_STOCK',
        errorList
      );
    }

    // 3. Revalidate Sellers & Delivery Rates
    const preparedSubordersData: Array<{
      sellerId: string;
      businessName: string;
      items: Array<{
        productId: mongoose.Types.ObjectId;
        title: string;
        sku: string;
        unitPriceInCents: number;
        quantity: number;
        totalPriceInCents: number;
      }>;
      subtotalInCents: number;
      sellerDiscountInCents: number;
      platformDiscountInCents: number;
      deliveryFeeInCents: number;
      totalPayableInCents: number;
      commissionableBaseInCents: number;
      paymentMethod: SuborderPaymentMethod;
      paymentStatus: SuborderPaymentStatus;
      deliveryRateSnapshot: {
        rateId: string;
        district: string;
        feeInCents: number;
        estimatedDaysMin: number;
        estimatedDaysMax: number;
      };
    }> = [];

    let totalProductAmountInCents = 0;
    let totalDeliveryFeeInCents = 0;

    for (const sellerGroup of cart.sellerGroups) {
      const sellerId = sellerGroup.sellerId;

      const isSellerActive = await identityPublicService.isSellerActiveForOrder(sellerId);
      if (!isSellerActive) {
        throw new AppError(`Seller is currently not eligible to receive orders`, 422, 'INACTIVE_SELLER', [
          { field: 'sellerId', message: `Seller ${sellerId} is not active` },
        ]);
      }

      const rate = await deliveryRateService.resolveDeliveryRate(sellerId, input.shippingAddress.district);
      if (!rate) {
        const sellerProfile = await identityPublicService.getSellerPublicProfile(sellerId);
        const name = sellerProfile?.businessName || 'Seller';
        throw new AppError(
          `${name} does not deliver to ${input.shippingAddress.district}`,
          422,
          'DELIVERY_UNAVAILABLE',
          [{ field: 'district', message: `Delivery unavailable to ${input.shippingAddress.district}` }]
        );
      }

      const sellerProfile = await identityPublicService.getSellerPublicProfile(sellerId);
      const businessName = sellerProfile?.businessName || 'Auto Parts Seller';

      // Check payment method override for this specific seller
      const override = input.suborderOverrides?.find((o) => o.sellerId === sellerId);
      const suborderPaymentMethod: SuborderPaymentMethod = override?.paymentMethod || input.paymentMethod;

      let suborderPaymentStatus: SuborderPaymentStatus = 'PENDING_PAYMENT';
      if (suborderPaymentMethod === 'COD') {
        suborderPaymentStatus = 'PENDING_COLLECTION';
      }

      const items = sellerGroup.items.map((it) => ({
        productId: new mongoose.Types.ObjectId(it.productId),
        title: it.title,
        sku: it.sku,
        unitPriceInCents: it.priceInCents,
        quantity: it.quantity,
        totalPriceInCents: it.priceInCents * it.quantity,
      }));

      const subtotalInCents = items.reduce((sum, it) => sum + it.totalPriceInCents, 0);
      const sellerDiscountInCents = 0;
      const platformDiscountInCents = 0;
      const deliveryFeeInCents = rate.feeInCents;
      const totalPayableInCents =
        subtotalInCents - sellerDiscountInCents - platformDiscountInCents + deliveryFeeInCents;
      const commissionableBaseInCents = subtotalInCents - sellerDiscountInCents;

      totalProductAmountInCents += subtotalInCents;
      totalDeliveryFeeInCents += deliveryFeeInCents;

      preparedSubordersData.push({
        sellerId,
        businessName,
        items,
        subtotalInCents,
        sellerDiscountInCents,
        platformDiscountInCents,
        deliveryFeeInCents,
        totalPayableInCents,
        commissionableBaseInCents,
        paymentMethod: suborderPaymentMethod,
        paymentStatus: suborderPaymentStatus,
        deliveryRateSnapshot: {
          rateId: rate._id.toString(),
          district: rate.district,
          feeInCents: rate.feeInCents,
          estimatedDaysMin: rate.estimatedDaysMin,
          estimatedDaysMax: rate.estimatedDaysMax,
        },
      });
    }

    const finalPayableAmountInCents = totalProductAmountInCents + totalDeliveryFeeInCents;

    // 4. Session & Transaction Execution
    let session: mongoose.ClientSession | null = null;
    let useTransaction = false;

    if (supportsTransactions()) {
      session = await mongoose.startSession();
      session.startTransaction();
      useTransaction = true;
    }

    try {
      // Step A: Decrement inventory in MOD-02
      const stockCommitSuccess = await productPublicService.decrementStock(
        commitItems,
        useTransaction && session ? session : undefined
      );

      if (!stockCommitSuccess) {
        throw new AppError('Unable to reserve physical stock during order placement', 409, 'STOCK_COMMIT_FAILED');
      }

      // Step B: Generate Order References
      const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
      const orderNumber = `ORD-${todayStr}-${randomSuffix}`;

      // Step C: Master Order Initial Status
      const allCod = preparedSubordersData.every((s) => s.paymentMethod === 'COD');
      const masterOverallStatus: OrderOverallStatus = allCod ? 'IN_PROGRESS' : 'PENDING_PAYMENT';

      const masterOrder = new Order({
        orderNumber,
        customerId: new mongoose.Types.ObjectId(customerId),
        customerEmail,
        shippingAddress: input.shippingAddress,
        suborderIds: [],
        suborderCount: preparedSubordersData.length,
        totalProductAmountInCents,
        totalSellerDiscountInCents: 0,
        totalPlatformDiscountInCents: 0,
        totalDeliveryFeeInCents,
        finalPayableAmountInCents,
        currency: 'LKR',
        overallStatus: masterOverallStatus,
        idempotencyKey,
        notes: input.notes,
        statusHistory: [
          {
            status: masterOverallStatus,
            actorRole: 'CUSTOMER',
            actorId: customerId,
            notes: 'Order placed by customer',
            timestamp: new Date(),
          },
        ],
      });

      // Step D: Create Suborders
      const createdSuborders: ISuborder[] = [];

      for (let i = 0; i < preparedSubordersData.length; i++) {
        const subData = preparedSubordersData[i];
        const suborderNumber = `${orderNumber}-${String(i + 1).padStart(2, '0')}`;

        const suborder = new Suborder({
          suborderNumber,
          orderId: masterOrder._id,
          customerId: new mongoose.Types.ObjectId(customerId),
          sellerId: new mongoose.Types.ObjectId(subData.sellerId),
          sellerBusinessName: subData.businessName,
          items: subData.items,
          subtotalInCents: subData.subtotalInCents,
          sellerDiscountInCents: subData.sellerDiscountInCents,
          platformDiscountInCents: subData.platformDiscountInCents,
          deliveryFeeInCents: subData.deliveryFeeInCents,
          totalPayableInCents: subData.totalPayableInCents,
          commissionableBaseInCents: subData.commissionableBaseInCents,
          currency: 'LKR',
          paymentMethod: subData.paymentMethod,
          paymentStatus: subData.paymentStatus,
          fulfillmentStatus: 'AWAITING_FULFILLMENT',
          deliveryRateSnapshot: subData.deliveryRateSnapshot,
          statusHistory: [
            {
              fromFulfillmentStatus: 'AWAITING_FULFILLMENT',
              toFulfillmentStatus: 'AWAITING_FULFILLMENT',
              paymentStatus: subData.paymentStatus,
              actorRole: 'CUSTOMER',
              actorId: customerId,
              notes: 'Suborder created',
              timestamp: new Date(),
            },
          ],
        });

        if (useTransaction && session) {
          await suborder.save({ session });
        } else {
          await suborder.save();
        }

        createdSuborders.push(suborder);
        masterOrder.suborderIds.push(suborder._id);
      }

      if (useTransaction && session) {
        await masterOrder.save({ session });
      } else {
        await masterOrder.save();
      }

      // Step E: Clear Customer Cart in MOD-02
      await productPublicService.clearCart(customerId, useTransaction && session ? session : undefined);

      if (useTransaction && session) {
        await session.commitTransaction();
      }

      logger.info(`[CheckoutService] Successfully placed order ${masterOrder.orderNumber} with ${createdSuborders.length} suborders`, {
        orderId: masterOrder._id.toString(),
        totalPayableInCents: masterOrder.finalPayableAmountInCents,
      });

      return { order: masterOrder, suborders: createdSuborders };
    } catch (err) {
      if (useTransaction && session) {
        await session.abortTransaction();
      } else {
        // Compensating rollback: release stock back to MOD-02
        await productPublicService.releaseStock(commitItems);
      }
      throw err;
    } finally {
      if (session) {
        await session.endSession();
      }
    }
  }
}

export const checkoutService = new CheckoutService();
