import { SellerProfile } from '../models/sellerProfile.model.js';
import { SellerBankDetails } from '../models/sellerBankDetails.model.js';
import { User } from '../models/user.model.js';

export interface SellerSellingEligibilityDTO {
  sellerId: string;
  isEligible: boolean;
  storeSlug: string;
  sellerType: 'PHYSICAL_STORE' | 'ONLINE_ONLY';
  rejectionOrSuspensionReason?: string | null;
}

export interface SellerPublicProfileDTO {
  sellerId: string;
  businessName: string;
  storeSlug: string;
  sellerType: 'PHYSICAL_STORE' | 'ONLINE_ONLY';
  operatingCity: string;
  operatingDistrict: string;
  memberSince: Date;
  isVerified: boolean;
  storeLogoUrl?: string | null;
}

export interface VerifiedSellerBankDetailsDTO {
  sellerId: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branchName: string;
  branchCode?: string | null;
  isVerified: true;
}

export interface SellerBillingIdentityDTO {
  sellerId: string;
  userId: string;
  businessName: string;
  businessRegistrationNumber: string;
  billingEmail: string;
  contactPhone: string;
  operatingAddress: {
    street: string;
    city: string;
    district: string;
    province: string;
    postalCode: string;
  };
}

/**
 * Authoritative Public Service Interface for Cross-Module Integration.
 * Modules MOD-02, MOD-03, MOD-04 consume this service rather than querying MOD-01 models directly.
 */
export class IdentityModulePublicService {
  /**
   * Used by MOD-02 before allowing products to be created, listed, or published.
   */
  public async isSellerEligibleToSell(sellerId: string): Promise<SellerSellingEligibilityDTO> {
    const profile = await SellerProfile.findById(sellerId);
    if (!profile) {
      return {
        sellerId,
        isEligible: false,
        storeSlug: '',
        sellerType: 'PHYSICAL_STORE',
        rejectionOrSuspensionReason: 'Seller profile does not exist',
      };
    }

    const isEligible =
      profile.verificationStatus === 'APPROVED' && profile.isEligibleToSell === true;

    return {
      sellerId: profile._id.toString(),
      isEligible,
      storeSlug: profile.storeSlug,
      sellerType: profile.sellerType,
      rejectionOrSuspensionReason: profile.rejectionReason,
    };
  }

  /**
   * Used by MOD-02 to render public seller storefront details safely without exposing documents or bank info.
   */
  public async getSellerPublicProfile(sellerId: string): Promise<SellerPublicProfileDTO | null> {
    const profile = await SellerProfile.findById(sellerId);
    if (!profile) return null;

    return {
      sellerId: profile._id.toString(),
      businessName: profile.businessName,
      storeSlug: profile.storeSlug,
      sellerType: profile.sellerType,
      operatingCity: profile.operatingAddress.city,
      operatingDistrict: profile.operatingAddress.district,
      memberSince: profile.createdAt,
      isVerified: profile.verificationStatus === 'APPROVED',
      storeLogoUrl: profile.storeLogoUrl,
    };
  }

  /**
   * Used by MOD-03 during checkout to generate direct bank-transfer deposit instructions.
   * CRITICAL INVARIANT: Returns null if the bank details are NOT verified by an administrator!
   */
  public async getVerifiedSellerBankDetails(
    sellerId: string
  ): Promise<VerifiedSellerBankDetailsDTO | null> {
    const bankDetails = await SellerBankDetails.findOne({
      sellerId,
      verificationStatus: 'VERIFIED',
    }).select('+accountNumber');

    if (!bankDetails) {
      return null;
    }

    return {
      sellerId: bankDetails.sellerId.toString(),
      bankName: bankDetails.bankName,
      accountHolderName: bankDetails.accountHolderName,
      accountNumber: bankDetails.accountNumber,
      branchName: bankDetails.branchName,
      branchCode: bankDetails.branchCode,
      isVerified: true,
    };
  }

  /**
   * Used by MOD-03 to verify seller active status during checkout order processing.
   */
  public async isSellerActiveForOrder(sellerId: string): Promise<boolean> {
    const profile = await SellerProfile.findById(sellerId);
    if (!profile) return false;
    return profile.verificationStatus === 'APPROVED' && profile.isEligibleToSell === true;
  }

  /**
   * Used by MOD-04 to generate official legal monthly commission invoices.
   */
  public async getSellerBillingIdentity(
    sellerId: string
  ): Promise<SellerBillingIdentityDTO | null> {
    const profile = await SellerProfile.findById(sellerId);
    if (!profile) return null;

    const user = await User.findById(profile.userId);
    if (!user) return null;

    return {
      sellerId: profile._id.toString(),
      userId: user._id.toString(),
      businessName: profile.businessName,
      businessRegistrationNumber: profile.businessRegistrationNumber,
      billingEmail: user.email,
      contactPhone: profile.contactPhone,
      operatingAddress: {
        street: profile.operatingAddress.street,
        city: profile.operatingAddress.city,
        district: profile.operatingAddress.district,
        province: profile.operatingAddress.province,
        postalCode: profile.operatingAddress.postalCode,
      },
    };
  }
}

export const identityPublicService = new IdentityModulePublicService();
