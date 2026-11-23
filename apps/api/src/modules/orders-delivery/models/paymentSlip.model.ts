import mongoose, { Schema, Document, Types } from 'mongoose';

export type PaymentSlipVerificationStatus = 'PENDING_VERIFICATION' | 'APPROVED' | 'REJECTED';

export interface IPaymentSlip extends Document {
  _id: Types.ObjectId;
  suborderId: Types.ObjectId;
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  depositedAmountInCents: number;
  referenceNumber?: string;
  verificationStatus: PaymentSlipVerificationStatus;
  rejectionReason?: string;
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSlipSchema = new Schema<IPaymentSlip>(
  {
    suborderId: {
      type: Schema.Types.ObjectId,
      ref: 'Suborder',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true,
    },
    storageKey: {
      type: String,
      required: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
    },
    mimeType: {
      type: String,
      required: true,
      trim: true,
    },
    fileSizeBytes: {
      type: Number,
      required: true,
      min: 1,
    },
    depositedAmountInCents: {
      type: Number,
      required: true,
      min: 1,
    },
    referenceNumber: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    verificationStatus: {
      type: String,
      required: true,
      enum: ['PENDING_VERIFICATION', 'APPROVED', 'REJECTED'],
      default: 'PENDING_VERIFICATION',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'payment_slips',
  }
);

PaymentSlipSchema.index({ sellerId: 1, verificationStatus: 1, createdAt: -1 });

export const PaymentSlip = mongoose.model<IPaymentSlip>('PaymentSlip', PaymentSlipSchema);
