import mongoose from 'mongoose';
import { SellerProfile, ISellerProfile } from '../models/sellerProfile.model.js';
import { SellerDocument, ISellerDocument } from '../models/sellerDocument.model.js';
import { SellerBankDetails, ISellerBankDetails } from '../models/sellerBankDetails.model.js';
import { PrivacyAcknowledgement } from '../models/privacyAcknowledgement.model.js';
import { ReviewSellerInput, VerifyBankDetailsInput } from '../validators/seller.validator.js';
import { storageService, PresignedUrlResult } from './storage.service.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

export interface SellerListFilter {
  status?: string;
  sellerType?: string;
  page?: number;
  limit?: number;
}

export class AdminVerificationService {
  public async listSellerApplications(filter: SellerListFilter): Promise<{
    sellers: ISellerProfile[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const query: Record<string, unknown> = {};

    if (filter.status && filter.status !== 'ALL') {
      query.verificationStatus = filter.status;
    }
    if (filter.sellerType && filter.sellerType !== 'ALL') {
      query.sellerType = filter.sellerType;
    }

    const page = Math.max(1, filter.page || 1);
    const limit = Math.max(1, Math.min(100, filter.limit || 20));
    const skip = (page - 1) * limit;

    const [sellers, total] = await Promise.all([
      SellerProfile.find(query)
        .populate('userId', 'firstName lastName email phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SellerProfile.countDocuments(query),
    ]);

    return {
      sellers,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getSellerApplicationDetail(sellerId: string): Promise<{
    profile: ISellerProfile;
    documents: ISellerDocument[];
    bankDetails: ISellerBankDetails | null;
    privacyAcknowledgement: unknown | null;
  }> {
    const profile = await SellerProfile.findById(sellerId).populate(
      'userId',
      'firstName lastName email phone'
    );

    if (!profile) {
      throw new AppError('Seller application not found', 404, 'NOT_FOUND');
    }

    const [documents, bankDetails, privacyAcknowledgement] = await Promise.all([
      SellerDocument.find({ sellerId: profile._id }),
      SellerBankDetails.findOne({ sellerId: profile._id }),
      PrivacyAcknowledgement.findOne({ sellerId: profile._id }),
    ]);

    return {
      profile,
      documents,
      bankDetails,
      privacyAcknowledgement,
    };
  }

  public async reviewSellerApplication(
    adminId: string,
    sellerId: string,
    input: ReviewSellerInput
  ): Promise<ISellerProfile> {
    const profile = await SellerProfile.findById(sellerId);
    if (!profile) {
      throw new AppError('Seller application not found', 404, 'NOT_FOUND');
    }

    if (input.decision === 'APPROVE') {
      // Invariant: Physical store approvals mandate verificationMethod PHYSICAL_VISIT or WHATSAPP_VIDEO_CALL
      if (profile.sellerType === 'PHYSICAL_STORE') {
        if (!input.verificationMethod || input.verificationMethod === 'DOCUMENT_ONLY') {
          throw new AppError(
            'Physical store verification requires an on-site physical visit or WhatsApp video call log',
            400,
            'VERIFICATION_METHOD_REQUIRED'
          );
        }
      }

      profile.verificationStatus = 'APPROVED';
      profile.rejectionReason = null;
      profile.additionalInfoRequested = null;

      // Check if bank details are also verified to enable selling eligibility
      const bank = await SellerBankDetails.findOne({ sellerId: profile._id });
      if (bank && bank.verificationStatus === 'VERIFIED') {
        profile.isEligibleToSell = true;
      }
    } else if (input.decision === 'REJECT') {
      profile.verificationStatus = 'REJECTED';
      profile.rejectionReason = input.verificationNotes;
      profile.isEligibleToSell = false;
    } else if (input.decision === 'REQUEST_INFO') {
      profile.verificationStatus = 'ADDITIONAL_INFO_REQUIRED';
      profile.additionalInfoRequested = input.verificationNotes;
      profile.isEligibleToSell = false;
    }

    // Append to verification history
    profile.verification_history.push({
      reviewedByAdminId: new mongoose.Types.ObjectId(adminId),
      decision: input.decision,
      verificationMethod: input.verificationMethod,
      verificationNotes: input.verificationNotes,
      reviewedAt: new Date(),
    });

    await profile.save();
    return profile;
  }

  public async verifySellerBankDetails(
    adminId: string,
    sellerId: string,
    input: VerifyBankDetailsInput
  ): Promise<ISellerBankDetails> {
    const bankDetails = await SellerBankDetails.findOne({ sellerId });
    if (!bankDetails) {
      throw new AppError('Seller bank details not found', 404, 'NOT_FOUND');
    }

    const profile = await SellerProfile.findById(sellerId);

    if (input.decision === 'VERIFY') {
      bankDetails.verificationStatus = 'VERIFIED';
      bankDetails.verifiedByAdminId = new mongoose.Types.ObjectId(adminId);
      bankDetails.verifiedAt = new Date();
      bankDetails.rejectionReason = null;

      // If seller profile is already APPROVED, unlock selling eligibility
      if (profile && profile.verificationStatus === 'APPROVED') {
        profile.isEligibleToSell = true;
        await profile.save();
      }
    } else if (input.decision === 'REJECT') {
      bankDetails.verificationStatus = 'REJECTED';
      bankDetails.rejectionReason = input.rejectionReason || 'Bank account details rejected by administrator';

      if (profile) {
        profile.isEligibleToSell = false;
        await profile.save();
      }
    }

    await bankDetails.save();
    return bankDetails;
  }

  public async generateDocumentViewUrl(
    _adminId: string,
    sellerId: string,
    docId: string
  ): Promise<PresignedUrlResult> {
    const doc = await SellerDocument.findOne({ _id: docId, sellerId });
    if (!doc) {
      throw new AppError('Document not found for this seller application', 404, 'NOT_FOUND');
    }

    return storageService.generatePresignedViewUrl(doc.s3StorageKey, 60);
  }
}

export const adminVerificationService = new AdminVerificationService();
