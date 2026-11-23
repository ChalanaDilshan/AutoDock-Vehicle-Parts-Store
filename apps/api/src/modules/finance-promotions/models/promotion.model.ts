import mongoose, { Schema, Document, Types } from 'mongoose';

export type PromotionFundingSource = 'SELLER_FUNDED' | 'AUTODOCK_FUNDED';
export type PromotionDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';
export type PromotionStatus = 'ACTIVE' | 'INACTIVE' | 'EXPIRED';

export interface IPromotion extends Document {
  _id: Types.ObjectId;
  code: string;
  title: string;
  description?: string;
  fundingSource: PromotionFundingSource;
  sellerId?: Types.ObjectId;
  discountType: PromotionDiscountType;
  discountValue: number; // basisPoints for PERCENTAGE (e.g. 1000 = 10%) or cents for FIXED_AMOUNT
  minSpendInCents: number;
  maxDiscountInCents?: number;
  applicableCategoryIds: Types.ObjectId[];
  applicableProductIds: Types.ObjectId[];
  startDate: Date;
  endDate: Date;
  totalUsageLimit?: number;
  currentUsageCount: number;
  perCustomerLimit: number;
  status: PromotionStatus;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z0-9_-]{4,20}$/,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: null,
    },
    fundingSource: {
      type: String,
      required: true,
      enum: ['SELLER_FUNDED', 'AUTODOCK_FUNDED'],
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      default: null,
      index: true,
    },
    discountType: {
      type: String,
      required: true,
      enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
    },
    discountValue: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'discountValue must be integer' },
    },
    minSpendInCents: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: { validator: Number.isInteger, message: 'minSpendInCents must be integer' },
    },
    maxDiscountInCents: {
      type: Number,
      min: 1,
      validate: {
        validator: (v: any) => v === null || v === undefined || Number.isInteger(v),
        message: 'maxDiscountInCents must be integer',
      },
      default: null,
    },
    applicableCategoryIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
      default: [],
    },
    applicableProductIds: {
      type: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
      default: [],
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
      required: true,
    },
    totalUsageLimit: {
      type: Number,
      min: 1,
      default: null,
    },
    currentUsageCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    perCustomerLimit: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'INACTIVE', 'EXPIRED'],
      default: 'ACTIVE',
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        if (ret.sellerId) ret.sellerId = ret.sellerId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

PromotionSchema.index({ sellerId: 1, status: 1 });
PromotionSchema.index({ status: 1, startDate: 1, endDate: 1 });

export const Promotion = mongoose.model<IPromotion>('Promotion', PromotionSchema);
