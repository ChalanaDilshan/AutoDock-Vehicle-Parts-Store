import mongoose, { Document, Schema, Model } from 'mongoose';

export type DocumentType =
  | 'BUSINESS_REGISTRATION'
  | 'SELLER_ID_CARD'
  | 'SELLER_FACE_PHOTO'
  | 'STORE_PHOTO';

export type DocumentReviewStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface ISellerDocument extends Document {
  sellerId: mongoose.Types.ObjectId;
  documentType: DocumentType;
  s3StorageKey: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  reviewStatus: DocumentReviewStatus;
  adminReviewNotes?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const SellerDocumentSchema = new Schema<ISellerDocument>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      required: true,
      index: true,
    },
    documentType: {
      type: String,
      enum: ['BUSINESS_REGISTRATION', 'SELLER_ID_CARD', 'SELLER_FACE_PHOTO', 'STORE_PHOTO'],
      required: true,
    },
    s3StorageKey: {
      type: String,
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    mimeType: {
      type: String,
      enum: ['application/pdf', 'image/jpeg', 'image/png'],
      required: true,
    },
    fileSizeBytes: {
      type: Number,
      required: true,
      max: 10485760, // 10MB limit
    },
    reviewStatus: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
      required: true,
      index: true,
    },
    adminReviewNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

export const SellerDocument: Model<ISellerDocument> =
  mongoose.models.SellerDocument || mongoose.model<ISellerDocument>('SellerDocument', SellerDocumentSchema);
