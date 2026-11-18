import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentWebhookEvent extends Document {
  eventId: string;
  provider: string;
  eventType: string;
  payloadHash: string;
  processedAt: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const PaymentWebhookEventSchema = new Schema<IPaymentWebhookEvent>(
  {
    eventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    payloadHash: {
      type: String,
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: 'payment_webhook_events',
  }
);

export const PaymentWebhookEvent = mongoose.model<IPaymentWebhookEvent>(
  'PaymentWebhookEvent',
  PaymentWebhookEventSchema
);
