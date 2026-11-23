import crypto from 'crypto';
import mongoose from 'mongoose';
import { PlatformSubsidyLedger, IPlatformSubsidyLedger } from '../models/platformSubsidyLedger.model.js';
import { logger } from '../../../shared/utils/logger.js';

export interface AccrueSubsidyInput {
  sellerId: string;
  orderId: string;
  suborderId: string;
  promotionId: string;
  promotionCode: string;
  eligibleProductAmountInCents: number;
  subsidyAmountInCents: number;
}

export class SubsidyService {
  /**
   * Idempotently records an AutoDock platform promotional subsidy obligation for a completed suborder.
   */
  public async accruePlatformSubsidy(input: AccrueSubsidyInput): Promise<IPlatformSubsidyLedger> {
    const suborderObjId = new mongoose.Types.ObjectId(input.suborderId);

    // 1. Idempotency Check
    const existing = await PlatformSubsidyLedger.findOne({ suborderId: suborderObjId });
    if (existing) {
      logger.info(`[SubsidyService] Idempotency match: Suborder ${input.suborderId} subsidy already recorded in ledger ${existing.subsidyReference}`);
      return existing;
    }

    // 2. Generate Reference: SUB-YYYYMMDD-HEX6
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    const subsidyReference = `SUB-${dateStr}-${randomHex}`;

    try {
      const record = await PlatformSubsidyLedger.create({
        subsidyReference,
        sellerId: new mongoose.Types.ObjectId(input.sellerId),
        orderId: new mongoose.Types.ObjectId(input.orderId),
        suborderId: suborderObjId,
        promotionId: new mongoose.Types.ObjectId(input.promotionId),
        promotionCode: input.promotionCode.toUpperCase(),
        eligibleProductAmountInCents: input.eligibleProductAmountInCents,
        subsidyAmountInCents: input.subsidyAmountInCents,
        currency: 'LKR',
        accrualTimestamp: new Date(),
        status: 'ACCRUED',
      });

      logger.info(`[SubsidyService] Accrued platform subsidy of Rs. ${(input.subsidyAmountInCents / 100).toFixed(2)} for seller ${input.sellerId}`, {
        subsidyReference,
        suborderId: input.suborderId,
      });

      return record;
    } catch (err: any) {
      if (err.code === 11000) {
        const fallback = await PlatformSubsidyLedger.findOne({ suborderId: suborderObjId });
        if (fallback) return fallback;
      }
      throw err;
    }
  }

  /**
   * Seller views own subsidy ledger records and totals.
   */
  public async getSellerSubsidies(
    sellerId: string,
    query: { status?: string; page?: number; limit?: number }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: Record<string, any> = { sellerId: new mongoose.Types.ObjectId(sellerId) };

    if (query.status) filter.status = query.status;

    const [subsidies, total, accruedAgg, settledAgg] = await Promise.all([
      PlatformSubsidyLedger.find(filter)
        .sort({ accrualTimestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PlatformSubsidyLedger.countDocuments(filter),
      PlatformSubsidyLedger.aggregate([
        { $match: { sellerId: new mongoose.Types.ObjectId(sellerId), status: 'ACCRUED' } },
        { $group: { _id: null, total: { $sum: '$subsidyAmountInCents' } } },
      ]),
      PlatformSubsidyLedger.aggregate([
        { $match: { sellerId: new mongoose.Types.ObjectId(sellerId), status: 'SETTLED' } },
        { $group: { _id: null, total: { $sum: '$subsidyAmountInCents' } } },
      ]),
    ]);

    return {
      subsidies,
      totalAccruedInCents: accruedAgg[0]?.total || 0,
      totalSettledInCents: settledAgg[0]?.total || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin audits marketplace promotional subsidies across all sellers.
   */
  public async getAdminSubsidies(query: {
    sellerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 50;
    const filter: Record<string, any> = {};

    if (query.sellerId) filter.sellerId = new mongoose.Types.ObjectId(query.sellerId);
    if (query.status) filter.status = query.status;

    const [subsidies, total, outstandingAgg] = await Promise.all([
      PlatformSubsidyLedger.find(filter)
        .populate('sellerId', 'storeName businessName contactPhone')
        .sort({ accrualTimestamp: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      PlatformSubsidyLedger.countDocuments(filter),
      PlatformSubsidyLedger.aggregate([
        { $match: { status: 'ACCRUED' } },
        { $group: { _id: null, total: { $sum: '$subsidyAmountInCents' } } },
      ]),
    ]);

    return {
      subsidies,
      totalOutstandingInCents: outstandingAgg[0]?.total || 0,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export const subsidyService = new SubsidyService();
