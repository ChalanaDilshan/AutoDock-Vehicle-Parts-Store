import { Request, Response, NextFunction } from 'express';
import { promotionService } from '../services/promotion.service.js';
import { subsidyService } from '../services/subsidy.service.js';
import {
  CreateAdminPromotionSchema,
  UpdatePromotionStatusSchema,
} from '../validators/promotion.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class AdminPromotionController {
  public async createPromotion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const validated = CreateAdminPromotionSchema.parse(req.body);
      const promotion = await promotionService.createAdminPromotion(validated, adminId);

      sendSuccess({
        res,
        statusCode: 201,
        code: 'PROMOTION_CREATED',
        message: 'AutoDock marketplace-wide promotion created successfully',
        data: { promotion },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getPromotions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as string | undefined;

      const result = await promotionService.getAdminPromotions({ page, limit, status });

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
      const result = await promotionService.getAdminPromotionById(req.params.id);

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
      const validated = UpdatePromotionStatusSchema.parse(req.body);
      const promotion = await promotionService.updateAdminPromotionStatus(req.params.id, validated.status);

      sendSuccess({
        res,
        message: `Promotion status updated to ${validated.status}`,
        data: { promotion },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getSubsidies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const status = req.query.status as string | undefined;
      const sellerId = req.query.sellerId as string | undefined;

      const result = await subsidyService.getAdminSubsidies({ page, limit, status, sellerId });

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminPromotionController = new AdminPromotionController();
