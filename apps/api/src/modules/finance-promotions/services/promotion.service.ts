import mongoose from 'mongoose';
import { Promotion, IPromotion, PromotionFundingSource, PromotionDiscountType } from '../models/promotion.model.js';
import { PromotionRedemption } from '../models/promotionRedemption.model.js';
import { PlatformSubsidyLedger } from '../models/platformSubsidyLedger.model.js';
import {
  PromotionQuoteInputDTO,
  PromotionValidationResultDTO,
  PromotionSellerDiscountAllocationDTO,
} from '../contracts/promotion.contract.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import { logger } from '../../../shared/utils/logger.js';
import { financeAuditNotifier } from './financeAuditNotifier.js';

export interface CreateSellerPromotionInput {
  code: string;
  title: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  minSpendInCents?: number;
  maxDiscountInCents?: number;
  applicableProductIds?: string[];
  startDate: string | Date;
  endDate: string | Date;
  totalUsageLimit?: number;
  perCustomerLimit?: number;
}

export interface CreateAdminPromotionInput {
  code: string;
  title: string;
  description?: string;
  discountType: PromotionDiscountType;
  discountValue: number;
  minSpendInCents?: number;
  maxDiscountInCents?: number;
  applicableCategoryIds?: string[];
  applicableProductIds?: string[];
  startDate: string | Date;
  endDate: string | Date;
  totalUsageLimit?: number;
  perCustomerLimit?: number;
}

export class PromotionService {
  /**
   * Seller creates a seller-funded promotional coupon code for their own products.
   */
  public async createSellerPromotion(
    sellerId: string,
    input: CreateSellerPromotionInput,
    userId: string
  ): Promise<IPromotion> {
    const code = input.code.trim().toUpperCase();

    // Check code uniqueness
    const existing = await Promotion.findOne({ code });
    if (existing) {
      throw new AppError(`Promotion code '${code}' is already in use`, 409, 'PROMOTION_CODE_EXISTS');
    }

    const applicableProductIds = (input.applicableProductIds || []).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const promotion = await Promotion.create({
      code,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      fundingSource: 'SELLER_FUNDED',
      sellerId: new mongoose.Types.ObjectId(sellerId),
      discountType: input.discountType,
      discountValue: input.discountValue,
      minSpendInCents: input.minSpendInCents || 0,
      maxDiscountInCents: input.maxDiscountInCents || null,
      applicableProductIds,
      applicableCategoryIds: [],
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      totalUsageLimit: input.totalUsageLimit || null,
      perCustomerLimit: input.perCustomerLimit || 1,
      currentUsageCount: 0,
      status: 'ACTIVE',
      createdBy: new mongoose.Types.ObjectId(userId),
    });

    logger.info(`[PromotionService] Created seller promotion ${code}`, {
      promotionId: promotion._id.toString(),
      sellerId,
    });

    financeAuditNotifier.logAudit({
      action: 'SELLER_PROMOTION_CREATED',
      actorId: userId,
      actorRole: 'SELLER',
      targetId: promotion._id.toString(),
      details: { code, sellerId, discountType: input.discountType, discountValue: input.discountValue },
    });

    return promotion;
  }

  /**
   * Seller lists own promotions with filters and pagination.
   */
  public async getSellerPromotions(
    sellerId: string,
    query: { status?: string; page?: number; limit?: number }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, any> = { sellerId: new mongoose.Types.ObjectId(sellerId) };

    if (query.status) filter.status = query.status;

    const [promotions, total] = await Promise.all([
      Promotion.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Promotion.countDocuments(filter),
    ]);

    return {
      promotions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Seller views promotion details along with redemption metrics (BOLA guarded).
   */
  public async getSellerPromotionById(promotionId: string, sellerId: string) {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404, 'PROMOTION_NOT_FOUND');
    }

    if (promotion.sellerId?.toString() !== sellerId) {
      throw new AppError('Forbidden: Access to another seller promotion denied', 403, 'FORBIDDEN_PROMOTION_ACCESS');
    }

    const [redemptionCount, redemptionAgg] = await Promise.all([
      PromotionRedemption.countDocuments({ promotionId: promotion._id }),
      PromotionRedemption.aggregate([
        { $match: { promotionId: promotion._id } },
        { $group: { _id: null, totalDiscountFunded: { $sum: '$discountAmountInCents' } } },
      ]),
    ]);

    const totalDiscountFundedInCents = redemptionAgg[0]?.totalDiscountFunded || 0;

    return {
      promotion,
      redemptionCount,
      totalDiscountFundedInCents,
    };
  }

  /**
   * Seller updates status (pause/reactivate) of own promotion.
   */
  public async updateSellerPromotionStatus(
    promotionId: string,
    sellerId: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<IPromotion> {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404, 'PROMOTION_NOT_FOUND');
    }

    if (promotion.sellerId?.toString() !== sellerId) {
      throw new AppError('Forbidden: You can only update your own promotions', 403, 'FORBIDDEN_PROMOTION_ACCESS');
    }

    promotion.status = status;
    await promotion.save();

    return promotion;
  }

  /**
   * Administrator creates an AutoDock-funded marketplace-wide promotion.
   */
  public async createAdminPromotion(input: CreateAdminPromotionInput, adminId: string): Promise<IPromotion> {
    const code = input.code.trim().toUpperCase();

    const existing = await Promotion.findOne({ code });
    if (existing) {
      throw new AppError(`Promotion code '${code}' is already in use`, 409, 'PROMOTION_CODE_EXISTS');
    }

    const applicableCategoryIds = (input.applicableCategoryIds || []).map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const applicableProductIds = (input.applicableProductIds || []).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const promotion = await Promotion.create({
      code,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      fundingSource: 'AUTODOCK_FUNDED',
      sellerId: null,
      discountType: input.discountType,
      discountValue: input.discountValue,
      minSpendInCents: input.minSpendInCents || 0,
      maxDiscountInCents: input.maxDiscountInCents || null,
      applicableCategoryIds,
      applicableProductIds,
      startDate: new Date(input.startDate),
      endDate: new Date(input.endDate),
      totalUsageLimit: input.totalUsageLimit || null,
      perCustomerLimit: input.perCustomerLimit || 1,
      currentUsageCount: 0,
      status: 'ACTIVE',
      createdBy: new mongoose.Types.ObjectId(adminId),
    });

    logger.info(`[PromotionService] Created admin marketplace promotion ${code}`, {
      promotionId: promotion._id.toString(),
      adminId,
    });

    financeAuditNotifier.logAudit({
      action: 'ADMIN_PROMOTION_CREATED',
      actorId: adminId,
      actorRole: 'ADMIN',
      targetId: promotion._id.toString(),
      details: { code, fundingSource: 'AUTODOCK_FUNDED', discountType: input.discountType, discountValue: input.discountValue },
    });

    return promotion;
  }

  /**
   * Administrator lists all marketplace promotions.
   */
  public async getAdminPromotions(query: { status?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: Record<string, any> = {};

    if (query.status) filter.status = query.status;

    const [promotions, total] = await Promise.all([
      Promotion.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Promotion.countDocuments(filter),
    ]);

    return {
      promotions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Administrator views promotion details and platform subsidy liabilities incurred.
   */
  public async getAdminPromotionById(promotionId: string) {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404, 'PROMOTION_NOT_FOUND');
    }

    const [redemptionCount, subsidyAgg] = await Promise.all([
      PromotionRedemption.countDocuments({ promotionId: promotion._id }),
      PlatformSubsidyLedger.aggregate([
        { $match: { promotionId: promotion._id } },
        { $group: { _id: null, totalSubsidy: { $sum: '$subsidyAmountInCents' } } },
      ]),
    ]);

    const totalSubsidyIncurredInCents = subsidyAgg[0]?.totalSubsidy || 0;

    return {
      promotion,
      redemptionCount,
      totalSubsidyIncurredInCents,
    };
  }

  /**
   * Administrator updates status (ACTIVE/INACTIVE) of any promotion.
   */
  public async updateAdminPromotionStatus(
    promotionId: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<IPromotion> {
    const promotion = await Promotion.findById(promotionId);
    if (!promotion) {
      throw new AppError('Promotion not found', 404, 'PROMOTION_NOT_FOUND');
    }

    promotion.status = status;
    await promotion.save();

    return promotion;
  }

  /**
   * Authoritative cross-module entry point: Validates coupon code and calculates exact
   * deterministic discount allocations across eligible items and sellers for MOD-03 Checkout.
   */
  public async validateAndQuotePromotion(
    input: PromotionQuoteInputDTO
  ): Promise<PromotionValidationResultDTO> {
    const code = input.promoCode.trim().toUpperCase();
    const now = new Date();

    const promotion = await Promotion.findOne({ code });
    if (!promotion) {
      return {
        isValid: false,
        totalDiscountInCents: 0,
        sellerAllocations: [],
        rejectionReason: 'Promotion code does not exist',
        rejectionCode: 'INVALID_CODE',
      };
    }

    // 1. Status Check
    if (promotion.status !== 'ACTIVE') {
      return {
        isValid: false,
        totalDiscountInCents: 0,
        sellerAllocations: [],
        rejectionReason: 'Promotion is no longer active',
        rejectionCode: 'EXPIRED',
      };
    }

    // 2. Active Window Check
    if (now < promotion.startDate || now > promotion.endDate) {
      return {
        isValid: false,
        totalDiscountInCents: 0,
        sellerAllocations: [],
        rejectionReason: 'Promotion is outside its valid active date window',
        rejectionCode: 'EXPIRED',
      };
    }

    // 3. Global Usage Limit Check
    if (promotion.totalUsageLimit && promotion.currentUsageCount >= promotion.totalUsageLimit) {
      return {
        isValid: false,
        totalDiscountInCents: 0,
        sellerAllocations: [],
        rejectionReason: 'Promotion global redemption limit has been reached',
        rejectionCode: 'USAGE_LIMIT_EXCEEDED',
      };
    }

    // 4. Per-Customer Usage Limit Check
    if (input.customerId && promotion.perCustomerLimit) {
      const customerRedemptions = await PromotionRedemption.countDocuments({
        promotionId: promotion._id,
        customerId: new mongoose.Types.ObjectId(input.customerId),
      });

      if (customerRedemptions >= promotion.perCustomerLimit) {
        return {
          isValid: false,
          totalDiscountInCents: 0,
          sellerAllocations: [],
          rejectionReason: 'You have already reached the redemption limit for this promotion',
          rejectionCode: 'USAGE_LIMIT_EXCEEDED',
        };
      }
    }

    // 5. Eligible Items Filter
    const eligibleItems = input.items.filter((item) => {
      // Seller-funded promotion: product must belong to the promotion seller
      if (promotion.fundingSource === 'SELLER_FUNDED') {
        if (promotion.sellerId && item.sellerId !== promotion.sellerId.toString()) {
          return false;
        }
      }

      // Product-specific scope check
      if (promotion.applicableProductIds && promotion.applicableProductIds.length > 0) {
        const itemProdId = item.productId;
        const matches = promotion.applicableProductIds.some((pId) => pId.toString() === itemProdId);
        if (!matches) return false;
      }

      // Category-specific scope check
      if (promotion.applicableCategoryIds && promotion.applicableCategoryIds.length > 0) {
        const itemCatId = item.categoryId;
        const matches = promotion.applicableCategoryIds.some((cId) => cId.toString() === itemCatId);
        if (!matches) return false;
      }

      return true;
    });

    if (eligibleItems.length === 0) {
      return {
        isValid: false,
        totalDiscountInCents: 0,
        sellerAllocations: [],
        rejectionReason:
          promotion.fundingSource === 'SELLER_FUNDED'
            ? 'Promo code is only valid for products from the issuing seller'
            : 'None of the cart items are eligible for this promotional discount',
        rejectionCode: promotion.fundingSource === 'SELLER_FUNDED' ? 'SELLER_MISMATCH' : 'INVALID_CODE',
      };
    }

    // 6. Minimum Spend Check
    const totalEligibleSpendInCents = eligibleItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPriceInCents,
      0
    );

    if (totalEligibleSpendInCents < promotion.minSpendInCents) {
      const minRs = (promotion.minSpendInCents / 100).toFixed(2);
      return {
        isValid: false,
        totalDiscountInCents: 0,
        sellerAllocations: [],
        rejectionReason: `Minimum spend of Rs. ${minRs} on eligible items is required to use this coupon`,
        rejectionCode: 'MIN_SPEND_NOT_MET',
      };
    }

    // 7. Calculate Authoritative Total Discount
    let totalDiscountInCents = 0;
    if (promotion.discountType === 'PERCENTAGE') {
      // Deterministic round-half-up integer minor unit calculation
      totalDiscountInCents = Math.floor(
        (totalEligibleSpendInCents * promotion.discountValue + 5000) / 10000
      );
      if (promotion.maxDiscountInCents) {
        totalDiscountInCents = Math.min(totalDiscountInCents, promotion.maxDiscountInCents);
      }
    } else {
      // FIXED_AMOUNT (discountValue in cents)
      totalDiscountInCents = Math.min(promotion.discountValue, totalEligibleSpendInCents);
    }

    // 8. Deterministic Pro-Rata Allocation Across Eligible Items & Sellers
    const sellerAllocMap = new Map<
      string,
      {
        sellerDiscountInCents: number;
        platformDiscountInCents: number;
        allocatedItems: Array<{ productId: string; sellerId: string; discountInCents: number }>;
      }
    >();

    let allocatedDiscountSum = 0;

    for (let i = 0; i < eligibleItems.length; i++) {
      const item = eligibleItems[i];
      const itemSpend = item.quantity * item.unitPriceInCents;

      // Item proportional discount
      let itemDiscount: number;
      if (i === eligibleItems.length - 1) {
        // Last item absorbs any rounding remainder
        itemDiscount = totalDiscountInCents - allocatedDiscountSum;
      } else {
        itemDiscount = Math.floor((itemSpend / totalEligibleSpendInCents) * totalDiscountInCents);
        allocatedDiscountSum += itemDiscount;
      }

      const existingSeller = sellerAllocMap.get(item.sellerId) || {
        sellerDiscountInCents: 0,
        platformDiscountInCents: 0,
        allocatedItems: [],
      };

      existingSeller.allocatedItems.push({
        productId: item.productId,
        sellerId: item.sellerId,
        discountInCents: itemDiscount,
      });

      if (promotion.fundingSource === 'SELLER_FUNDED') {
        existingSeller.sellerDiscountInCents += itemDiscount;
      } else {
        existingSeller.platformDiscountInCents += itemDiscount;
      }

      sellerAllocMap.set(item.sellerId, existingSeller);
    }

    const sellerAllocations: PromotionSellerDiscountAllocationDTO[] = [];
    for (const [sellerId, data] of sellerAllocMap.entries()) {
      sellerAllocations.push({
        sellerId,
        sellerDiscountInCents: data.sellerDiscountInCents,
        platformDiscountInCents: data.platformDiscountInCents,
        allocatedItems: data.allocatedItems,
      });
    }

    return {
      isValid: true,
      promotionId: promotion._id.toString(),
      code: promotion.code,
      fundingSource: promotion.fundingSource,
      totalDiscountInCents,
      sellerAllocations,
    };
  }

  /**
   * Commits redemption of a promotional coupon upon confirmed order creation.
   */
  public async commitPromotionRedemption(
    promotionId: string,
    customerId: string,
    orderId: string,
    suborderId: string,
    discountAmountInCents: number,
    fundingSource: PromotionFundingSource
  ): Promise<void> {
    const promoObjId = new mongoose.Types.ObjectId(promotionId);

    // Atomically increment usage
    await Promotion.findByIdAndUpdate(promoObjId, {
      $inc: { currentUsageCount: 1 },
    });

    await PromotionRedemption.create({
      promotionId: promoObjId,
      customerId: new mongoose.Types.ObjectId(customerId),
      orderId: new mongoose.Types.ObjectId(orderId),
      suborderId: new mongoose.Types.ObjectId(suborderId),
      discountAmountInCents,
      fundingSource,
      redeemedAt: new Date(),
    });
  }
}

export const promotionService = new PromotionService();
