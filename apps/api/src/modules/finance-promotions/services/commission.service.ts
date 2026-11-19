import crypto from 'crypto';
import mongoose from 'mongoose';
import { CommissionRateConfig, ICommissionRateConfig } from '../models/commissionRate.model.js';
import { SellerCommissionExemption, ISellerCommissionExemption } from '../models/commissionExemption.model.js';
import { CommissionLedger, ICommissionLedger } from '../models/commissionLedger.model.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import { logger } from '../../../shared/utils/logger.js';

export interface AccrueCommissionInput {
  suborderId: string;
  orderId: string;
  sellerId: string;
  productSubtotalInCents: number;
  sellerDiscountInCents: number;
  platformDiscountInCents: number;
  deliveryFeeInCents: number;
  commissionableBaseInCents?: number;
  completionTimestamp?: Date;
  completionEventId?: string;
}

export class CommissionService {
  /**
   * Deterministic round-half-up integer calculation:
   * (baseInCents * basisPoints + 5000) / 10000
   */
  public calculateCommission(baseInCents: number, basisPoints: number): number {
    if (baseInCents <= 0 || basisPoints <= 0) {
      return 0;
    }
    return Math.floor((baseInCents * basisPoints + 5000) / 10000);
  }

  /**
   * Resolves the active platform commission rate effective at the target timestamp.
   */
  public async getEffectiveCommissionRate(targetDate: Date = new Date()): Promise<ICommissionRateConfig> {
    const config = await CommissionRateConfig.findOne({
      status: 'ACTIVE',
      effectiveFrom: { $lte: targetDate },
    }).sort({ effectiveFrom: -1 });

    if (config) {
      return config;
    }

    // Fallback: Check if any active config exists regardless of effectiveFrom
    const anyActive = await CommissionRateConfig.findOne({ status: 'ACTIVE' }).sort({ effectiveFrom: -1 });
    if (anyActive) {
      return anyActive;
    }

    // Baseline fallback if database unseeded
    logger.warn('[CommissionService] No active CommissionRateConfig found in database. Using system default 8.00%');
    return new CommissionRateConfig({
      basisPoints: 800,
      effectiveFrom: new Date(0),
      status: 'ACTIVE',
      description: 'System Seed Default Rate (8.00%)',
      configuredBy: new mongoose.Types.ObjectId(),
    });
  }

  /**
   * Administrator updates platform commission rate with effective activation date.
   */
  public async configureCommissionRate(
    input: { basisPoints: number; description: string; effectiveFrom?: string | Date },
    adminId: string
  ): Promise<ICommissionRateConfig> {
    const effectiveFrom = input.effectiveFrom ? new Date(input.effectiveFrom) : new Date();

    // Mark previous active rates as SUPERSEDED if effective immediately or earlier
    if (effectiveFrom <= new Date()) {
      await CommissionRateConfig.updateMany(
        { status: 'ACTIVE', effectiveFrom: { $lte: effectiveFrom } },
        { $set: { status: 'SUPERSEDED' } }
      );
    }

    const newConfig = await CommissionRateConfig.create({
      basisPoints: input.basisPoints,
      description: input.description,
      effectiveFrom,
      status: 'ACTIVE',
      configuredBy: new mongoose.Types.ObjectId(adminId),
    });

    logger.info(`[CommissionService] Configured new commission rate: ${newConfig.percentage}% (${newConfig.basisPoints} bps)`, {
      rateId: newConfig._id.toString(),
      configuredBy: adminId,
    });

    return newConfig;
  }

  /**
   * Retrieves commission rate history for administrative audit.
   */
  public async getCommissionRateHistory(): Promise<ICommissionRateConfig[]> {
    return CommissionRateConfig.find().sort({ effectiveFrom: -1, createdAt: -1 });
  }

  /**
   * Checks whether a seller has an active exemption at the target timestamp.
   */
  public async isSellerExempt(
    sellerId: string,
    targetDate: Date = new Date()
  ): Promise<{ isExempt: boolean; exemptionRecord?: ISellerCommissionExemption }> {
    const exemption = await SellerCommissionExemption.findOne({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      status: 'ACTIVE',
      activatedAt: { $lte: targetDate },
    });

    return {
      isExempt: !!exemption,
      exemptionRecord: exemption || undefined,
    };
  }

  /**
   * Administrator grants commission exemption to a seller.
   */
  public async grantSellerExemption(
    sellerId: string,
    reason: string,
    adminId: string
  ): Promise<ISellerCommissionExemption> {
    // Revoke any previous active exemption before creating a new one
    await SellerCommissionExemption.updateMany(
      { sellerId: new mongoose.Types.ObjectId(sellerId), status: 'ACTIVE' },
      { $set: { status: 'REVOKED', revokedAt: new Date(), revocationReason: 'Superseded by new exemption grant' } }
    );

    const exemption = await SellerCommissionExemption.create({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      status: 'ACTIVE',
      reason,
      activatedBy: new mongoose.Types.ObjectId(adminId),
      activatedAt: new Date(),
    });

    logger.info(`[CommissionService] Granted seller commission exemption to seller ${sellerId}`, {
      exemptionId: exemption._id.toString(),
      adminId,
    });

    return exemption;
  }

  /**
   * Administrator revokes seller commission exemption.
   */
  public async revokeSellerExemption(
    sellerId: string,
    reason: string,
    adminId: string
  ): Promise<ISellerCommissionExemption> {
    const exemption = await SellerCommissionExemption.findOne({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      status: 'ACTIVE',
    });

    if (!exemption) {
      throw new AppError('No active commission exemption found for this seller', 404, 'EXEMPTION_NOT_FOUND');
    }

    exemption.status = 'REVOKED';
    exemption.revokedAt = new Date();
    exemption.revokedBy = new mongoose.Types.ObjectId(adminId);
    exemption.revocationReason = reason;
    await exemption.save();

    logger.info(`[CommissionService] Revoked seller commission exemption for seller ${sellerId}`, {
      exemptionId: exemption._id.toString(),
      adminId,
    });

    return exemption;
  }

  /**
   * Lists seller commission exemptions with pagination and status filter.
   */
  public async getSellerExemptions(query: { sellerId?: string; status?: string; page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: Record<string, any> = {};

    if (query.sellerId) filter.sellerId = new mongoose.Types.ObjectId(query.sellerId);
    if (query.status) filter.status = query.status;

    const [exemptions, total] = await Promise.all([
      SellerCommissionExemption.find(filter)
        .populate('activatedBy', 'firstName lastName email')
        .sort({ activatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SellerCommissionExemption.countDocuments(filter),
    ]);

    return {
      exemptions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Authoritative entry point for commission accrual from a completed seller suborder.
   * STRICT INVARIANT: Idempotent. Replayed events return the existing ledger record.
   */
  public async accrueCommissionForSuborder(input: AccrueCommissionInput): Promise<ICommissionLedger> {
    const suborderObjectId = new mongoose.Types.ObjectId(input.suborderId);

    // 1. Idempotency Check: Return existing record if already accrued
    const existing = await CommissionLedger.findOne({ suborderId: suborderObjectId });
    if (existing) {
      logger.info(`[CommissionService] Idempotency match: Suborder ${input.suborderId} already accrued in ledger ${existing.ledgerReference}`);
      return existing;
    }

    const completionTimestamp = input.completionTimestamp || new Date();
    const completionEventId =
      input.completionEventId || `EVT-${input.suborderId}-${completionTimestamp.getTime()}`;

    // 2. Authoritative Commissionable Base Calculation:
    // Base = Product Subtotal - Seller-Funded Discount (Delivery fee and Platform discounts strictly ignored)
    const commissionableBaseInCents = Math.max(
      0,
      input.productSubtotalInCents - input.sellerDiscountInCents
    );

    // 3. Exemption & Rate Evaluation
    const { isExempt, exemptionRecord } = await this.isSellerExempt(input.sellerId, completionTimestamp);

    let commissionAmountInCents = 0;
    let basisPoints = 0;
    let rateConfigId: mongoose.Types.ObjectId | undefined;

    if (isExempt) {
      basisPoints = 0;
      commissionAmountInCents = 0;
    } else {
      const activeRate = await this.getEffectiveCommissionRate(completionTimestamp);
      basisPoints = activeRate.basisPoints;
      rateConfigId = activeRate._id;
      commissionAmountInCents = this.calculateCommission(commissionableBaseInCents, basisPoints);
    }

    // 4. Generate Ledger Reference: LED-YYYYMMDD-HEX6
    const dateStr = completionTimestamp.toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const ledgerReference = `LED-${dateStr}-${randomHex}`;

    // 5. Atomic Insertion with duplicate protection catch
    try {
      const ledgerEntry = await CommissionLedger.create({
        ledgerReference,
        sellerId: new mongoose.Types.ObjectId(input.sellerId),
        orderId: new mongoose.Types.ObjectId(input.orderId),
        suborderId: suborderObjectId,
        completionEventId,
        completionTimestamp,
        productSubtotalInCents: input.productSubtotalInCents,
        sellerDiscountInCents: input.sellerDiscountInCents,
        platformDiscountInCents: input.platformDiscountInCents,
        deliveryFeeInCents: input.deliveryFeeInCents,
        commissionableBaseInCents,
        appliedRateSnapshot: {
          rateConfigId,
          basisPoints,
          isExempt,
          exemptionId: exemptionRecord?._id,
        },
        commissionAmountInCents,
        currency: 'LKR',
        calculationVersion: 1,
        status: 'ACCRUED',
      });

      logger.info(`[CommissionService] Accrued commission for suborder ${input.suborderId}: Rs. ${(commissionAmountInCents / 100).toFixed(2)}`, {
        ledgerId: ledgerEntry._id.toString(),
        ledgerReference,
        commissionableBaseInCents,
        commissionAmountInCents,
        isExempt,
      });

      return ledgerEntry;
    } catch (err: any) {
      if (err.code === 11000) {
        // Race condition duplicate insert: return existing record
        const fallback = await CommissionLedger.findOne({ suborderId: suborderObjectId });
        if (fallback) return fallback;
      }
      throw err;
    }
  }

  /**
   * Search and audit commission ledger entries with pagination and summary metrics.
   */
  public async getCommissionLedgerEntries(query: {
    sellerId?: string;
    orderId?: string;
    suborderId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: Record<string, any> = {};

    if (query.sellerId) filter.sellerId = new mongoose.Types.ObjectId(query.sellerId);
    if (query.orderId) filter.orderId = new mongoose.Types.ObjectId(query.orderId);
    if (query.suborderId) filter.suborderId = new mongoose.Types.ObjectId(query.suborderId);
    if (query.status) filter.status = query.status;

    if (query.startDate || query.endDate) {
      filter.completionTimestamp = {};
      if (query.startDate) filter.completionTimestamp.$gte = new Date(query.startDate);
      if (query.endDate) filter.completionTimestamp.$lte = new Date(query.endDate);
    }

    const [entries, total, aggregation] = await Promise.all([
      CommissionLedger.find(filter)
        .sort({ completionTimestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      CommissionLedger.countDocuments(filter),
      CommissionLedger.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalCommissionInCents: { $sum: '$commissionAmountInCents' },
            totalBaseInCents: { $sum: '$commissionableBaseInCents' },
          },
        },
      ]),
    ]);

    const summary = aggregation[0] || { totalCommissionInCents: 0, totalBaseInCents: 0 };

    return {
      entries,
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Real-time financial summary for a seller dashboard.
   */
  public async getSellerCommissionSummary(sellerId: string) {
    const sellerObjId = new mongoose.Types.ObjectId(sellerId);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [lifetimeAgg, currentMonthAgg, uninvoicedAgg] = await Promise.all([
      CommissionLedger.aggregate([
        { $match: { sellerId: sellerObjId } },
        { $group: { _id: null, total: { $sum: '$commissionAmountInCents' } } },
      ]),
      CommissionLedger.aggregate([
        { $match: { sellerId: sellerObjId, completionTimestamp: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$commissionAmountInCents' } } },
      ]),
      CommissionLedger.aggregate([
        { $match: { sellerId: sellerObjId, status: 'ACCRUED' } },
        { $group: { _id: null, total: { $sum: '$commissionAmountInCents' } } },
      ]),
    ]);

    return {
      lifetimeCommissionInCents: lifetimeAgg[0]?.total || 0,
      currentMonthAccruedInCents: currentMonthAgg[0]?.total || 0,
      uninvoicedAccruedInCents: uninvoicedAgg[0]?.total || 0,
    };
  }
}

export const commissionService = new CommissionService();
