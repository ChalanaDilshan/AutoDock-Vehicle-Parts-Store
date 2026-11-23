import { Request, Response, NextFunction } from 'express';
import { deliveryRateService } from '../services/deliveryRate.service.js';
import {
  DeliveryRateProposalSchema,
  AdminProposalDecisionSchema,
} from '../validators/deliveryRate.validator.js';
import { resolveSellerId } from './sellerOrder.controller.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class DeliveryRateController {
  // --- Seller Operations ---
  public async submitProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = resolveSellerId(req);
      const validated = DeliveryRateProposalSchema.parse(req.body);
      const proposal = await deliveryRateService.proposeRates(sellerId, validated);

      sendSuccess({
        res,
        statusCode: 201,
        code: 'PROPOSAL_SUBMITTED',
        message: 'Delivery rate proposal submitted and awaiting admin approval',
        data: proposal,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getSellerDeliveryRates(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = resolveSellerId(req);
      const result = await deliveryRateService.getSellerRates(sellerId);

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  // --- Admin Operations ---
  public async getPendingProposals(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const proposals = await deliveryRateService.getPendingProposals();

      sendSuccess({
        res,
        data: proposals,
      });
    } catch (err) {
      next(err);
    }
  }

  public async reviewProposal(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = AdminProposalDecisionSchema.parse(req.body);
      const updated = await deliveryRateService.adminDecision(
        req.user!.userId,
        req.params.proposalId,
        validated
      );

      sendSuccess({
        res,
        code: 'PROPOSAL_REVIEWED',
        message: `Delivery rate proposal has been ${updated.status.toLowerCase()}`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const deliveryRateController = new DeliveryRateController();
