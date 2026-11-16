import mongoose, { Document, Schema, Model } from 'mongoose';

export type BankVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';

export interface ISellerBankDetails extends Document {
  sellerId: mongoose.Types.ObjectId;
  bankName: string;
  accountHolderName: string;
  accountNumber: string; // Store full number protected
  maskedAccountNumber: string;
  branchName: string;
  branchCode?: string | null;
  verificationStatus: BankVerificationStatus;
  verifiedByAdminId?: mongoose.Types.ObjectId | null;
  verifiedAt?: Date | null;
  rejectionReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SellerBankDetailsSchema = new Schema<ISellerBankDetails>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      unique: true,
      index: true,
    },
    bankName: {
      type: String,
      required: true,
      trim: true,
    },
    accountHolderName: {
      type: String,
      required: true,
      trim: true,
    },
    accountNumber: {
      type: String,
      required: true,
      trim: true,
      select: false, // Hidden from general queries
    },
    maskedAccountNumber: {
      type: String,
      required: true,
      trim: true,
    },
    branchName: {
      type: String,
      required: true,
      trim: true,
    },
    branchCode: {
      type: String,
      trim: true,
      default: null,
    },
    verificationStatus: {
      type: String,
      enum: ['PENDING', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    verifiedByAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    verifiedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const SellerBankDetails: Model<ISellerBankDetails> =
  mongoose.models.SellerBankDetails ||
  mongoose.model<ISellerBankDetails>('SellerBankDetails', SellerBankDetailsSchema);
