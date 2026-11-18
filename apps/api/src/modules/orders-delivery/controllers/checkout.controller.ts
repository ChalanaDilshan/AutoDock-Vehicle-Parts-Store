import { Request, Response, NextFunction } from 'express';
import { checkoutService } from '../services/checkout.service.js';
import { CheckoutQuoteSchema, PlaceOrderSchema } from '../validators/checkout.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class CheckoutController {
  public async getQuote(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CheckoutQuoteSchema.parse(req.body);
      const quote = await checkoutService.generateQuote(req.user!.userId, validated);

      sendSuccess({
        res,
        statusCode: 200,
        code: 'QUOTE_GENERATED',
        message: 'Checkout quote generated successfully',
        data: quote,
      });
    } catch (err) {
      next(err);
    }
  }

  public async placeOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = PlaceOrderSchema.parse(req.body);
      const idempotencyKey = req.headers['idempotency-key'] as string | undefined;

      const result = await checkoutService.placeOrder(
        req.user!.userId,
        req.user!.email,
        validated,
        idempotencyKey
      );

      sendSuccess({
        res,
        statusCode: 201,
        code: 'ORDER_PLACED',
        message: `Order placed successfully across ${result.suborders.length} participating seller(s)`,
        data: {
          orderId: result.order._id.toString(),
          orderNumber: result.order.orderNumber,
          overallStatus: result.order.overallStatus,
          finalPayableAmountInCents: result.order.finalPayableAmountInCents,
          currency: result.order.currency,
          suborders: result.suborders.map((sub) => ({
            suborderId: sub._id.toString(),
            suborderNumber: sub.suborderNumber,
            sellerId: sub.sellerId.toString(),
            businessName: sub.sellerBusinessName,
            status: sub.fulfillmentStatus,
            paymentMethod: sub.paymentMethod,
            paymentStatus: sub.paymentStatus,
            totalPayableInCents: sub.totalPayableInCents,
            requiresSlipUpload: sub.paymentMethod === 'BANK_TRANSFER',
          })),
          createdAt: result.order.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const checkoutController = new CheckoutController();
