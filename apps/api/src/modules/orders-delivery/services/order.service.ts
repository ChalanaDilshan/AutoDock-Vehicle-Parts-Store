import mongoose from 'mongoose';
import { Order, IOrder, OrderOverallStatus } from '../models/order.model.js';
import { Suborder, ISuborder, SuborderFulfillmentStatus } from '../models/suborder.model.js';
import { productPublicService } from '../../customer-experience/contracts/product.contract.js';
import {
  OrderQueryInput,
  UpdateSuborderStatusInput,
  CancelSuborderInput,
} from '../validators/order.validator.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import { logger } from '../../../shared/utils/logger.js';

export class OrderService {
  /**
   * Helper: calculates and updates master order overall status from its suborders.
   */
  public async recalculateMasterOrderStatus(orderId: mongoose.Types.ObjectId | string): Promise<OrderOverallStatus> {
    const masterOrder = await Order.findById(orderId);
    if (!masterOrder) return 'IN_PROGRESS';

    const suborders = await Suborder.find({ orderId: masterOrder._id });
    if (suborders.length === 0) return masterOrder.overallStatus;

    let newStatus: OrderOverallStatus = 'IN_PROGRESS';

    const allCancelled = suborders.every((s) => s.fulfillmentStatus === 'CANCELLED');
    const allDelivered = suborders.every((s) => s.fulfillmentStatus === 'DELIVERED');
    const allPendingPayment = suborders.every(
      (s) =>
        s.fulfillmentStatus === 'AWAITING_FULFILLMENT' &&
        (s.paymentStatus === 'PENDING_PAYMENT' || s.paymentStatus === 'PAYMENT_PENDING_VERIFICATION')
    );
    const anyDelivered = suborders.some((s) => s.fulfillmentStatus === 'DELIVERED');

    if (allCancelled) {
      newStatus = 'CANCELLED';
    } else if (allDelivered) {
      newStatus = 'COMPLETED';
    } else if (allPendingPayment) {
      newStatus = 'PENDING_PAYMENT';
    } else if (anyDelivered) {
      newStatus = 'PARTIALLY_DELIVERED';
    } else {
      newStatus = 'IN_PROGRESS';
    }

    if (masterOrder.overallStatus !== newStatus) {
      masterOrder.overallStatus = newStatus;
      masterOrder.statusHistory.push({
        status: newStatus,
        actorRole: 'SYSTEM',
        notes: `Rollup status updated based on suborders state transition`,
        timestamp: new Date(),
      });
      await masterOrder.save();
    }

    return newStatus;
  }

  /**
   * Customer: Get list of own orders.
   */
  public async getCustomerOrders(
    customerId: string,
    query: OrderQueryInput
  ): Promise<{ orders: IOrder[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {
      customerId: new mongoose.Types.ObjectId(customerId),
    };

    if (query.status) {
      filter.overallStatus = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('suborderIds')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      Order.countDocuments(filter),
    ]);

    return { orders, total, page: query.page, limit: query.limit };
  }

  /**
   * Customer: Get single order by ID with BOLA protection.
   */
  public async getCustomerOrderById(customerId: string, orderId: string): Promise<IOrder> {
    const order = await Order.findById(orderId).populate('suborderIds');
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }

    if (order.customerId.toString() !== customerId) {
      throw new AppError('You do not have permission to access this order', 403, 'FORBIDDEN');
    }

    return order;
  }

  /**
   * Customer: Get single suborder by ID with BOLA protection.
   */
  public async getCustomerSuborderById(customerId: string, suborderId: string): Promise<ISuborder> {
    const suborder = await Suborder.findById(suborderId);
    if (!suborder) {
      throw new AppError('Suborder not found', 404, 'SUBORDER_NOT_FOUND');
    }

    if (suborder.customerId.toString() !== customerId) {
      throw new AppError('You do not have permission to access this suborder', 403, 'FORBIDDEN');
    }

    return suborder;
  }

  /**
   * Seller: List suborders assigned to authenticated seller.
   */
  public async getSellerSuborders(
    sellerId: string,
    query: OrderQueryInput
  ): Promise<{ suborders: ISuborder[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {
      sellerId: new mongoose.Types.ObjectId(sellerId),
    };

    if (query.status) {
      filter.fulfillmentStatus = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    const [suborders, total] = await Promise.all([
      Suborder.find(filter).sort({ createdAt: -1 }).skip(skip).limit(query.limit),
      Suborder.countDocuments(filter),
    ]);

    return { suborders, total, page: query.page, limit: query.limit };
  }

  /**
   * Seller: Get single suborder by ID with strict tenant isolation.
   */
  public async getSellerSuborderById(sellerId: string, suborderId: string): Promise<ISuborder> {
    const suborder = await Suborder.findById(suborderId);
    if (!suborder) {
      throw new AppError('Suborder not found', 404, 'SUBORDER_NOT_FOUND');
    }

    if (suborder.sellerId.toString() !== sellerId) {
      throw new AppError('You do not have permission to access this suborder', 403, 'FORBIDDEN');
    }

    return suborder;
  }

  /**
   * Seller: Progress fulfillment status (PROCESSING -> READY_FOR_DISPATCH -> DISPATCHED -> DELIVERED).
   */
  public async updateSuborderFulfillmentStatus(
    sellerId: string,
    suborderId: string,
    input: UpdateSuborderStatusInput
  ): Promise<ISuborder> {
    const suborder = await Suborder.findById(suborderId);
    if (!suborder) {
      throw new AppError('Suborder not found', 404, 'SUBORDER_NOT_FOUND');
    }

    if (suborder.sellerId.toString() !== sellerId) {
      throw new AppError('You do not have permission to update this suborder', 403, 'FORBIDDEN');
    }

    const currentStatus = suborder.fulfillmentStatus;
    const requestedStatus = input.status;

    // Validate State Machine Transition
    const allowedTransitions: Record<SuborderFulfillmentStatus, SuborderFulfillmentStatus[]> = {
      AWAITING_FULFILLMENT: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['READY_FOR_DISPATCH', 'CANCELLED'],
      READY_FOR_DISPATCH: ['DISPATCHED', 'CANCELLED'],
      DISPATCHED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!allowedTransitions[currentStatus]?.includes(requestedStatus)) {
      throw new AppError(
        `Invalid status transition from '${currentStatus}' to '${requestedStatus}'`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Payment condition: Non-COD orders must be PAID before dispatching
    if (requestedStatus === 'DISPATCHED' && suborder.paymentMethod !== 'COD' && suborder.paymentStatus !== 'PAID') {
      throw new AppError(
        'Cannot dispatch suborder before payment is verified and confirmed',
        400,
        'PAYMENT_NOT_CONFIRMED'
      );
    }

    // Apply Courier details when dispatching
    if (requestedStatus === 'DISPATCHED' && input.courierDetails) {
      suborder.courierDetails = {
        courierName: input.courierDetails.courierName,
        trackingNumber: input.courierDetails.trackingNumber,
        trackingUrl: input.courierDetails.trackingUrl,
        dispatchedAt: new Date(),
      };
    }

    // If delivered
    if (requestedStatus === 'DELIVERED') {
      suborder.deliveredAt = new Date();
      // If COD, delivery implies collection of cash remittance
      if (suborder.paymentMethod === 'COD') {
        suborder.paymentStatus = 'COLLECTED';
        suborder.paidAt = new Date();
      }
    }

    // If cancelled: release inventory back to MOD-02
    if (requestedStatus === 'CANCELLED') {
      suborder.cancelledAt = new Date();
      suborder.cancellationReason = input.sellerNotes || 'Cancelled by seller';
      const releaseItems = suborder.items.map((it) => ({
        productId: it.productId.toString(),
        quantity: it.quantity,
      }));
      await productPublicService.releaseStock(releaseItems);
    }

    suborder.fulfillmentStatus = requestedStatus;
    suborder.statusHistory.push({
      fromFulfillmentStatus: currentStatus,
      toFulfillmentStatus: requestedStatus,
      paymentStatus: suborder.paymentStatus,
      actorRole: 'SELLER',
      actorId: sellerId,
      notes: input.sellerNotes,
      timestamp: new Date(),
    });

    await suborder.save();

    // Recompute master order rollup
    await this.recalculateMasterOrderStatus(suborder.orderId);

    logger.info(`[OrderService] Suborder ${suborder.suborderNumber} transitioned: ${currentStatus} -> ${requestedStatus}`, {
      suborderId: suborder._id.toString(),
      paymentStatus: suborder.paymentStatus,
    });

    return suborder;
  }

  /**
   * Customer: Cancel unpaid / unfulfilled suborder.
   */
  public async cancelSuborder(
    customerId: string,
    suborderId: string,
    input: CancelSuborderInput
  ): Promise<ISuborder> {
    const suborder = await Suborder.findById(suborderId);
    if (!suborder) {
      throw new AppError('Suborder not found', 404, 'SUBORDER_NOT_FOUND');
    }

    if (suborder.customerId.toString() !== customerId) {
      throw new AppError('You do not have permission to cancel this suborder', 403, 'FORBIDDEN');
    }

    // Can only cancel if not yet dispatched or delivered
    const cancellableStatuses: SuborderFulfillmentStatus[] = ['AWAITING_FULFILLMENT', 'PROCESSING'];
    if (!cancellableStatuses.includes(suborder.fulfillmentStatus)) {
      throw new AppError(
        `Cannot cancel suborder in '${suborder.fulfillmentStatus}' status`,
        400,
        'SUBORDER_NOT_CANCELLABLE'
      );
    }

    const oldStatus = suborder.fulfillmentStatus;
    suborder.fulfillmentStatus = 'CANCELLED';
    suborder.cancelledAt = new Date();
    suborder.cancellationReason = input.reason || 'Cancelled by customer';

    // Release inventory
    const releaseItems = suborder.items.map((it) => ({
      productId: it.productId.toString(),
      quantity: it.quantity,
    }));
    await productPublicService.releaseStock(releaseItems);

    suborder.statusHistory.push({
      fromFulfillmentStatus: oldStatus,
      toFulfillmentStatus: 'CANCELLED',
      paymentStatus: suborder.paymentStatus,
      actorRole: 'CUSTOMER',
      actorId: customerId,
      notes: input.reason,
      timestamp: new Date(),
    });

    await suborder.save();

    await this.recalculateMasterOrderStatus(suborder.orderId);

    logger.info(`[OrderService] Customer cancelled suborder ${suborder.suborderNumber}`, {
      suborderId: suborder._id.toString(),
    });

    return suborder;
  }

  /**
   * Admin: List platform orders with pagination.
   */
  public async getAdminOrders(
    query: OrderQueryInput
  ): Promise<{ orders: IOrder[]; total: number; page: number; limit: number }> {
    const filter: Record<string, unknown> = {};
    if (query.status) {
      filter.overallStatus = query.status;
    }

    const skip = (query.page - 1) * query.limit;

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('suborderIds')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(query.limit),
      Order.countDocuments(filter),
    ]);

    return { orders, total, page: query.page, limit: query.limit };
  }

  /**
   * Admin: Get order details by ID.
   */
  public async getAdminOrderById(orderId: string): Promise<IOrder> {
    const order = await Order.findById(orderId).populate('suborderIds');
    if (!order) {
      throw new AppError('Order not found', 404, 'ORDER_NOT_FOUND');
    }
    return order;
  }
}

export const orderService = new OrderService();
