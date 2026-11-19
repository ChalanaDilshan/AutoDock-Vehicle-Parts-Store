export interface PromotionValidationItemInput {
  productId: string;
  sellerId: string;
  categoryId: string;
  quantity: number;
  unitPriceInCents: number;
}

export interface PromotionQuoteInputDTO {
  promoCode: string;
  customerId: string;
  items: PromotionValidationItemInput[];
}

export interface PromotionDiscountAllocationItemDTO {
  productId: string;
  sellerId: string;
  discountInCents: number;
}

export interface PromotionSellerDiscountAllocationDTO {
  sellerId: string;
  sellerDiscountInCents: number;
  platformDiscountInCents: number;
  allocatedItems: PromotionDiscountAllocationItemDTO[];
}

export interface PromotionValidationResultDTO {
  isValid: boolean;
  promotionId?: string;
  code?: string;
  fundingSource?: 'SELLER_FUNDED' | 'AUTODOCK_FUNDED';
  totalDiscountInCents: number;
  sellerAllocations: PromotionSellerDiscountAllocationDTO[];
  rejectionReason?: string;
  rejectionCode?: 'INVALID_CODE' | 'EXPIRED' | 'MIN_SPEND_NOT_MET' | 'USAGE_LIMIT_EXCEEDED' | 'SELLER_MISMATCH';
}

export interface IPromotionPublicContract {
  validateAndQuotePromotion(input: PromotionQuoteInputDTO): Promise<PromotionValidationResultDTO>;
  commitPromotionRedemption(
    promotionId: string,
    customerId: string,
    orderId: string,
    suborderId: string,
    discountAmountInCents: number,
    fundingSource: 'SELLER_FUNDED' | 'AUTODOCK_FUNDED'
  ): Promise<void>;
}

import { promotionService } from '../services/promotion.service.js';

export class PromotionPublicService implements IPromotionPublicContract {
  public async validateAndQuotePromotion(
    input: PromotionQuoteInputDTO
  ): Promise<PromotionValidationResultDTO> {
    return promotionService.validateAndQuotePromotion(input);
  }

  public async commitPromotionRedemption(
    promotionId: string,
    customerId: string,
    orderId: string,
    suborderId: string,
    discountAmountInCents: number,
    fundingSource: 'SELLER_FUNDED' | 'AUTODOCK_FUNDED'
  ): Promise<void> {
    return promotionService.commitPromotionRedemption(
      promotionId,
      customerId,
      orderId,
      suborderId,
      discountAmountInCents,
      fundingSource
    );
  }
}

export const promotionPublicService = new PromotionPublicService();
