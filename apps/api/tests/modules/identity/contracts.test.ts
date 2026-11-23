import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../../../src/modules/identity/models/user.model.js';
import { SellerProfile } from '../../../src/modules/identity/models/sellerProfile.model.js';
import { SellerBankDetails } from '../../../src/modules/identity/models/sellerBankDetails.model.js';
import { identityPublicService } from '../../../src/modules/identity/contracts/identity.contract.js';

describe('MOD-01 Cross-Module Public Contract Integration Tests', () => {
  const testDbUri = 'mongodb://localhost:27017/autodock_test_contracts';

  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    await mongoose.connect(testDbUri);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Promise.all([
      User.deleteMany({}),
      SellerProfile.deleteMany({}),
      SellerBankDetails.deleteMany({}),
    ]);
  });

  async function createTestSeller(
    status: 'PENDING' | 'APPROVED' | 'SUSPENDED',
    bankStatus: 'PENDING' | 'VERIFIED' | 'REJECTED'
  ) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Secret@123', salt);
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);

    const user = await User.create({
      email: `vendor.${status.toLowerCase()}.${bankStatus.toLowerCase()}.${uniqueSuffix}@example.com`,
      passwordHash,
      firstName: 'Bandara',
      lastName: 'Herath',
      phone: '+94712223344',
      role: 'SELLER',
      accountStatus: 'ACTIVE',
    });

    const isEligible = status === 'APPROVED' && bankStatus === 'VERIFIED';

    const profile = await SellerProfile.create({
      userId: user._id,
      businessName: 'Herath Automotive (Pvt) Ltd',
      storeSlug: `herath-auto-${status.toLowerCase()}-${uniqueSuffix}`,
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: `PV-${uniqueSuffix}`,
      operatingAddress: {
        street: 'Kandy Road',
        city: 'Kurunegala',
        district: 'Kurunegala',
        province: 'North Western',
        postalCode: '60000',
      },
      contactPhone: '+94372223344',
      verificationStatus: status,
      isEligibleToSell: isEligible,
    });

    user.sellerId = profile._id;
    await user.save();

    const bank = await SellerBankDetails.create({
      sellerId: profile._id,
      bankName: 'Hatton National Bank',
      accountHolderName: 'Herath Automotive (Pvt) Ltd',
      accountNumber: '00401009876543',
      maskedAccountNumber: '******6543',
      branchName: 'Kurunegala Metro',
      verificationStatus: bankStatus,
    });

    return { user, profile, bank };
  }

  it('MOD-02 Integration: isSellerEligibleToSell returns true ONLY when seller is approved and eligible', async () => {
    // 1. Pending seller
    const { profile: pendingProfile } = await createTestSeller('PENDING', 'PENDING');
    const pendingRes = await identityPublicService.isSellerEligibleToSell(pendingProfile._id.toString());
    expect(pendingRes.isEligible).toBe(false);

    // 2. Approved seller with unverified bank
    const { profile: unverifiedBankProfile } = await createTestSeller('APPROVED', 'PENDING');
    const unverifiedRes = await identityPublicService.isSellerEligibleToSell(unverifiedBankProfile._id.toString());
    expect(unverifiedRes.isEligible).toBe(false);

    // 3. Fully approved seller with verified bank
    const { profile: approvedProfile } = await createTestSeller('APPROVED', 'VERIFIED');
    const approvedRes = await identityPublicService.isSellerEligibleToSell(approvedProfile._id.toString());
    expect(approvedRes.isEligible).toBe(true);
    expect(approvedRes.storeSlug).toBe(approvedProfile.storeSlug);

    // 4. Suspended seller
    const { profile: suspendedProfile } = await createTestSeller('SUSPENDED', 'VERIFIED');
    const suspendedRes = await identityPublicService.isSellerEligibleToSell(suspendedProfile._id.toString());
    expect(suspendedRes.isEligible).toBe(false);
  });

  it('MOD-03 Integration: getVerifiedSellerBankDetails returns bank details ONLY if status is VERIFIED', async () => {
    // 1. Pending bank details -> MUST return null to prevent unverified bank transfer instructions
    const { profile: pendingProfile } = await createTestSeller('APPROVED', 'PENDING');
    const pendingBankRes = await identityPublicService.getVerifiedSellerBankDetails(pendingProfile._id.toString());
    expect(pendingBankRes).toBeNull();

    // 2. Rejected bank details -> MUST return null
    const { profile: rejectedProfile } = await createTestSeller('APPROVED', 'REJECTED');
    const rejectedBankRes = await identityPublicService.getVerifiedSellerBankDetails(rejectedProfile._id.toString());
    expect(rejectedBankRes).toBeNull();

    // 3. Verified bank details -> Returns full account information for direct bank transfer instructions
    const { profile: verifiedProfile } = await createTestSeller('APPROVED', 'VERIFIED');
    const verifiedBankRes = await identityPublicService.getVerifiedSellerBankDetails(verifiedProfile._id.toString());
    expect(verifiedBankRes).not.toBeNull();
    expect(verifiedBankRes?.bankName).toBe('Hatton National Bank');
    expect(verifiedBankRes?.accountNumber).toBe('00401009876543');
    expect(verifiedBankRes?.isVerified).toBe(true);
  });

  it('MOD-02 Integration: getSellerPublicProfile returns sanitized public storefront metadata', async () => {
    const { profile } = await createTestSeller('APPROVED', 'VERIFIED');
    const publicProfile = await identityPublicService.getSellerPublicProfile(profile._id.toString());

    expect(publicProfile).not.toBeNull();
    expect(publicProfile?.businessName).toBe('Herath Automotive (Pvt) Ltd');
    expect(publicProfile?.operatingCity).toBe('Kurunegala');
    expect(publicProfile?.operatingDistrict).toBe('Kurunegala');
    expect(publicProfile?.isVerified).toBe(true);
    // Ensure no private bank details or document references exist in DTO
    expect((publicProfile as Record<string, unknown>).accountNumber).toBeUndefined();
    expect((publicProfile as Record<string, unknown>).documents).toBeUndefined();
  });

  it('MOD-04 Integration: getSellerBillingIdentity returns legal entity name and address for invoicing', async () => {
    const { profile, user } = await createTestSeller('APPROVED', 'VERIFIED');
    const billingIdentity = await identityPublicService.getSellerBillingIdentity(profile._id.toString());

    expect(billingIdentity).not.toBeNull();
    expect(billingIdentity?.businessName).toBe('Herath Automotive (Pvt) Ltd');
    expect(billingIdentity?.businessRegistrationNumber).toBe(profile.businessRegistrationNumber);
    expect(billingIdentity?.billingEmail).toBe(user.email);
    expect(billingIdentity?.operatingAddress.district).toBe('Kurunegala');
  });
});
