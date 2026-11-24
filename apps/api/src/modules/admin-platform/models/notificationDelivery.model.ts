import mongoose, { Schema, Document } from 'mongoose';

export type DeliveryChannel = 'EMAIL' | 'IN_APP';
export type DeliveryStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'SENT'
  | 'DELIVERED'
  | 'FAILED'
  | 'RETRYING'
  | 'CANCELLED';

export interface INotificationDelivery extends Document {
  idempotencyKey: string;
  sourceModule: 'MOD-01' | 'MOD-02' | 'MOD-03' | 'MOD-04' | 'MOD-05';
  sourceEventId: string;
  sourceEventName: string;
  channel: DeliveryChannel;
  templateId: string;
  templateVersion: string;
  recipientId: mongoose.Types.ObjectId;
  recipientAddress: string;
  status: DeliveryStatus;
  attemptCount: number;
  maxAttempts: number;
  nextAttemptAt?: Date | null;
  lastAttemptAt?: Date | null;
  providerMessageId?: string | null;
  providerResponse?: Record<string, unknown> | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
  notificationId?: mongoose.Types.ObjectId | null;
  payloadSnapshot?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationDeliverySchema = new Schema<INotificationDelivery>(
  {
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sourceModule: {
      type: String,
      enum: ['MOD-01', 'MOD-02', 'MOD-03', 'MOD-04', 'MOD-05'],
      required: true,
      index: true,
    },
    sourceEventId: {
      type: String,
      required: true,
      index: true,
    },
    sourceEventName: {
      type: String,
      required: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL', 'IN_APP'],
      required: true,
      index: true,
    },
    templateId: {
      type: String,
      required: true,
    },
    templateVersion: {
      type: String,
      default: '1.0',
    },
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientAddress: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['PENDING', 'QUEUED', 'PROCESSING', 'SENT', 'DELIVERED', 'FAILED', 'RETRYING', 'CANCELLED'],
      default: 'PENDING',
      index: true,
    },
    attemptCount: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    nextAttemptAt: {
      type: Date,
      default: null,
      index: true,
    },
    lastAttemptAt: {
      type: Date,
      default: null,
    },
    providerMessageId: {
      type: String,
      default: null,
    },
    providerResponse: {
      type: Schema.Types.Mixed,
      default: null,
    },
    lastErrorCode: {
      type: String,
      default: null,
    },
    lastErrorMessage: {
      type: String,
      default: null,
    },
    notificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Notification',
      default: null,
    },
    payloadSnapshot: {
      type: Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: true,
    collection: 'notification_deliveries',
  }
);

// Indexes
NotificationDeliverySchema.index({ status: 1, nextAttemptAt: 1 });
NotificationDeliverySchema.index({ sourceModule: 1, sourceEventId: 1 });

// TTL Index: Purge delivery logs after 30 days
NotificationDeliverySchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const NotificationDelivery = mongoose.model<INotificationDelivery>(
  'NotificationDelivery',
  NotificationDeliverySchema
);
