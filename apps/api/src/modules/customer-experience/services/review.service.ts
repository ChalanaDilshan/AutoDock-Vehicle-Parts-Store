import mongoose from 'mongoose';
import { Review, IReview, ReviewStatus } from '../models/review.model.js';
import { Product } from '../models/product.model.js';
import { orderVerificationService } from '../contracts/orderConsumer.contract.js';

export class ReviewService {
  /**
   * Recalculates and updates product's averageRating and reviewCount atomically.
   */
  private async recalculateProductRating(productId: string): Promise<void> {
    const stats = await Review.aggregate([
      {
        $match: {
          productId: new mongoose.Types.ObjectId(productId),
          status: 'PUBLISHED',
        },
      },
      {
        $group: {
          _id: '$productId',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      const avg = Math.round(stats[0].avgRating * 10) / 10;
      await Product.findByIdAndUpdate(productId, {
        $set: {
          averageRating: avg,
          reviewCount: stats[0].count,
        },
      });
    } else {
      await Product.findByIdAndUpdate(productId, {
        $set: {
          averageRating: 0,
          reviewCount: 0,
        },
      });
    }
  }

  public async submitReview(
    userId: string,
    data: {
      productId: string;
      suborderId: string;
      rating: number;
      title?: string | null;
      comment: string;
      images?: string[];
    }
  ): Promise<IReview> {
    // 1. Verify delivered purchase proof via MOD-03 contract
    const purchaseCheck = await orderVerificationService.verifyDeliveredPurchase(
      userId,
      data.productId,
      data.suborderId
    );

    if (!purchaseCheck.isDelivered) {
      const err = new Error(
        purchaseCheck.reason ||
          'Reviews are strictly restricted to verified purchasers with delivered orders'
      );
      (err as any).statusCode = 403;
      (err as any).code = 'VERIFIED_PURCHASE_REQUIRED';
      throw err;
    }

    // 2. Prevent duplicate reviews for the same delivered suborder
    const existing = await Review.findOne({
      productId: new mongoose.Types.ObjectId(data.productId),
      userId: new mongoose.Types.ObjectId(userId),
      suborderId: new mongoose.Types.ObjectId(data.suborderId),
    });

    if (existing) {
      const err = new Error('A customer review has already been submitted for this purchase');
      (err as any).statusCode = 409;
      (err as any).code = 'DUPLICATE_REVIEW_FOR_ORDER';
      throw err;
    }

    // 3. Create review (publishes immediately without pre-approval queue)
    const review = await Review.create({
      productId: new mongoose.Types.ObjectId(data.productId),
      userId: new mongoose.Types.ObjectId(userId),
      suborderId: new mongoose.Types.ObjectId(data.suborderId),
      rating: data.rating,
      title: data.title || null,
      comment: data.comment,
      images: data.images || [],
      status: 'PUBLISHED',
    });

    // 4. Atomically recalculate rating statistics on parent product
    await this.recalculateProductRating(data.productId);

    return review;
  }

  public async getProductReviews(
    productId: string,
    page: number = 1,
    limit: number = 20
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const filter = {
      productId: new mongoose.Types.ObjectId(productId),
      status: 'PUBLISHED',
    };

    const [reviews, totalRecords, distribution] = await Promise.all([
      Review.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Review.countDocuments(filter),
      Review.aggregate([
        { $match: filter },
        { $group: { _id: '$rating', count: { $sum: 1 } } },
      ]),
    ]);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach((d) => {
      ratingDistribution[d._id] = d.count;
    });

    const totalPages = Math.ceil(totalRecords / safeLimit) || 1;

    return {
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images,
        createdAt: r.createdAt,
      })),
      ratingDistribution,
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalRecords,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  public async getSellerReviews(sellerId: string, page: number = 1, limit: number = 20) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(50, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    // Find all products owned by this seller
    const productIds = await Product.distinct('_id', {
      sellerId: new mongoose.Types.ObjectId(sellerId),
    });

    const filter = {
      productId: { $in: productIds },
    };

    const [reviews, totalRecords] = await Promise.all([
      Review.find(filter)
        .populate('productId', 'title sku partNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / safeLimit) || 1;

    return {
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        product: r.productId,
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images,
        status: r.status,
        createdAt: r.createdAt,
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalRecords,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  public async getAdminReviews(
    page: number = 1,
    limit: number = 20,
    status?: ReviewStatus
  ) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const filter: Record<string, any> = {};
    if (status) {
      filter.status = status;
    }

    const [reviews, totalRecords] = await Promise.all([
      Review.find(filter)
        .populate('productId', 'title sku partNumber')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(totalRecords / safeLimit) || 1;

    return {
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        product: r.productId,
        userId: r.userId.toString(),
        suborderId: r.suborderId.toString(),
        rating: r.rating,
        title: r.title,
        comment: r.comment,
        images: r.images,
        status: r.status,
        moderatedAt: r.moderatedAt,
        moderationReason: r.moderationReason,
        createdAt: r.createdAt,
      })),
      pagination: {
        page: safePage,
        limit: safeLimit,
        totalRecords,
        totalPages,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      },
    };
  }

  public async adminModerateReview(
    adminId: string,
    reviewId: string,
    action: 'HIDE' | 'RESTORE',
    moderationReason: string
  ): Promise<IReview> {
    const review = await Review.findById(reviewId);
    if (!review) {
      const err = new Error('Review not found');
      (err as any).statusCode = 404;
      (err as any).code = 'REVIEW_NOT_FOUND';
      throw err;
    }

    const newStatus: ReviewStatus = action === 'HIDE' ? 'HIDDEN_BY_ADMIN' : 'PUBLISHED';

    review.status = newStatus;
    review.moderatedAt = new Date();
    review.moderatedBy = new mongoose.Types.ObjectId(adminId);
    review.moderationReason = moderationReason;

    await review.save();

    // Recalculate parent product rating atomically
    await this.recalculateProductRating(review.productId.toString());

    return review;
  }
}

export const reviewService = new ReviewService();
