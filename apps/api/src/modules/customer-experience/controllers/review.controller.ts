import { Request, Response, NextFunction } from 'express';
import { reviewService } from '../services/review.service.js';
import { SubmitReviewSchema, ModerateReviewSchema } from '../validators/review.validator.js';
import { sendSuccess, sendError } from '../../../shared/utils/apiResponse.js';

export async function submitReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.userId;

    const parseResult = SubmitReviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid review payload',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const review = await reviewService.submitReview(userId, parseResult.data);

    sendSuccess({
      res,
      statusCode: 201,
      code: 'REVIEW_PUBLISHED',
      message: 'Review submitted and published successfully',
      data: review,
    });
  } catch (err) {
    next(err);
  }
}

export async function getProductReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { id } = req.params;
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await reviewService.getProductReviews(id, page, limit);

    sendSuccess({
      res,
      code: 'REVIEWS_RETRIEVED',
      message: 'Product reviews retrieved successfully',
      data: result.reviews,
      meta: {
        ratingDistribution: result.ratingDistribution,
        pagination: result.pagination,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSellerReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sellerId = req.user?.sellerId;
    if (!sellerId) {
      sendError({
        res,
        statusCode: 403,
        code: 'SELLER_PROFILE_REQUIRED',
        message: 'Seller profile required',
      });
      return;
    }

    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

    const result = await reviewService.getSellerReviews(sellerId, page, limit);

    sendSuccess({
      res,
      code: 'SELLER_REVIEWS_RETRIEVED',
      message: 'Customer reviews on your products retrieved successfully (read-only)',
      data: result.reviews,
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    next(err);
  }
}

export async function adminGetReviews(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
    const status = req.query.status as any;

    const result = await reviewService.getAdminReviews(page, limit, status);

    sendSuccess({
      res,
      code: 'ADMIN_REVIEWS_RETRIEVED',
      message: 'Reviews retrieved for administration',
      data: result.reviews,
      meta: { pagination: result.pagination },
    });
  } catch (err) {
    next(err);
  }
}

export async function adminModerateReview(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const adminId = req.user!.userId;
    const { id } = req.params;

    const parseResult = ModerateReviewSchema.safeParse(req.body);
    if (!parseResult.success) {
      sendError({
        res,
        statusCode: 400,
        code: 'VALIDATION_FAILED',
        message: 'Invalid moderation payload',
        errors: parseResult.error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      });
      return;
    }

    const updated = await reviewService.adminModerateReview(
      adminId,
      id,
      parseResult.data.action,
      parseResult.data.moderationReason
    );

    sendSuccess({
      res,
      code: 'REVIEW_MODERATED',
      message: `Review successfully updated to ${updated.status}`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}
