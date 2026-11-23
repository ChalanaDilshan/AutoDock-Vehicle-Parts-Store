import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IPlatformFinancialSettings extends Document {
  _id: Types.ObjectId;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branchName: string;
  branchCode?: string;
  paymentInstructions: string;
  updatedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PlatformFinancialSettingsSchema = new Schema<IPlatformFinancialSettings>(
  {
    bankName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      default: 'Bank of Ceylon',
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      default: 'AutoDock Marketplace (Pvt) Ltd',
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
      maxlength: 30,
      default: '0089201928',
    },
    branchName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
      default: 'Corporate Branch, Colombo 01',
    },
    branchCode: {
      type: String,
      trim: true,
      maxlength: 10,
      default: '7010',
    },
    paymentInstructions: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
      default:
        'Please transfer the exact invoice balance to the account above. Mention your Invoice Number as the deposit reference. Upload the transfer slip immediately for administrative verification.',
    },
    updatedBy: {
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
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const PlatformFinancialSettings = mongoose.model<IPlatformFinancialSettings>(
  'PlatformFinancialSettings',
  PlatformFinancialSettingsSchema
);
