import { Request, Response, NextFunction } from 'express';
import { promotionService } from '../services/promotion.service.js';
import {
  CreateSellerPromotionSchema,
  UpdatePromotionStatusSchema,
} from '../validators/promotion.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

export class SellerPromotionController {
  private getSellerId(req: Request): string {
    const sellerId = req.user?.sellerId;
    if (!sellerId) {
      throw new AppError('Seller profile context is required for this operation', 403, 'SELLER_CONTEXT_REQUIRED');
    }
    return sellerId;
  }

  public async createPromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const userId = req.user!.userId;
      const validated = CreateSellerPromotionSchema.parse(req.body);

      const promotion = await promotionService.createSellerPromotion(sellerId, validated, userId);

      sendSuccess({
        res,
        statusCode: 201,
        code: 'PROMOTION_CREATED',
        message: 'Seller promotion coupon created successfully',
        data: { promotion },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const status = req.query.status as string | undefined;

      const result = await promotionService.getSellerPromotions(sellerId, { page, limit, status });

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getPromotionById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const result = await promotionService.getSellerPromotionById(req.params.id, sellerId);

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const validated = UpdatePromotionStatusSchema.parse(req.body);
      const promotion = await promotionService.updateSellerPromotionStatus(
        req.params.id,
        sellerId,
        validated.status
      );

      sendSuccess({
        res,
        message: `Promotion status updated to ${validated.status}`,
        data: { promotion },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const sellerPromotionController = new SellerPromotionController();
