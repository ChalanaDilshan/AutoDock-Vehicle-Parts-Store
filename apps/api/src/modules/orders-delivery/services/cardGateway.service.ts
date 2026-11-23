import crypto from 'crypto';
import { Suborder, ISuborder } from '../models/suborder.model.js';
import { PaymentWebhookEvent } from '../models/paymentWebhookEvent.model.js';
import { orderService } from './order.service.js';
import { CardWebhookInput } from '../validators/payment.validator.js';
import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import { logger } from '../../../shared/utils/logger.js';

export interface CardInitiateSessionDTO {
  suborderId: string;
  suborderNumber: string;
  amountInCents: number;
  currency: string;
  sessionToken: string;
  sandboxGatewayUrl: string;
}

export class CardGatewayService {
  private getWebhookSecret(): string {
    return process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || env.JWT_ACCESS_SECRET;
  }

  /**
   * Generates a sandbox card payment checkout session.
   */
  public async initiateSession(
    customerId: string,
    suborderId: string
  ): Promise<CardInitiateSessionDTO> {
    const suborder = await Suborder.findById(suborderId);
    if (!suborder) {
      throw new AppError('Suborder not found', 404, 'SUBORDER_NOT_FOUND');
    }

    if (suborder.customerId.toString() !== customerId) {
      throw new AppError('You do not have permission to pay for this suborder', 403, 'FORBIDDEN');
    }

    if (suborder.paymentMethod !== 'CARD_SANDBOX') {
      throw new AppError(
        'Card payment initiation is only available for CARD_SANDBOX payment method',
        400,
        'INVALID_PAYMENT_METHOD'
      );
    }

    if (suborder.paymentStatus === 'PAID') {
      throw new AppError('This suborder is already paid', 400, 'ALREADY_PAID');
    }

    const sessionPayload = {
      suborderId: suborder._id.toString(),
      amountInCents: suborder.totalPayableInCents,
      timestamp: Date.now(),
    };

    const sessionToken = crypto
      .createHmac('sha256', this.getWebhookSecret())
      .update(JSON.stringify(sessionPayload))
      .digest('hex');

    const sandboxGatewayUrl = `${env.CLIENT_ORIGIN}/checkout/sandbox-payment?token=${sessionToken}&suborderId=${suborder._id.toString()}&amount=${suborder.totalPayableInCents}`;

    return {
      suborderId: suborder._id.toString(),
      suborderNumber: suborder.suborderNumber,
      amountInCents: suborder.totalPayableInCents,
      currency: 'LKR',
      sessionToken,
      sandboxGatewayUrl,
    };
  }

  /**
   * Processes signed server-to-server webhook callbacks with HMAC verification & deduplication.
   */
  public async processWebhook(
    signature: string | undefined,
    rawBody: string,
    payload: CardWebhookInput
  ): Promise<{ status: string; suborder?: ISuborder }> {
    if (!signature) {
      throw new AppError('Missing gateway signature header', 401, 'UNAUTHORIZED');
    }

    // Verify HMAC-SHA256 signature
    const expectedSignature = crypto
      .createHmac('sha256', this.getWebhookSecret())
      .update(rawBody)
      .digest('hex');

    let isValidSignature = false;
    try {
      isValidSignature = crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch {
      isValidSignature = false;
    }

    if (!isValidSignature) {
      logger.warn('[CardGatewayService] Invalid webhook signature detected');
      throw new AppError('Invalid gateway signature', 401, 'INVALID_SIGNATURE');
    }

    // Deduplication check: Event Idempotency
    const existingEvent = await PaymentWebhookEvent.findOne({ eventId: payload.eventId });
    if (existingEvent) {
      logger.info(`[CardGatewayService] Duplicate webhook event ignored: ${payload.eventId}`);
      return { status: 'ALREADY_PROCESSED' };
    }

    // Record webhook event
    await PaymentWebhookEvent.create({
      eventId: payload.eventId,
      provider: 'CARD_SANDBOX_GATEWAY',
      eventType: payload.eventType,
      payloadHash: crypto.createHash('sha256').update(rawBody).digest('hex'),
      metadata: payload as unknown as Record<string, unknown>,
    });

    const suborder = await Suborder.findById(payload.suborderId);
    if (!suborder) {
      throw new AppError('Referenced suborder not found', 404, 'SUBORDER_NOT_FOUND');
    }

    if (payload.eventType === 'PAYMENT_SUCCESS') {
      suborder.paymentStatus = 'PAID';
      suborder.paidAt = new Date();
      suborder.fulfillmentStatus = 'PROCESSING';
      suborder.statusHistory.push({
        fromFulfillmentStatus: 'AWAITING_FULFILLMENT',
        toFulfillmentStatus: 'PROCESSING',
        paymentStatus: 'PAID',
        actorRole: 'SYSTEM',
        notes: `Card sandbox payment confirmed (Event: ${payload.eventId})`,
        timestamp: new Date(),
      });
      await suborder.save();

      await orderService.recalculateMasterOrderStatus(suborder.orderId);
    } else {
      suborder.paymentStatus = 'PAYMENT_FAILED';
      suborder.statusHistory.push({
        fromFulfillmentStatus: suborder.fulfillmentStatus,
        toFulfillmentStatus: suborder.fulfillmentStatus,
        paymentStatus: 'PAYMENT_FAILED',
        actorRole: 'SYSTEM',
        notes: `Card sandbox payment failed (Event: ${payload.eventId})`,
        timestamp: new Date(),
      });
      await suborder.save();
    }

    logger.info(`[CardGatewayService] Processed webhook ${payload.eventId} for suborder ${suborder.suborderNumber}`);

    return { status: 'PROCESSED', suborder };
  }
}

export const cardGatewayService = new CardGatewayService();
