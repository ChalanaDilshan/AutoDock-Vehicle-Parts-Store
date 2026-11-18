import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { cardGatewayService } from '../services/cardGateway.service.js';
import {
  InitiateCardPaymentSchema,
  CardWebhookSchema,
} from '../validators/payment.validator.js';
import { env } from '../../../config/env.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class PaymentController {
  public async initiateCardSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = InitiateCardPaymentSchema.parse(req.body);
      const session = await cardGatewayService.initiateSession(
        req.user!.userId,
        validated.suborderId
      );

      sendSuccess({
        res,
        statusCode: 200,
        code: 'PAYMENT_SESSION_INITIATED',
        message: 'Card sandbox payment session initiated',
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }

  public async handleCardWebhook(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const signature = req.headers['x-gateway-signature'] as string | undefined;
      const rawBody = JSON.stringify(req.body);
      const validated = CardWebhookSchema.parse(req.body);

      const result = await cardGatewayService.processWebhook(signature, rawBody, validated);

      sendSuccess({
        res,
        code: 'WEBHOOK_PROCESSED',
        message: 'Webhook processed successfully',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Sandbox simulator callback generator (Useful for automated QA and local dev testing).
   */
  public async simulateWebhookCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CardWebhookSchema.parse(req.body);
      const secret = process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || env.JWT_ACCESS_SECRET;
      const rawBody = JSON.stringify(validated);
      const signature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

      const result = await cardGatewayService.processWebhook(signature, rawBody, validated);

      sendSuccess({
        res,
        code: 'SIMULATION_COMPLETED',
        message: 'Sandbox payment simulation processed',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const paymentController = new PaymentController();
