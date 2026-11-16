import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IPrivacyAcknowledgement extends Document {
  sellerId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  noticeVersion: string;
  acknowledged: boolean;
  ipAddress: string;
  userAgent?: string | null;
  acknowledgedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PrivacyAcknowledgementSchema = new Schema<IPrivacyAcknowledgement>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    noticeVersion: {
      type: String,
      required: true,
      trim: true,
    },
    acknowledged: {
      type: Boolean,
      required: true,
      validate: {
        validator: (v: boolean) => v === true,
        message: 'Privacy acknowledgement must be true',
      },
    },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
    },
    userAgent: {
      type: String,
      default: null,
      trim: true,
    },
    acknowledgedAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: true,
  }
);

export const PrivacyAcknowledgement: Model<IPrivacyAcknowledgement> =
  mongoose.models.PrivacyAcknowledgement ||
  mongoose.model<IPrivacyAcknowledgement>('PrivacyAcknowledgement', PrivacyAcknowledgementSchema);
