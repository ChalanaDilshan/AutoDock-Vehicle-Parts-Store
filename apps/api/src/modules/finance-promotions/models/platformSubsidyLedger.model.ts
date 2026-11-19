import mongoose, { Schema, Document, Types } from 'mongoose';

export type PlatformSubsidyStatus = 'ACCRUED' | 'SETTLED' | 'ADJUSTED';
export type SubsidySettlementMethod = 'DIRECT_PAYOUT' | 'INVOICE_CREDIT';

export interface IPlatformSubsidyLedger extends Document {
  _id: Types.ObjectId;
  subsidyReference: string;
  sellerId: Types.ObjectId;
  orderId: Types.ObjectId;
  suborderId: Types.ObjectId;
  promotionId: Types.ObjectId;
  promotionCode: string;
  eligibleProductAmountInCents: number;
  subsidyAmountInCents: number;
  currency: string;
  accrualTimestamp: Date;
  status: PlatformSubsidyStatus;
  settlementMethod?: SubsidySettlementMethod;
  settlementReference?: string;
  settledAt?: Date;
  settledBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformSubsidyLedgerSchema = new Schema<IPlatformSubsidyLedger>(
  {
    subsidyReference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    suborderId: {
      type: Schema.Types.ObjectId,
      ref: 'Suborder',
      required: true,
      unique: true,
      index: true,
    },
    promotionId: {
      type: Schema.Types.ObjectId,
      ref: 'Promotion',
      required: true,
    },
    promotionCode: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    eligibleProductAmountInCents: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'eligibleProductAmountInCents must be integer' },
    },
    subsidyAmountInCents: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'subsidyAmountInCents must be integer' },
    },
    currency: {
      type: String,
      required: true,
      enum: ['LKR'],
      default: 'LKR',
    },
    accrualTimestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: ['ACCRUED', 'SETTLED', 'ADJUSTED'],
      default: 'ACCRUED',
      index: true,
    },
    settlementMethod: {
      type: String,
      enum: ['DIRECT_PAYOUT', 'INVOICE_CREDIT'],
      default: null,
    },
    settlementReference: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
    settledAt: {
      type: Date,
      default: null,
    },
    settledBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        ret.sellerId = ret.sellerId?.toString();
        ret.orderId = ret.orderId?.toString();
        ret.suborderId = ret.suborderId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

PlatformSubsidyLedgerSchema.index({ sellerId: 1, status: 1 });

export const PlatformSubsidyLedger = mongoose.model<IPlatformSubsidyLedger>(
  'PlatformSubsidyLedger',
  PlatformSubsidyLedgerSchema
);
