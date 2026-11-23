import mongoose, { Schema, Document } from 'mongoose';

export type NotificationCategory =
  | 'ORDER'
  | 'PAYMENT'
  | 'VERIFICATION'
  | 'FINANCE'
  | 'SYSTEM'
  | 'SECURITY';

export type NotificationPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  recipientRole: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  title: string;
  message: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  actionUrl?: string | null;
  targetEntityId?: string | null;
  targetEntityType?: string | null;
  isRead: boolean;
  readAt?: Date | null;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    recipientId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recipientRole: {
      type: String,
      enum: ['CUSTOMER', 'SELLER', 'ADMIN'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    category: {
      type: String,
      enum: ['ORDER', 'PAYMENT', 'VERIFICATION', 'FINANCE', 'SYSTEM', 'SECURITY'],
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ['CRITICAL', 'HIGH', 'NORMAL', 'LOW'],
      default: 'NORMAL',
    },
    actionUrl: {
      type: String,
      default: null,
      trim: true,
    },
    targetEntityId: {
      type: String,
      default: null,
    },
    targetEntityType: {
      type: String,
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    collection: 'notifications',
  }
);

// Search & filter indexes
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ recipientId: 1, category: 1, createdAt: -1 });

// TTL Indexes: Purge read notifications 90 days after readAt; fallback purge unread after 180 days
NotificationSchema.index({ readAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
