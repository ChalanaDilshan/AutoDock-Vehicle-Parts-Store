import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { UpdateProfileSchema } from '../validators/auth.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class UserController {
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await authService.getUserProfile(req.user!.userId);

      sendSuccess({
        res,
        data: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
          accountStatus: user.accountStatus,
          isEmailVerified: user.isEmailVerified,
          sellerId: user.sellerId ? user.sellerId.toString() : null,
          shippingAddresses: user.shippingAddresses,
          createdAt: user.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UpdateProfileSchema.parse(req.body);
      const user = await authService.updateUserProfile(req.user!.userId, validated);

      sendSuccess({
        res,
        code: 'PROFILE_UPDATED',
        message: 'Profile details updated successfully',
        data: {
          id: user._id.toString(),
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          role: user.role,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
