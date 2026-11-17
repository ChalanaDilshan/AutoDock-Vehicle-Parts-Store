import { Request, Response, NextFunction } from 'express';
import { recommendationService } from '../services/recommendation.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export async function getRecommendations(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.userId;
    const { productId, limit } = req.query;

    const parsedLimit = limit ? parseInt(limit as string, 10) : 8;

    const recommendations = await recommendationService.getRecommendations(
      userId,
      productId as string | undefined,
      parsedLimit
    );

    sendSuccess({
      res,
      code: 'RECOMMENDATIONS_RETRIEVED',
      message: 'Product recommendations retrieved successfully',
      data: recommendations,
    });
  } catch (err) {
    next(err);
  }
}
