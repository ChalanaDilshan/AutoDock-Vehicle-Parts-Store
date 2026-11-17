import mongoose, { Document, Schema, Model } from 'mongoose';

export type ProductCondition = 'BRAND_NEW' | 'RECONDITIONED' | 'USED';
export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'INACTIVE' | 'OUT_OF_STOCK';

export interface IProductImage {
  url: string;
  isPrimary: boolean;
  altText?: string | null;
}

export interface IProductSpecification {
  key: string;
  value: string;
}

export interface IProduct extends Document {
  sellerId: mongoose.Types.ObjectId;
  title: string;
  sku: string;
  partNumber: string;
  categoryId: mongoose.Types.ObjectId;
  brandId: mongoose.Types.ObjectId;
  condition: ProductCondition;
  description: string;
  priceInCents: number;
  stock: number;
  lowStockThreshold: number;
  images: IProductImage[];
  specifications: IProductSpecification[];
  warrantyMonths: number;
  weightGrams?: number | null;
  status: ProductStatus;
  averageRating: number;
  reviewCount: number;
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductImageSchema = new Schema<IProductImage>(
  {
    url: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    altText: {
      type: String,
      trim: true,
      maxlength: 100,
      default: null,
    },
  },
  { _id: false }
);

const ProductSpecificationSchema = new Schema<IProductSpecification>(
  {
    key: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    sellerId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Owning seller ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    sku: {
      type: String,
      required: [true, 'Product SKU is required'],
      trim: true,
      uppercase: true,
    },
    partNumber: {
      type: String,
      required: [true, 'Manufacturer part number is required'],
      trim: true,
      index: true,
    },
    categoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true,
    },
    brandId: {
      type: Schema.Types.ObjectId,
      ref: 'Brand',
      required: [true, 'Brand reference is required'],
      index: true,
    },
    condition: {
      type: String,
      enum: ['BRAND_NEW', 'RECONDITIONED', 'USED'],
      default: 'BRAND_NEW',
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      minlength: [20, 'Description must be at least 20 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters'],
    },
    priceInCents: {
      type: Number,
      required: [true, 'Price in cents is required'],
      min: [100, 'Price must be at least Rs. 1.00 (100 cents)'],
      validate: {
        validator: Number.isInteger,
        message: 'Price must be a precise integer minor unit (cents)',
      },
    },
    stock: {
      type: Number,
      required: [true, 'Stock count is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be an integer count',
      },
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },
    images: {
      type: [ProductImageSchema],
      validate: {
        validator: (arr: IProductImage[]) => arr && arr.length > 0,
        message: 'At least one product image is required',
      },
    },
    specifications: {
      type: [ProductSpecificationSchema],
      default: [],
    },
    warrantyMonths: {
      type: Number,
      default: 0,
      min: 0,
    },
    weightGrams: {
      type: Number,
      default: null,
      min: 0,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'ACTIVE', 'INACTIVE', 'OUT_OF_STOCK'],
      default: 'DRAFT',
      index: true,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    version: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        ret.sellerId = ret.sellerId?.toString();
        ret.categoryId = ret.categoryId?.toString();
        ret.brandId = ret.brandId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
ProductSchema.index({ sellerId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ categoryId: 1, status: 1, priceInCents: 1 });
ProductSchema.index({ brandId: 1, status: 1 });
ProductSchema.index({ sellerId: 1, status: 1 });
ProductSchema.index({ status: 1, averageRating: -1 });
ProductSchema.index({ title: 'text', description: 'text', partNumber: 'text' });

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', ProductSchema, 'products');
