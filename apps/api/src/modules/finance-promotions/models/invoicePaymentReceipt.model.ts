import mongoose, { Schema, Document, Types } from 'mongoose';

export type PaymentReceiptReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface IInvoicePaymentReceipt extends Document {
  _id: Types.ObjectId;
  invoiceId: Types.ObjectId;
  sellerId: Types.ObjectId;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  claimedAmountInCents: number;
  depositDate: Date;
  depositedAmountInCents?: number;
  bankTransactionReference?: string;
  reviewStatus: PaymentReceiptReviewStatus;
  rejectionReason?: string;
  adminNotes?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const InvoicePaymentReceiptSchema = new Schema<IInvoicePaymentReceipt>(
  {
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerInvoice',
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
      unique: true,
      trim: true,
    },
    originalFileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    mimeType: {
      type: String,
      required: true,
      enum: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    },
    fileSizeBytes: {
      type: Number,
      required: true,
      min: 1,
      max: 5242880, // 5MB
    },
    claimedAmountInCents: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'claimedAmountInCents must be integer' },
    },
    depositDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    depositedAmountInCents: {
      type: Number,
      min: 1,
      validate: {
        validator: (v: any) => v === null || v === undefined || Number.isInteger(v),
        message: 'depositedAmountInCents must be integer',
      },
      default: null,
    },
    bankTransactionReference: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    reviewStatus: {
      type: String,
      required: true,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        ret.invoiceId = ret.invoiceId?.toString();
        ret.sellerId = ret.sellerId?.toString();
        if (ret.reviewedBy) ret.reviewedBy = ret.reviewedBy.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

InvoicePaymentReceiptSchema.index({ invoiceId: 1, reviewStatus: 1 });
InvoicePaymentReceiptSchema.index({ reviewStatus: 1, createdAt: 1 });

export const InvoicePaymentReceipt = mongoose.model<IInvoicePaymentReceipt>(
  'InvoicePaymentReceipt',
  InvoicePaymentReceiptSchema
);
