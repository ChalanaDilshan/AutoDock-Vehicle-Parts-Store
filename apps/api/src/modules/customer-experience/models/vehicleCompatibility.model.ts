import mongoose, { Schema, Model } from 'mongoose';

export interface IVehicleCompatibility {
  _id?: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  engineCode?: string | null;
  trimOrChassis?: string | null;
  compatibilityNotes?: string | null;
  createdAt?: Date;
}

const VehicleCompatibilitySchema = new Schema<IVehicleCompatibility>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product reference is required'],
      index: true,
    },
    make: {
      type: String,
      required: [true, 'Vehicle make is required'],
      trim: true,
      uppercase: true,
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
      uppercase: true,
    },
    yearFrom: {
      type: Number,
      required: [true, 'Starting compatibility year is required'],
      min: [1960, 'Year must be 1960 or later'],
      max: [2035, 'Year cannot exceed 2035'],
      validate: {
        validator: Number.isInteger,
        message: 'Year must be an integer',
      },
    },
    yearTo: {
      type: Number,
      required: [true, 'Ending compatibility year is required'],
      min: [1960, 'Year must be 1960 or later'],
      max: [2035, 'Year cannot exceed 2035'],
      validate: {
        validator: function (this: IVehicleCompatibility, val: number) {
          return Number.isInteger(val) && val >= this.yearFrom;
        },
        message: 'yearTo must be an integer greater than or equal to yearFrom',
      },
    },
    engineCode: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    trimOrChassis: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    compatibilityNotes: {
      type: String,
      trim: true,
      maxlength: [300, 'Compatibility notes cannot exceed 300 characters'],
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        ret.productId = ret.productId?.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Indexes
VehicleCompatibilitySchema.index(
  { make: 1, model: 1, yearFrom: 1, yearTo: 1, productId: 1 },
  { unique: true }
);
VehicleCompatibilitySchema.index({ make: 1, model: 1 });

export const VehicleCompatibility: Model<IVehicleCompatibility> =
  mongoose.models.VehicleCompatibility ||
  mongoose.model<IVehicleCompatibility>(
    'VehicleCompatibility',
    VehicleCompatibilitySchema,
    'vehicle_compatibility'
  );
