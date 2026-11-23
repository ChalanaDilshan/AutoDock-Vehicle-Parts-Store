import mongoose from 'mongoose';
import { Suborder } from '../models/suborder.model.js';
import { IOrderPublicContract, orderVerificationService } from '../../customer-experience/contracts/orderConsumer.contract.js';
import { logger } from '../../../shared/utils/logger.js';

export interface ISuborderDeliveredFinancialEvent {
  suborderId: string;
  orderId: string;
  sellerId: string;
  productSubtotalInCents: number;
  sellerDiscountInCents: number;
  platformDiscountInCents: number;
  deliveryFeeInCents: number;
  totalPayableInCents: number;
  commissionableBaseInCents: number;
  deliveredAt: Date;
}

export class OrderPublicService implements IOrderPublicContract {
  /**
   * Verified Purchaser Review Gate (Consumed by MOD-02 Review Service).
   * Verifies that the given customer has an authentic completed, delivered purchase of the product.
   */
  public async verifyDeliveredPurchase(
    userId: string,
    productId: string,
    suborderId: string
  ): Promise<{ isDelivered: boolean; deliveredAt?: Date; reason?: string }> {
    if (!mongoose.Types.ObjectId.isValid(suborderId)) {
      return { isDelivered: false, reason: 'Invalid suborder ID format' };
    }

    const suborder = await Suborder.findById(suborderId);
    if (!suborder) {
      return { isDelivered: false, reason: 'No suborder record found matching ID' };
    }

    // Must belong to the claiming customer
    if (suborder.customerId.toString() !== userId) {
      return { isDelivered: false, reason: 'Suborder does not belong to the authenticated user' };
    }

    // Must be delivered
    if (suborder.fulfillmentStatus !== 'DELIVERED') {
      return {
        isDelivered: false,
        reason: `Suborder is currently in '${suborder.fulfillmentStatus}' state. Product must be delivered.`,
      };
    }

    // Must contain the specific product
    const hasProduct = suborder.items.some((it) => it.productId.toString() === productId);
    if (!hasProduct) {
      return {
        isDelivered: false,
        reason: 'The specified product was not purchased in this suborder',
      };
    }

    return {
      isDelivered: true,
      deliveredAt: suborder.deliveredAt || suborder.updatedAt,
    };
  }

  /**
   * Emits financial completion event for MOD-04 commission ledger processing.
   * Delivery charges are strictly excluded from the commissionable base.
   */
  public async emitDeliveredFinancialEvent(event: ISuborderDeliveredFinancialEvent): Promise<void> {
    logger.info('[OrderPublicService] Emitting delivered suborder financial event to MOD-04', {
      suborderId: event.suborderId,
      commissionableBaseInCents: event.commissionableBaseInCents,
      deliveryFeeInCents: event.deliveryFeeInCents,
    });
    // In future MOD-04 prompt, finance module listens or registers a subscriber here
  }
}

export const orderPublicService = new OrderPublicService();

// Register this implementation as the live provider for MOD-02
orderVerificationService.registerProvider(orderPublicService);
