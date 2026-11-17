import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IBrand extends Document {
  name: string;
  slug: string;
  logoUrl?: string | null;
  countryOfOrigin?: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
  {
    name: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      unique: true,
      minlength: [2, 'Brand name must be at least 2 characters'],
      maxlength: [100, 'Brand name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Brand slug is required'],
      trim: true,
      lowercase: true,
      unique: true,
    },
    logoUrl: {
      type: String,
      trim: true,
      default: null,
    },
    countryOfOrigin: {
      type: String,
      trim: true,
      maxlength: [60, 'Country cannot exceed 60 characters'],
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
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

export const Brand: Model<IBrand> =
  mongoose.models.Brand || mongoose.model<IBrand>('Brand', BrandSchema, 'brands');
