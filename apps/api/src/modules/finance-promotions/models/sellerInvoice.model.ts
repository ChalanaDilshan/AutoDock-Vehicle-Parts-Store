import mongoose, { Schema, Document, Types } from 'mongoose';

export type InvoiceStatus =
  | 'ISSUED'
  | 'PAYMENT_PENDING_VERIFICATION'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export interface ISellerBillingSnapshot {
  businessName: string;
  businessRegNumber: string;
  billingEmail: string;
  contactPhone: string;
  address: {
    street: string;
    city: string;
    district: string;
    province: string;
    postalCode: string;
  };
}

export interface ISellerInvoice extends Document {
  _id: Types.ObjectId;
  invoiceNumber: string;
  sellerId: Types.ObjectId;
  billingPeriod: string; // YYYY-MM
  periodStart: Date;
  periodEnd: Date;
  issueDate: Date;
  dueDate: Date;
  sellerBillingSnapshot: ISellerBillingSnapshot;
  lineItemCount: number;
  grossProductTotalInCents: number;
  grossCommissionInCents: number;
  verifiedPaidInCents: number;
  outstandingBalanceInCents: number;
  currency: string;
  status: InvoiceStatus;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SellerBillingSnapshotSchema = new Schema<ISellerBillingSnapshot>(
  {
    businessName: { type: String, required: true },
    businessRegNumber: { type: String, required: true },
    billingEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    address: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: { type: String, required: true },
    },
  },
  { _id: false }
);

const SellerInvoiceSchema = new Schema<ISellerInvoice>(
  {
    invoiceNumber: {
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
    billingPeriod: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}$/,
      index: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    sellerBillingSnapshot: {
      type: SellerBillingSnapshotSchema,
      required: true,
    },
    lineItemCount: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'lineItemCount must be integer' },
    },
    grossProductTotalInCents: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'grossProductTotalInCents must be integer' },
    },
    grossCommissionInCents: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'grossCommissionInCents must be integer' },
    },
    verifiedPaidInCents: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
      validate: { validator: Number.isInteger, message: 'verifiedPaidInCents must be integer' },
    },
    outstandingBalanceInCents: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'outstandingBalanceInCents must be integer' },
    },
    currency: {
      type: String,
      required: true,
      enum: ['LKR'],
      default: 'LKR',
    },
    status: {
      type: String,
      required: true,
      enum: [
        'ISSUED',
        'PAYMENT_PENDING_VERIFICATION',
        'PARTIALLY_PAID',
        'PAID',
        'OVERDUE',
        'CANCELLED',
      ],
      default: 'ISSUED',
      index: true,
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        ret.sellerId = ret.sellerId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

SellerInvoiceSchema.index({ sellerId: 1, billingPeriod: 1 }, { unique: true });
SellerInvoiceSchema.index({ status: 1, dueDate: 1 });

export const SellerInvoice = mongoose.model<ISellerInvoice>('SellerInvoice', SellerInvoiceSchema);
