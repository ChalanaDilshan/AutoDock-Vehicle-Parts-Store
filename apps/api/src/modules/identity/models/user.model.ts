import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';
export type UserAccountStatus =
  | 'ACTIVE'
  | 'PENDING_EMAIL_VERIFICATION'
  | 'RESTRICTED'
  | 'SUSPENDED'
  | 'DEACTIVATED';

export interface IShippingAddress {
  street: string;
  city: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault?: boolean;
}

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  accountStatus: UserAccountStatus;
  shippingAddresses: IShippingAddress[];
  isEmailVerified: boolean;
  emailVerificationToken?: string | null;
  emailVerificationExpiresAt?: Date | null;
  passwordResetToken?: string | null;
  passwordResetExpiresAt?: Date | null;
  refreshTokenHash?: string | null;
  sellerId?: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
}

const ShippingAddressSchema = new Schema<IShippingAddress>(
  {
    street: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    province: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Do not expose password hash in general queries
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['CUSTOMER', 'SELLER', 'ADMIN'],
      default: 'CUSTOMER',
      required: true,
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['ACTIVE', 'PENDING_EMAIL_VERIFICATION', 'RESTRICTED', 'SUSPENDED', 'DEACTIVATED'],
      default: 'ACTIVE',
      required: true,
      index: true,
    },
    shippingAddresses: [ShippingAddressSchema],
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: { type: String, default: null, select: false },
    emailVerificationExpiresAt: { type: Date, default: null, select: false },
    passwordResetToken: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
    refreshTokenHash: { type: String, default: null, select: false },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'SellerProfile',
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
