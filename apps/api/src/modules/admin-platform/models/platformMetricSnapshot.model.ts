import mongoose, { Schema, Document } from 'mongoose';

export interface IPlatformMetricSnapshot extends Document {
  snapshotDate: Date;
  grossMerchandiseValueInCents: number;
  logisticsRevenueInCents: number;
  accruedCommissionInCents: number;
  platformSubsidyLiabilityInCents: number;
  masterOrderCount: number;
  merchantSuborderCount: number;
  registeredCustomerCount: number;
  approvedSellerCount: number;
  activeProductCount: number;
  calculatedAt: Date;
}

const PlatformMetricSnapshotSchema = new Schema<IPlatformMetricSnapshot>(
  {
    snapshotDate: {
      type: Date,
      required: true,
      unique: true,
      index: true,
    },
    grossMerchandiseValueInCents: { type: Number, default: 0 },
    logisticsRevenueInCents: { type: Number, default: 0 },
    accruedCommissionInCents: { type: Number, default: 0 },
    platformSubsidyLiabilityInCents: { type: Number, default: 0 },
    masterOrderCount: { type: Number, default: 0 },
    merchantSuborderCount: { type: Number, default: 0 },
    registeredCustomerCount: { type: Number, default: 0 },
    approvedSellerCount: { type: Number, default: 0 },
    activeProductCount: { type: Number, default: 0 },
    calculatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: false,
    collection: 'platform_metric_snapshots',
  }
);

export const PlatformMetricSnapshot = mongoose.model<IPlatformMetricSnapshot>(
  'PlatformMetricSnapshot',
  PlatformMetricSnapshotSchema
);
