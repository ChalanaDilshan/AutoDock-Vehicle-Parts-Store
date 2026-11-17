import mongoose, { Document, Schema, Model } from 'mongoose';

export type ReviewStatus = 'PUBLISHED' | 'HIDDEN_BY_ADMIN';

export interface IReview extends Document {
  productId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  suborderId: mongoose.Types.ObjectId;
  rating: number;
  title?: string | null;
  comment: string;
  images: string[];
  status: ReviewStatus;
  moderatedAt?: Date | null;
  moderatedBy?: mongoose.Types.ObjectId | null;
  moderationReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Reviewer user reference is required'],
      index: true,
    },
    suborderId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Delivered suborder reference is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Star rating is required'],
      min: [1, 'Rating must be at least 1 star'],
      max: [5, 'Rating cannot exceed 5 stars'],
      validate: {
        validator: Number.isInteger,
        message: 'Rating must be an integer between 1 and 5',
      },
    },
    title: {
      type: String,
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
      default: null,
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr: string[]) => arr.length <= 5,
        message: 'Maximum 5 images allowed per review',
      },
    },
    status: {
      type: String,
      enum: ['PUBLISHED', 'HIDDEN_BY_ADMIN'],
      default: 'PUBLISHED',
      index: true,
    },
    moderatedAt: {
      type: Date,
      default: null,
    },
    moderatedBy: {
      type: Schema.Types.ObjectId,
      default: null,
    },
    moderationReason: {
      type: String,
      trim: true,
      maxlength: [300, 'Moderation reason cannot exceed 300 characters'],
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        ret.productId = ret.productId?.toString();
        ret.userId = ret.userId?.toString();
        ret.suborderId = ret.suborderId?.toString();
        ret.moderatedBy = ret.moderatedBy?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Enforce strictly 1 review per delivered purchase
ReviewSchema.index({ productId: 1, userId: 1, suborderId: 1 }, { unique: true });
ReviewSchema.index({ productId: 1, status: 1, createdAt: -1 });

export const Review: Model<IReview> =
  mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema, 'reviews');
