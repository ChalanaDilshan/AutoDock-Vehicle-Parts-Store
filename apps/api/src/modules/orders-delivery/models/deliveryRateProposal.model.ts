import mongoose, { Schema, Document, Types } from 'mongoose';

export type DeliveryProposalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUPERSEDED';

export interface IDistrictRateProposal {
  district: string;
  feeInCents: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface IDeliveryRateProposal extends Document {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;
  rates: IDistrictRateProposal[];
  status: DeliveryProposalStatus;
  rejectionReason?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DistrictRateProposalSchema = new Schema<IDistrictRateProposal>(
  {
    district: { type: String, required: true, trim: true },
    feeInCents: { type: Number, required: true, min: 0 },
    estimatedDaysMin: { type: Number, required: true, min: 1 },
    estimatedDaysMax: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const DeliveryRateProposalSchema = new Schema<IDeliveryRateProposal>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true,
    },
    rates: {
      type: [DistrictRateProposalSchema],
      required: true,
      validate: [(val: IDistrictRateProposal[]) => val.length > 0, 'Proposal must include at least one district rate'],
    },
    status: {
      type: String,
      required: true,
      enum: ['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'SUPERSEDED'],
      default: 'PENDING_APPROVAL',
      index: true,
    },
    rejectionReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'delivery_rate_proposals',
  }
);

DeliveryRateProposalSchema.index({ sellerId: 1, status: 1, createdAt: -1 });

export const DeliveryRateProposal = mongoose.model<IDeliveryRateProposal>(
  'DeliveryRateProposal',
  DeliveryRateProposalSchema
);
