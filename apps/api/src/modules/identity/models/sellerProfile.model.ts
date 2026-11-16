import mongoose, { Document, Schema, Model } from 'mongoose';

export type SellerStoreType = 'PHYSICAL_STORE' | 'ONLINE_ONLY';
export type SellerVerificationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'UNDER_VERIFICATION'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type VerificationDecision = 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
export type VerificationMethod = 'PHYSICAL_VISIT' | 'WHATSAPP_VIDEO_CALL' | 'DOCUMENT_ONLY';

export interface IVerificationHistoryEntry {
  reviewedByAdminId: mongoose.Types.ObjectId;
  decision: VerificationDecision;
  verificationMethod?: VerificationMethod;
  verificationNotes: string;
  reviewedAt: Date;
}

export interface IOperatingAddress {
  street: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;
}

export interface ISellerProfile extends Document {
  userId: mongoose.Types.ObjectId;
  businessName: string;
  storeSlug: string;
  sellerType: SellerStoreType;
  businessRegistrationNumber: string;
  operatingAddress: IOperatingAddress;
  contactPhone: string;
  verificationStatus: SellerVerificationStatus;
  verification_history: IVerificationHistoryEntry[];
  isEligibleToSell: boolean;
  rejectionReason?: string | null;
  additionalInfoRequested?: string | null;
  storeLogoUrl?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const VerificationHistorySchema = new Schema<IVerificationHistoryEntry>(
  {
    reviewedByAdminId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    decision: {
      type: String,
      enum: ['APPROVE', 'REJECT', 'REQUEST_INFO'],
      required: true,
    },
    verificationMethod: {
      type: String,
      enum: ['PHYSICAL_VISIT', 'WHATSAPP_VIDEO_CALL', 'DOCUMENT_ONLY'],
    },
    verificationNotes: { type: String, required: true },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const OperatingAddressSchema = new Schema<IOperatingAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const SellerProfileSchema = new Schema<ISellerProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    storeSlug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    sellerType: {
      type: String,
      enum: ['PHYSICAL_STORE', 'ONLINE_ONLY'],
      required: true,
    },
    businessRegistrationNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    operatingAddress: {
      type: OperatingAddressSchema,
      required: true,
    },
    contactPhone: {
      type: String,
      required: true,
      trim: true,
    },
    verificationStatus: {
      type: String,
      enum: [
        'DRAFT',
        'PENDING',
        'UNDER_VERIFICATION',
        'ADDITIONAL_INFO_REQUIRED',
        'APPROVED',
        'REJECTED',
        'SUSPENDED',
      ],
      default: 'DRAFT',
      required: true,
      index: true,
    },
    verification_history: [VerificationHistorySchema],
    isEligibleToSell: {
      type: Boolean,
      default: false,
      index: true,
    },
    rejectionReason: { type: String, default: null },
    additionalInfoRequested: { type: String, default: null },
    storeLogoUrl: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

export const SellerProfile: Model<ISellerProfile> =
  mongoose.models.SellerProfile || mongoose.model<ISellerProfile>('SellerProfile', SellerProfileSchema);
