import mongoose, { Schema, Document, Types } from 'mongoose';
import { PromotionFundingSource } from './promotion.model.js';

export interface IPromotionRedemption extends Document {
  _id: Types.ObjectId;
  promotionId: Types.ObjectId;
  customerId: Types.ObjectId;
  orderId: Types.ObjectId;
  suborderId: Types.ObjectId;
  discountAmountInCents: number;
  fundingSource: PromotionFundingSource;
  redeemedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PromotionRedemptionSchema = new Schema<IPromotionRedemption>(
  {
    promotionId: {
      type: Schema.Types.ObjectId,
      ref: 'Promotion',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
      index: true,
    },
    discountAmountInCents: {
      type: Number,
      required: true,
      min: 1,
      validate: { validator: Number.isInteger, message: 'discountAmountInCents must be integer' },
    },
    fundingSource: {
      type: String,
      required: true,
      enum: ['SELLER_FUNDED', 'AUTODOCK_FUNDED'],
    },
    redeemedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        ret.promotionId = ret.promotionId?.toString();
        ret.customerId = ret.customerId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

PromotionRedemptionSchema.index({ promotionId: 1, customerId: 1 });

export const PromotionRedemption = mongoose.model<IPromotionRedemption>(
  'PromotionRedemption',
  PromotionRedemptionSchema
);
