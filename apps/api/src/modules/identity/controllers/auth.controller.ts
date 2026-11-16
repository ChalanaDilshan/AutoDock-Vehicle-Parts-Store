import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import {
  RegisterUserSchema,
  LoginUserSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from '../validators/auth.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { env } from '../../../config/env.js';

export class AuthController {
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RegisterUserSchema.parse(req.body);
      const user = await authService.registerCustomer(validated);

      sendSuccess({
        res,
        statusCode: 201,
        code: 'USER_REGISTERED',
        message: 'Registration successful. Account created.',
        data: {
          userId: user._id.toString(),
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = LoginUserSchema.parse(req.body);
      const result = await authService.loginUser(validated);

      // Set HTTP-Only Secure cookie for refresh token
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: env.NODE_ENV === 'production',
        sameSite: 'strict',
        path: `${env.API_PREFIX}/auth`,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      sendSuccess({
        res,
        code: 'LOGIN_SUCCESS',
        message: 'Authentication successful',
        data: {
          accessToken: result.accessToken,
          tokenType: 'Bearer',
          expiresInSeconds: result.expiresInSeconds,
          user: result.user,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (req.user) {
        await authService.logoutUser(req.user.userId);
      }

      res.clearCookie('refreshToken', {
        path: `${env.API_PREFIX}/auth`,
      });

      sendSuccess({
        res,
        code: 'LOGOUT_SUCCESS',
        message: 'Successfully logged out',
      });
    } catch (err) {
      next(err);
    }
  }

  public async refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const token = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!token) {
        res.status(401).json({
          success: false,
          code: 'REFRESH_TOKEN_REQUIRED',
          message: 'Refresh token cookie or payload is required',
        });
        return;
      }

      const result = await authService.refreshAccessToken(token);

      sendSuccess({
        res,
        code: 'TOKEN_REFRESHED',
        message: 'Access token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          tokenType: 'Bearer',
          expiresInSeconds: result.expiresInSeconds,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ForgotPasswordSchema.parse(req.body);
      await authService.requestPasswordReset(validated.email);

      sendSuccess({
        res,
        code: 'PASSWORD_RESET_DISPATCHED',
        message: 'If an account exists with this email, password reset instructions have been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ResetPasswordSchema.parse(req.body);
      await authService.resetPassword(validated.token, validated.newPassword);

      sendSuccess({
        res,
        code: 'PASSWORD_RESET_SUCCESS',
        message: 'Password reset successful. You may now log in with your new password.',
      });
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
