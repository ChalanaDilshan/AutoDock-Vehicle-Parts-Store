import mongoose, { Schema, Document, Types } from 'mongoose';

export type DeliveryZoneRateStatus = 'ACTIVE' | 'SUPERSEDED';

export interface IDeliveryZoneRate extends Document {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;
  district: string;
  feeInCents: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  proposalId: Types.ObjectId;
  status: DeliveryZoneRateStatus;
  createdAt: Date;
  updatedAt: Date;
}

const DeliveryZoneRateSchema = new Schema<IDeliveryZoneRate>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true,
    },
    district: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    feeInCents: {
      type: Number,
      required: true,
      min: 0,
    },
    estimatedDaysMin: {
      type: Number,
      required: true,
      min: 1,
    },
    estimatedDaysMax: {
      type: Number,
      required: true,
      min: 1,
    },
    proposalId: {
      type: Schema.Types.ObjectId,
      ref: 'DeliveryRateProposal',
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'SUPERSEDED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
    collection: 'delivery_zones',
  }
);

DeliveryZoneRateSchema.index({ sellerId: 1, district: 1, status: 1 });

export const DeliveryZoneRate = mongoose.model<IDeliveryZoneRate>(
  'DeliveryZoneRate',
  DeliveryZoneRateSchema
);
