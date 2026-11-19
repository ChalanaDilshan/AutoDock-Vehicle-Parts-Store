import mongoose, { Schema, Document, Types } from 'mongoose';

export type ExemptionStatus = 'ACTIVE' | 'REVOKED';

export interface ISellerCommissionExemption extends Document {
  _id: Types.ObjectId;
  sellerId: Types.ObjectId;
  status: ExemptionStatus;
  reason: string;
  activatedBy: Types.ObjectId;
  activatedAt: Date;
  revokedBy?: Types.ObjectId;
  revokedAt?: Date;
  revocationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SellerCommissionExemptionSchema = new Schema<ISellerCommissionExemption>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: [true, 'Seller reference is required'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'REVOKED'],
      default: 'ACTIVE',
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reason for exemption is required'],
      trim: true,
      minlength: [10, 'Reason must be at least 10 characters'],
      maxlength: [500, 'Reason cannot exceed 500 characters'],
    },
    activatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Activating administrator reference is required'],
    },
    activatedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    revokedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revocationReason: {
      type: String,
      trim: true,
      maxlength: [500, 'Revocation reason cannot exceed 500 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        ret.sellerId = ret.sellerId.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

SellerCommissionExemptionSchema.index({ sellerId: 1, status: 1 });
SellerCommissionExemptionSchema.index({ sellerId: 1, activatedAt: -1 });

export const SellerCommissionExemption = mongoose.model<ISellerCommissionExemption>(
  'SellerCommissionExemption',
  SellerCommissionExemptionSchema
);
