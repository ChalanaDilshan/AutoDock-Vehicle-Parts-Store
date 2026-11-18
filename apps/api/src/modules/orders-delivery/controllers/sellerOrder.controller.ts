import { Request, Response, NextFunction } from 'express';
import { orderService } from '../services/order.service.js';
import { paymentService } from '../services/payment.service.js';
import { OrderQuerySchema, UpdateSuborderStatusSchema } from '../validators/order.validator.js';
import { VerifyReceiptSchema } from '../validators/payment.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

export function resolveSellerId(req: Request): string {
  const sellerId = req.user?.sellerId || (req.user?.role === 'SELLER' ? req.user.userId : null);
  if (!sellerId) {
    throw new AppError('Seller profile required to access this endpoint', 403, 'SELLER_PROFILE_REQUIRED');
  }
  return sellerId;
}

export class SellerOrderController {
  public async getMySuborders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = resolveSellerId(req);
      const query = OrderQuerySchema.parse(req.query);
      const result = await orderService.getSellerSuborders(sellerId, query);

      sendSuccess({
        res,
        data: result.suborders,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getMySuborderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = resolveSellerId(req);
      const suborder = await orderService.getSellerSuborderById(sellerId, req.params.suborderId);

      sendSuccess({
        res,
        data: suborder,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateFulfillmentStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = resolveSellerId(req);
      const validated = UpdateSuborderStatusSchema.parse(req.body);
      const suborder = await orderService.updateSuborderFulfillmentStatus(
        sellerId,
        req.params.suborderId,
        validated
      );

      sendSuccess({
        res,
        code: 'SUBORDER_STATUS_UPDATED',
        message: `Fulfillment status updated to '${suborder.fulfillmentStatus}'`,
        data: suborder,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = resolveSellerId(req);
      const result = await paymentService.getReceiptForSeller(sellerId, req.params.suborderId);

      sendSuccess({
        res,
        data: {
          receiptId: result.slip._id.toString(),
          suborderId: result.slip.suborderId.toString(),
          originalFileName: result.slip.originalFileName,
          mimeType: result.slip.mimeType,
          fileSizeBytes: result.slip.fileSizeBytes,
          depositedAmountInCents: result.slip.depositedAmountInCents,
          referenceNumber: result.slip.referenceNumber,
          verificationStatus: result.slip.verificationStatus,
          rejectionReason: result.slip.rejectionReason,
          uploadedAt: result.slip.createdAt,
          viewUrl: result.viewUrl.viewUrl,
          expiresInSeconds: result.viewUrl.expiresInSeconds,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async verifyReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = resolveSellerId(req);
      const validated = VerifyReceiptSchema.parse(req.body);
      const result = await paymentService.verifyReceipt(sellerId, req.params.suborderId, validated);

      sendSuccess({
        res,
        code: 'RECEIPT_VERIFIED',
        message: `Payment receipt has been ${result.slip.verificationStatus.toLowerCase()}`,
        data: {
          suborderId: result.suborder._id.toString(),
          paymentStatus: result.suborder.paymentStatus,
          fulfillmentStatus: result.suborder.fulfillmentStatus,
          verificationStatus: result.slip.verificationStatus,
          rejectionReason: result.slip.rejectionReason,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const sellerOrderController = new SellerOrderController();
