import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User, IUser, UserRole } from '../models/user.model.js';
import {
  RegisterUserInput,
  LoginUserInput,
  UpdateProfileInput,
} from '../validators/auth.validator.js';
import { env } from '../../../config/env.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  sellerId?: string | null;
}

export interface AuthTokensResult {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    sellerId?: string | null;
  };
}

export class AuthService {
  public async registerCustomer(input: RegisterUserInput): Promise<IUser> {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw new AppError('An account with this email address already exists', 409, 'RESOURCE_CONFLICT');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(input.password, salt);

    const user = await User.create({
      email: input.email.toLowerCase(),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      role: 'CUSTOMER',
      accountStatus: 'ACTIVE',
      isEmailVerified: false,
    });

    return user;
  }

  public async loginUser(input: LoginUserInput): Promise<AuthTokensResult> {
    const user = await User.findOne({ email: input.email.toLowerCase() }).select(
      '+passwordHash +refreshTokenHash'
    );

    if (!user) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    if (user.accountStatus === 'SUSPENDED' || user.accountStatus === 'DEACTIVATED') {
      throw new AppError('Your account has been suspended or deactivated. Contact AutoDock support.', 403, 'ACCOUNT_SUSPENDED');
    }

    const isMatch = await user.comparePassword(input.password);
    if (!isMatch) {
      throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }

    const payload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      sellerId: user.sellerId ? user.sellerId.toString() : null,
    };

    const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(
      { userId: user._id.toString() },
      env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Persist refresh token hash for revocation capability
    const refreshSalt = await bcrypt.genSalt(10);
    user.refreshTokenHash = await bcrypt.hash(refreshToken, refreshSalt);
    await user.save();

    return {
      accessToken,
      refreshToken,
      expiresInSeconds: 900,
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        sellerId: user.sellerId ? user.sellerId.toString() : null,
      },
    };
  }

  public async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; expiresInSeconds: number }> {
    try {
      const decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET) as { userId: string };
      const user = await User.findById(decoded.userId).select('+refreshTokenHash');

      if (!user || !user.refreshTokenHash) {
        throw new AppError('Invalid refresh token session', 401, 'INVALID_TOKEN');
      }

      const isValid = await bcrypt.compare(refreshToken, user.refreshTokenHash);
      if (!isValid) {
        throw new AppError('Refresh token has been revoked', 401, 'TOKEN_REVOKED');
      }

      const payload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        sellerId: user.sellerId ? user.sellerId.toString() : null,
      };

      const accessToken = jwt.sign(payload, env.JWT_ACCESS_SECRET, {
        expiresIn: '15m',
      });

      return {
        accessToken,
        expiresInSeconds: 900,
      };
    } catch (err: unknown) {
      if (err instanceof AppError) throw err;
      throw new AppError('Invalid or expired refresh token', 401, 'INVALID_TOKEN');
    }
  }

  public async logoutUser(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
  }

  public async getUserProfile(userId: string): Promise<IUser> {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User profile not found', 404, 'NOT_FOUND');
    }
    return user;
  }

  public async updateUserProfile(userId: string, input: UpdateProfileInput): Promise<IUser> {
    // Deliberately discard any role or sellerId property in input to prevent privilege escalation
    const updateFields: Partial<IUser> = {};
    if (input.firstName) updateFields.firstName = input.firstName;
    if (input.lastName) updateFields.lastName = input.lastName;
    if (input.phone) updateFields.phone = input.phone;

    const user = await User.findByIdAndUpdate(userId, updateFields, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      throw new AppError('User not found', 404, 'NOT_FOUND');
    }

    return user;
  }

  public async requestPasswordReset(email: string): Promise<{ token: string }> {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return dummy token without error to prevent user enumeration
      return { token: 'mock-reset-token' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken = hashedToken;
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    return { token: rawToken };
  }

  public async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select('+passwordResetToken +passwordResetExpiresAt');

    if (!user) {
      throw new AppError('Password reset token is invalid or has expired', 400, 'INVALID_RESET_TOKEN');
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = null;
    user.passwordResetExpiresAt = null;
    user.refreshTokenHash = null; // Revoke existing sessions
    await user.save();
  }
}

export const authService = new AuthService();
