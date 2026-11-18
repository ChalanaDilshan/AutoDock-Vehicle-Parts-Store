import mongoose from 'mongoose';
import { DeliveryRateProposal, IDeliveryRateProposal } from '../models/deliveryRateProposal.model.js';
import { DeliveryZoneRate, IDeliveryZoneRate } from '../models/deliveryZone.model.js';
import {
  DeliveryRateProposalInput,
  AdminProposalDecisionInput,
} from '../validators/deliveryRate.validator.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import { logger } from '../../../shared/utils/logger.js';

export class DeliveryRateService {
  /**
   * Seller creates a proposal for district delivery rates. Status initializes as PENDING_APPROVAL.
   */
  public async proposeRates(
    sellerId: string,
    input: DeliveryRateProposalInput
  ): Promise<IDeliveryRateProposal> {
    const proposal = await DeliveryRateProposal.create({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      rates: input.rates,
      status: 'PENDING_APPROVAL',
    });

    logger.info(`[DeliveryRateService] Seller ${sellerId} submitted delivery rate proposal`, {
      proposalId: proposal._id.toString(),
      districtCount: input.rates.length,
    });

    return proposal;
  }

  /**
   * Get active approved rates and pending/historical proposals for an authenticated seller.
   */
  public async getSellerRates(sellerId: string): Promise<{
    activeRates: IDeliveryZoneRate[];
    proposals: IDeliveryRateProposal[];
  }> {
    const sellerObjId = new mongoose.Types.ObjectId(sellerId);
    const [activeRates, proposals] = await Promise.all([
      DeliveryZoneRate.find({ sellerId: sellerObjId, status: 'ACTIVE' }).sort({ district: 1 }),
      DeliveryRateProposal.find({ sellerId: sellerObjId }).sort({ createdAt: -1 }),
    ]);

    return { activeRates, proposals };
  }

  /**
   * Admin lists all proposals awaiting approval.
   */
  public async getPendingProposals(): Promise<IDeliveryRateProposal[]> {
    return DeliveryRateProposal.find({ status: 'PENDING_APPROVAL' })
      .populate('sellerId', 'businessName storeSlug operatingAddress')
      .sort({ createdAt: 1 });
  }

  /**
   * Admin approves or rejects a delivery rate proposal.
   */
  public async adminDecision(
    adminUserId: string,
    proposalId: string,
    input: AdminProposalDecisionInput
  ): Promise<IDeliveryRateProposal> {
    const proposal = await DeliveryRateProposal.findById(proposalId);
    if (!proposal) {
      throw new AppError('Delivery rate proposal not found', 404, 'PROPOSAL_NOT_FOUND');
    }

    if (proposal.status !== 'PENDING_APPROVAL') {
      throw new AppError(
        `Cannot review proposal with current status '${proposal.status}'`,
        400,
        'INVALID_PROPOSAL_STATUS'
      );
    }

    if (input.decision === 'REJECT') {
      proposal.status = 'REJECTED';
      proposal.rejectionReason = input.rejectionReason;
      proposal.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
      proposal.reviewedAt = new Date();
      await proposal.save();

      logger.info(`[DeliveryRateService] Admin ${adminUserId} rejected proposal ${proposalId}`, {
        rejectionReason: input.rejectionReason,
      });

      return proposal;
    }

    // If APPROVE: supersede old rates and activate proposed rates
    for (const rate of proposal.rates) {
      await DeliveryZoneRate.updateMany(
        {
          sellerId: proposal.sellerId,
          district: new RegExp(`^${rate.district}$`, 'i'),
          status: 'ACTIVE',
        },
        { $set: { status: 'SUPERSEDED' } }
      );

      await DeliveryZoneRate.create({
        sellerId: proposal.sellerId,
        district: rate.district,
        feeInCents: rate.feeInCents,
        estimatedDaysMin: rate.estimatedDaysMin,
        estimatedDaysMax: rate.estimatedDaysMax,
        proposalId: proposal._id,
        status: 'ACTIVE',
      });
    }

    proposal.status = 'APPROVED';
    proposal.reviewedBy = new mongoose.Types.ObjectId(adminUserId);
    proposal.reviewedAt = new Date();
    await proposal.save();

    logger.info(`[DeliveryRateService] Admin ${adminUserId} approved proposal ${proposalId}`, {
      sellerId: proposal.sellerId.toString(),
      districtCount: proposal.rates.length,
    });

    return proposal;
  }

  /**
   * Resolves the active approved delivery rate for a specific seller and district.
   * Fails safe (returns null) if no rate exists or if rate is unapproved.
   */
  public async resolveDeliveryRate(
    sellerId: string,
    district: string
  ): Promise<IDeliveryZoneRate | null> {
    return DeliveryZoneRate.findOne({
      sellerId: new mongoose.Types.ObjectId(sellerId),
      district: new RegExp(`^${district.trim()}$`, 'i'),
      status: 'ACTIVE',
    });
  }
}

export const deliveryRateService = new DeliveryRateService();
