import mongoose, { Schema, Document, Types } from 'mongoose';

export type SuborderPaymentMethod = 'COD' | 'BANK_TRANSFER' | 'CARD_SANDBOX';

export type SuborderPaymentStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_PENDING_VERIFICATION'
  | 'PAID'
  | 'PAYMENT_REJECTED'
  | 'PENDING_COLLECTION'
  | 'COLLECTED'
  | 'PAYMENT_FAILED';

export type SuborderFulfillmentStatus =
  | 'AWAITING_FULFILLMENT'
  | 'PROCESSING'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface ISuborderItemSnapshot {
  productId: Types.ObjectId;
  title: string;
  sku: string;
  unitPriceInCents: number;
  quantity: number;
  totalPriceInCents: number;
}

export interface IDeliveryRateSnapshot {
  rateId: string;
  district: string;
  feeInCents: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface ICourierDetails {
  courierName: string;
  trackingNumber: string;
  trackingUrl?: string;
  dispatchedAt?: Date;
}

export interface ISuborderStatusHistoryEntry {
  fromFulfillmentStatus: SuborderFulfillmentStatus;
  toFulfillmentStatus: SuborderFulfillmentStatus;
  paymentStatus: SuborderPaymentStatus;
  actorRole: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SYSTEM';
  actorId?: string;
  notes?: string;
  timestamp: Date;
}

export interface ISuborder extends Document {
  _id: Types.ObjectId;
  suborderNumber: string;
  orderId: Types.ObjectId;
  customerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  sellerBusinessName: string;
  items: ISuborderItemSnapshot[];
  subtotalInCents: number;
  sellerDiscountInCents: number;
  platformDiscountInCents: number;
  deliveryFeeInCents: number;
  totalPayableInCents: number;
  commissionableBaseInCents: number;
  currency: string;
  paymentMethod: SuborderPaymentMethod;
  paymentStatus: SuborderPaymentStatus;
  fulfillmentStatus: SuborderFulfillmentStatus;
  deliveryRateSnapshot: IDeliveryRateSnapshot;
  courierDetails?: ICourierDetails;
  paidAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  rejectionCount: number;
  statusHistory: ISuborderStatusHistoryEntry[];
  createdAt: Date;
  updatedAt: Date;
}

const SuborderItemSnapshotSchema = new Schema<ISuborderItemSnapshot>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    unitPriceInCents: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    totalPriceInCents: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const DeliveryRateSnapshotSchema = new Schema<IDeliveryRateSnapshot>(
  {
    rateId: { type: String, required: true },
    district: { type: String, required: true, trim: true },
    feeInCents: { type: Number, required: true, min: 0 },
    estimatedDaysMin: { type: Number, required: true, min: 1 },
    estimatedDaysMax: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const CourierDetailsSchema = new Schema<ICourierDetails>(
  {
    courierName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    trackingNumber: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    trackingUrl: { type: String, trim: true },
    dispatchedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SuborderStatusHistorySchema = new Schema<ISuborderStatusHistoryEntry>(
  {
    fromFulfillmentStatus: {
      type: String,
      required: true,
      enum: ['AWAITING_FULFILLMENT', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
    },
    toFulfillmentStatus: {
      type: String,
      required: true,
      enum: ['AWAITING_FULFILLMENT', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: [
        'PENDING_PAYMENT',
        'PAYMENT_PENDING_VERIFICATION',
        'PAID',
        'PAYMENT_REJECTED',
        'PENDING_COLLECTION',
        'COLLECTED',
        'PAYMENT_FAILED',
      ],
    },
    actorRole: {
      type: String,
      required: true,
      enum: ['CUSTOMER', 'SELLER', 'ADMIN', 'SYSTEM'],
    },
    actorId: { type: String, default: null },
    notes: { type: String, default: null, maxlength: 500 },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const SuborderSchema = new Schema<ISuborder>(
  {
    suborderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true,
    },
    sellerBusinessName: {
      type: String,
      required: true,
      trim: true,
    },
    items: {
      type: [SuborderItemSnapshotSchema],
      required: true,
      validate: [(val: ISuborderItemSnapshot[]) => val.length > 0, 'Suborder must contain at least one item'],
    },
    subtotalInCents: {
      type: Number,
      required: true,
      min: 0,
    },
    sellerDiscountInCents: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    platformDiscountInCents: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    deliveryFeeInCents: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPayableInCents: {
      type: Number,
      required: true,
      min: 0,
    },
    commissionableBaseInCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'LKR',
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['COD', 'BANK_TRANSFER', 'CARD_SANDBOX'],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: [
        'PENDING_PAYMENT',
        'PAYMENT_PENDING_VERIFICATION',
        'PAID',
        'PAYMENT_REJECTED',
        'PENDING_COLLECTION',
        'COLLECTED',
        'PAYMENT_FAILED',
      ],
      default: 'PENDING_PAYMENT',
      index: true,
    },
    fulfillmentStatus: {
      type: String,
      required: true,
      enum: ['AWAITING_FULFILLMENT', 'PROCESSING', 'READY_FOR_DISPATCH', 'DISPATCHED', 'DELIVERED', 'CANCELLED'],
      default: 'AWAITING_FULFILLMENT',
      index: true,
    },
    deliveryRateSnapshot: {
      type: DeliveryRateSnapshotSchema,
      required: true,
    },
    courierDetails: {
      type: CourierDetailsSchema,
    },
    paidAt: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationReason: {
      type: String,
      maxlength: 500,
    },
    rejectionCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    statusHistory: {
      type: [SuborderStatusHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'suborders',
  }
);

SuborderSchema.index({ sellerId: 1, fulfillmentStatus: 1, createdAt: -1 });
SuborderSchema.index({ customerId: 1, createdAt: -1 });

export const Suborder = mongoose.model<ISuborder>('Suborder', SuborderSchema);
