import mongoose, { Schema, Document, Types } from 'mongoose';

export type OrderOverallStatus =
  | 'PENDING_PAYMENT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PARTIALLY_DELIVERED';

export interface IOrderShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  district: string;
  postalCode: string;
}

export interface IOrderStatusHistoryEntry {
  status: OrderOverallStatus;
  actorRole: 'CUSTOMER' | 'SELLER' | 'ADMIN' | 'SYSTEM';
  actorId?: string;
  notes?: string;
  timestamp: Date;
}

export interface IOrder extends Document {
  _id: Types.ObjectId;
  orderNumber: string;
  customerId: Types.ObjectId;
  customerEmail: string;
  shippingAddress: IOrderShippingAddress;
  suborderIds: Types.ObjectId[];
  suborderCount: number;
  totalProductAmountInCents: number;
  totalSellerDiscountInCents: number;
  totalPlatformDiscountInCents: number;
  totalDeliveryFeeInCents: number;
  finalPayableAmountInCents: number;
  currency: string;
  overallStatus: OrderOverallStatus;
  statusHistory: IOrderStatusHistoryEntry[];
  idempotencyKey?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderShippingAddressSchema = new Schema<IOrderShippingAddress>(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    phone: { type: String, required: true, trim: true },
    street: { type: String, required: true, trim: true, minlength: 3, maxlength: 150 },
    city: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    district: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    postalCode: { type: String, required: true, trim: true, match: /^\d{5}$/ },
  },
  { _id: false }
);

const OrderStatusHistorySchema = new Schema<IOrderStatusHistoryEntry>(
  {
    status: {
      type: String,
      required: true,
      enum: ['PENDING_PAYMENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PARTIALLY_DELIVERED'],
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

const OrderSchema = new Schema<IOrder>(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    customerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    shippingAddress: {
      type: OrderShippingAddressSchema,
      required: true,
    },
    suborderIds: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Suborder',
        required: true,
      },
    ],
    suborderCount: {
      type: Number,
      required: true,
      min: 1,
    },
    totalProductAmountInCents: {
      type: Number,
      required: true,
      min: 0,
    },
    totalSellerDiscountInCents: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalPlatformDiscountInCents: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    totalDeliveryFeeInCents: {
      type: Number,
      required: true,
      min: 0,
    },
    finalPayableAmountInCents: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'LKR',
    },
    overallStatus: {
      type: String,
      required: true,
      enum: ['PENDING_PAYMENT', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'PARTIALLY_DELIVERED'],
      default: 'PENDING_PAYMENT',
      index: true,
    },
    statusHistory: {
      type: [OrderStatusHistorySchema],
      default: [],
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
    collection: 'orders',
  }
);

OrderSchema.index({ customerId: 1, createdAt: -1 });
OrderSchema.index({ overallStatus: 1, createdAt: -1 });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
