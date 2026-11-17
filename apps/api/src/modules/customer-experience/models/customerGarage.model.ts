import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IGarageVehicle {
  _id: mongoose.Types.ObjectId;
  make: string;
  model: string;
  year: number;
  engine?: string | null;
  vin?: string | null;
  nickname?: string | null;
  isDefault: boolean;
}

export interface ICustomerGarage extends Document {
  userId: mongoose.Types.ObjectId;
  vehicles: IGarageVehicle[];
  createdAt: Date;
  updatedAt: Date;
}

const GarageVehicleSchema = new Schema<IGarageVehicle>(
  {
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
    year: {
      type: Number,
      required: [true, 'Vehicle year is required'],
      min: [1960, 'Year must be 1960 or later'],
      max: [2035, 'Year cannot exceed 2035'],
      validate: {
        validator: Number.isInteger,
        message: 'Year must be an integer',
      },
    },
    engine: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    vin: {
      type: String,
      trim: true,
      uppercase: true,
      default: null,
    },
    nickname: {
      type: String,
      trim: true,
      maxlength: [50, 'Nickname cannot exceed 50 characters'],
      default: null,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id.toString();
        delete ret._id;
        return ret;
      },
    },
  }
);

const CustomerGarageSchema = new Schema<ICustomerGarage>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: [true, 'Customer user reference is required'],
      unique: true,
      index: true,
    },
    vehicles: {
      type: [GarageVehicleSchema],
      default: [],
      validate: {
        validator: (arr: IGarageVehicle[]) => arr.length <= 10,
        message: 'A maximum of 10 vehicles may be saved in My Garage',
      },
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

export const CustomerGarage: Model<ICustomerGarage> =
  mongoose.models.CustomerGarage ||
  mongoose.model<ICustomerGarage>('CustomerGarage', CustomerGarageSchema, 'customer_garages');
