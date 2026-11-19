import mongoose, { Schema, Document, Types } from 'mongoose';

export type CommissionRateStatus = 'ACTIVE' | 'SUPERSEDED' | 'SCHEDULED';

export interface ICommissionRateConfig extends Document {
  _id: Types.ObjectId;
  basisPoints: number; // e.g. 850 = 8.50%
  percentage: number; // virtual
  effectiveFrom: Date;
  status: CommissionRateStatus;
  description: string;
  configuredBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CommissionRateConfigSchema = new Schema<ICommissionRateConfig>(
  {
    basisPoints: {
      type: Number,
      required: [true, 'basisPoints is required'],
      min: [0, 'basisPoints cannot be negative'],
      max: [3500, 'basisPoints cannot exceed 3500 (35.00%)'],
      validate: {
        validator: Number.isInteger,
        message: 'basisPoints must be an integer',
      },
    },
    effectiveFrom: {
      type: Date,
      required: [true, 'effectiveFrom timestamp is required'],
      default: Date.now,
    },
    status: {
      type: String,
      required: true,
      enum: ['ACTIVE', 'SUPERSEDED', 'SCHEDULED'],
      default: 'ACTIVE',
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    configuredBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Admin user reference is required'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

CommissionRateConfigSchema.virtual('percentage').get(function (this: ICommissionRateConfig) {
  return this.basisPoints / 100;
});

CommissionRateConfigSchema.index({ status: 1, effectiveFrom: -1 });
CommissionRateConfigSchema.index({ effectiveFrom: -1 });

export const CommissionRateConfig = mongoose.model<ICommissionRateConfig>(
  'CommissionRateConfig',
  CommissionRateConfigSchema
);
