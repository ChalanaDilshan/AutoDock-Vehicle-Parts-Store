import { commissionService } from '../services/commission.service.js';
import { subsidyService } from '../services/subsidy.service.js';

export interface SuborderCompletedFinancialEventDTO {
  suborderId: string;
  orderId: string;
  sellerId: string;
  productSubtotalInCents: number;
  sellerDiscountInCents: number;
  platformDiscountInCents: number;
  deliveryFeeInCents: number;
  totalPayableInCents?: number;
  commissionableBaseInCents?: number;
  completionTimestamp?: Date;
  completionEventId?: string;
  promotionId?: string;
  promotionCode?: string;
}

export interface IFinancePublicContract {
  accrueSuborderCommissionAndSubsidy(event: SuborderCompletedFinancialEventDTO): Promise<{
    commissionLedgerId: string;
    commissionAmountInCents: number;
    subsidyLedgerId?: string;
    subsidyAmountInCents?: number;
  }>;
}

export class FinancePublicService implements IFinancePublicContract {
  public async accrueSuborderCommissionAndSubsidy(event: SuborderCompletedFinancialEventDTO): Promise<{
    commissionLedgerId: string;
    commissionAmountInCents: number;
    subsidyLedgerId?: string;
    subsidyAmountInCents?: number;
  }> {
    // 1. Accrue Commission into immutable ledger (Strictly Idempotent)
    const ledger = await commissionService.accrueCommissionForSuborder({
      suborderId: event.suborderId,
      orderId: event.orderId,
      sellerId: event.sellerId,
      productSubtotalInCents: event.productSubtotalInCents,
      sellerDiscountInCents: event.sellerDiscountInCents,
      platformDiscountInCents: event.platformDiscountInCents,
      deliveryFeeInCents: event.deliveryFeeInCents,
      completionTimestamp: event.completionTimestamp,
      completionEventId: event.completionEventId,
    });

    let subsidyLedgerId: string | undefined;
    let subsidyAmountInCents: number | undefined;

    // 2. Accrue AutoDock Platform Subsidy if platform promotion discount was applied
    if (event.platformDiscountInCents > 0) {
      const subsidy = await subsidyService.accruePlatformSubsidy({
        sellerId: event.sellerId,
        orderId: event.orderId,
        suborderId: event.suborderId,
        promotionId: event.promotionId || '000000000000000000000000',
        promotionCode: event.promotionCode || 'PLATFORM_DISCOUNT',
        eligibleProductAmountInCents: event.productSubtotalInCents,
        subsidyAmountInCents: event.platformDiscountInCents,
      });

      subsidyLedgerId = subsidy._id.toString();
      subsidyAmountInCents = subsidy.subsidyAmountInCents;
    }

    return {
      commissionLedgerId: ledger._id.toString(),
      commissionAmountInCents: ledger.commissionAmountInCents,
      subsidyLedgerId,
      subsidyAmountInCents,
    };
  }
}

export const financePublicService = new FinancePublicService();
