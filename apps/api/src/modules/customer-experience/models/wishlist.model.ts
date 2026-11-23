import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IWishlistItem {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  addedAt: Date;
}

export interface IWishlist extends Document {
  userId: mongoose.Types.ObjectId;
  items: IWishlistItem[];
  createdAt: Date;
  updatedAt: Date;
}

const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        ret.productId = ret.productId?.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const WishlistSchema = new Schema<IWishlist>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Customer user reference is required'],
      unique: true,
      index: true,
    },
    items: {
      type: [WishlistItemSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        ret.userId = ret.userId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Wishlist: Model<IWishlist> =
  mongoose.models.Wishlist || mongoose.model<IWishlist>('Wishlist', WishlistSchema, 'wishlists');
