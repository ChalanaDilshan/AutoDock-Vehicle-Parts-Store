import mongoose, { Schema, Document, Types } from 'mongoose';

export type CommissionLedgerStatus = 'ACCRUED' | 'INVOICED' | 'ADJUSTED';

export interface IAppliedRateSnapshot {
  rateConfigId?: Types.ObjectId;
  basisPoints: number;
  isExempt: boolean;
  exemptionId?: Types.ObjectId;
}

export interface ICommissionLedger extends Document {
  _id: Types.ObjectId;
  ledgerReference: string;
  sellerId: Types.ObjectId;
  orderId: Types.ObjectId;
  suborderId: Types.ObjectId;
  completionEventId: string;
  completionTimestamp: Date;
  productSubtotalInCents: number;
  sellerDiscountInCents: number;
  platformDiscountInCents: number;
  deliveryFeeInCents: number;
  commissionableBaseInCents: number;
  appliedRateSnapshot: IAppliedRateSnapshot;
  commissionAmountInCents: number;
  currency: string;
  calculationVersion: number;
  status: CommissionLedgerStatus;
  invoiceId?: Types.ObjectId;
  reversalOfLedgerId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AppliedRateSnapshotSchema = new Schema<IAppliedRateSnapshot>(
  {
    rateConfigId: { type: Schema.Types.ObjectId, ref: 'CommissionRateConfig' },
    basisPoints: { type: Number, required: true, min: 0 },
    isExempt: { type: Boolean, required: true, default: false },
    exemptionId: { type: Schema.Types.ObjectId, ref: 'SellerCommissionExemption' },
  },
  { _id: false }
);

const CommissionLedgerSchema = new Schema<ICommissionLedger>(
  {
    ledgerReference: {
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
    completionEventId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    completionTimestamp: {
      type: Date,
      required: true,
    },
    productSubtotalInCents: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'productSubtotalInCents must be integer' },
    },
    sellerDiscountInCents: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: { validator: Number.isInteger, message: 'sellerDiscountInCents must be integer' },
    },
    platformDiscountInCents: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: { validator: Number.isInteger, message: 'platformDiscountInCents must be integer' },
    },
    deliveryFeeInCents: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: { validator: Number.isInteger, message: 'deliveryFeeInCents must be integer' },
    },
    commissionableBaseInCents: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'commissionableBaseInCents must be integer' },
    },
    appliedRateSnapshot: {
      type: AppliedRateSnapshotSchema,
      required: true,
    },
    commissionAmountInCents: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'commissionAmountInCents must be integer' },
    },
    currency: {
      type: String,
      required: true,
      enum: ['LKR'],
      default: 'LKR',
    },
    calculationVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    status: {
      type: String,
      required: true,
      enum: ['ACCRUED', 'INVOICED', 'ADJUSTED'],
      default: 'ACCRUED',
      index: true,
    },
    invoiceId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerInvoice',
      default: null,
      index: true,
    },
    reversalOfLedgerId: {
      type: Schema.Types.ObjectId,
      ref: 'CommissionLedger',
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
        if (ret.invoiceId) ret.invoiceId = ret.invoiceId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CommissionLedgerSchema.index({ sellerId: 1, status: 1, completionTimestamp: 1 });

export const CommissionLedger = mongoose.model<ICommissionLedger>(
  'CommissionLedger',
  CommissionLedgerSchema
);
