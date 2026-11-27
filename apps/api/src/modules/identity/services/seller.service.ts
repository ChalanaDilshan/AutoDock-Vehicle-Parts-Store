import { SellerProfile, ISellerProfile } from '../models/sellerProfile.model.js';
import { SellerDocument, ISellerDocument } from '../models/sellerDocument.model.js';
import { SellerBankDetails, ISellerBankDetails } from '../models/sellerBankDetails.model.js';
import { PrivacyAcknowledgement } from '../models/privacyAcknowledgement.model.js';
import { User } from '../models/user.model.js';
import {
  CreateSellerProfileInput,
  UploadDocumentInput,
  SubmitBankDetailsInput,
  AcknowledgePrivacyInput,
} from '../validators/seller.validator.js';
import { storageService } from './storage.service.js';
import { CURRENT_PRIVACY_NOTICE_VERSION } from '../../../shared/constants.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

export class SellerService {
  public async registerSellerProfile(
    userId: string,
    input: CreateSellerProfileInput
  ): Promise<ISellerProfile> {
    const existingForUser = await SellerProfile.findOne({ userId });
    if (existingForUser) {
      throw new AppError('A seller profile is already registered for this user', 409, 'SELLER_ALREADY_EXISTS');
    }

    const existingSlug = await SellerProfile.findOne({ storeSlug: input.storeSlug.toLowerCase() });
    if (existingSlug) {
      throw new AppError('This store slug is already claimed by another vendor', 409, 'SLUG_IN_USE');
    }

    const profile = await SellerProfile.create({
      userId,
      businessName: input.businessName,
      storeSlug: input.storeSlug.toLowerCase(),
      sellerType: input.sellerType,
      businessRegistrationNumber: input.businessRegistrationNumber,
      operatingAddress: input.operatingAddress,
      contactPhone: input.contactPhone,
      verificationStatus: 'DRAFT',
      isEligibleToSell: false,
    });

    // Update user role to SELLER and link sellerId
    await User.findByIdAndUpdate(userId, {
      sellerId: profile._id,
      role: 'SELLER',
    });

    return profile;
  }

  public async getSellerProfile(userId: string): Promise<{
    profile: ISellerProfile;
    documentsCount: number;
    bankVerificationStatus: string;
    privacyAcknowledged: boolean;
  }> {
    const profile = await SellerProfile.findOne({ userId });
    if (!profile) {
      throw new AppError('Seller profile not found for this user', 404, 'NOT_FOUND');
    }

    const documentsCount = await SellerDocument.countDocuments({ sellerId: profile._id });
    const bankDetails = await SellerBankDetails.findOne({ sellerId: profile._id });
    const privacyAck = await PrivacyAcknowledgement.findOne({ sellerId: profile._id });

    return {
      profile,
      documentsCount,
      bankVerificationStatus: bankDetails ? bankDetails.verificationStatus : 'UNSUBMITTED',
      privacyAcknowledged: Boolean(privacyAck),
    };
  }

  public async uploadDocument(
    userId: string,
    input: UploadDocumentInput
  ): Promise<ISellerDocument> {
    const profile = await SellerProfile.findOne({ userId });
    if (!profile) {
      throw new AppError('Seller profile not found', 404, 'NOT_FOUND');
    }

    // Critical business rule: Store photos are strictly forbidden for ONLINE_ONLY sellers
    if (profile.sellerType === 'ONLINE_ONLY' && input.documentType === 'STORE_PHOTO') {
      throw new AppError(
        'Storefront photographs are not permitted for online-only sellers',
        400,
        'INVALID_DOCUMENT_TYPE'
      );
    }

    // Prepare buffer
    if (!input.fileContentBase64 || input.fileContentBase64.trim() === '') {
      throw new AppError('File content is required', 400, 'MISSING_FILE_CONTENT');
    }
    const buffer = Buffer.from(input.fileContentBase64, 'base64');

    const s3StorageKey = await storageService.uploadPrivateFile(
      profile._id.toString(),
      input.documentType,
      input.fileName,
      input.mimeType,
      buffer
    );

    const doc = await SellerDocument.create({
      sellerId: profile._id,
      documentType: input.documentType,
      s3StorageKey,
      fileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      reviewStatus: 'PENDING',
    });

    return doc;
  }

  public async getSellerDocuments(userId: string): Promise<ISellerDocument[]> {
    const profile = await SellerProfile.findOne({ userId });
    if (!profile) {
      throw new AppError('Seller profile not found', 404, 'NOT_FOUND');
    }

    return SellerDocument.find({ sellerId: profile._id }).select('-s3StorageKey');
  }

  public async submitBankDetails(
    userId: string,
    input: SubmitBankDetailsInput
  ): Promise<ISellerBankDetails> {
    const profile = await SellerProfile.findOne({ userId });
    if (!profile) {
      throw new AppError('Seller profile not found', 404, 'NOT_FOUND');
    }

    // Mask account number: e.g. ******8471
    const rawNumber = input.accountNumber.trim();
    const last4 = rawNumber.slice(-4);
    const maskedAccountNumber = `******${last4}`;

    let bankDetails = await SellerBankDetails.findOne({ sellerId: profile._id });
    if (bankDetails) {
      bankDetails.bankName = input.bankName;
      bankDetails.accountHolderName = input.accountHolderName;
      bankDetails.accountNumber = rawNumber;
      bankDetails.maskedAccountNumber = maskedAccountNumber;
      bankDetails.branchName = input.branchName;
      bankDetails.branchCode = input.branchCode || null;
      bankDetails.verificationStatus = 'PENDING';
      bankDetails.rejectionReason = null;
      await bankDetails.save();
    } else {
      bankDetails = await SellerBankDetails.create({
        sellerId: profile._id,
        bankName: input.bankName,
        accountHolderName: input.accountHolderName,
        accountNumber: rawNumber,
        maskedAccountNumber,
        branchName: input.branchName,
        branchCode: input.branchCode || null,
        verificationStatus: 'PENDING',
      });
    }

    return bankDetails;
  }

  public async acknowledgePrivacyNotice(
    userId: string,
    input: AcknowledgePrivacyInput,
    ipAddress: string,
    userAgent?: string
  ): Promise<{ noticeVersion: string; acknowledgedAt: Date }> {
    const profile = await SellerProfile.findOne({ userId });
    if (!profile) {
      throw new AppError('Seller profile not found', 404, 'NOT_FOUND');
    }

    if (input.noticeVersion !== CURRENT_PRIVACY_NOTICE_VERSION) {
      throw new AppError(
        `Invalid privacy notice version. Expected ${CURRENT_PRIVACY_NOTICE_VERSION}`,
        400,
        'INVALID_NOTICE_VERSION'
      );
    }

    const ack = await PrivacyAcknowledgement.create({
      sellerId: profile._id,
      userId,
      noticeVersion: input.noticeVersion,
      acknowledged: true,
      ipAddress,
      userAgent: userAgent || null,
      acknowledgedAt: new Date(),
    });

    return {
      noticeVersion: ack.noticeVersion,
      acknowledgedAt: ack.acknowledgedAt,
    };
  }

  public async submitApplicationForReview(userId: string): Promise<ISellerProfile> {
    const profile = await SellerProfile.findOne({ userId });
    if (!profile) {
      throw new AppError('Seller profile not found', 404, 'NOT_FOUND');
    }

    const submittableStatuses = ['DRAFT', 'ADDITIONAL_INFO_REQUIRED'];
    if (!submittableStatuses.includes(profile.verificationStatus)) {
      if (profile.verificationStatus === 'APPROVED') {
        throw new AppError('Your seller application is already approved', 400, 'ALREADY_APPROVED');
      }
      throw new AppError(
        `Cannot submit application in status: ${profile.verificationStatus}`,
        400,
        'INVALID_STATUS'
      );
    }

    // 1. Validate mandatory documents
    const documents = await SellerDocument.find({ sellerId: profile._id });
    const docTypes = new Set(documents.map((d) => d.documentType));

    if (!docTypes.has('BUSINESS_REGISTRATION')) {
      throw new AppError('Business registration certificate is required for submission', 400, 'MISSING_DOCUMENT');
    }
    if (!docTypes.has('SELLER_ID_CARD')) {
      throw new AppError('Seller ID card image is required for submission', 400, 'MISSING_DOCUMENT');
    }
    if (!docTypes.has('SELLER_FACE_PHOTO')) {
      throw new AppError('Seller face photo is required for submission', 400, 'MISSING_DOCUMENT');
    }
    if (profile.sellerType === 'PHYSICAL_STORE' && !docTypes.has('STORE_PHOTO')) {
      throw new AppError('Physical store photographs are required for physical store sellers', 400, 'MISSING_DOCUMENT');
    }

    // 2. Validate mandatory bank details
    const bankDetails = await SellerBankDetails.findOne({ sellerId: profile._id });
    if (!bankDetails) {
      throw new AppError('Bank account details are required before submission', 400, 'MISSING_BANK_DETAILS');
    }

    // 3. Validate mandatory privacy notice acknowledgement
    const privacyAck = await PrivacyAcknowledgement.findOne({ sellerId: profile._id });
    if (!privacyAck) {
      throw new AppError('You must read and acknowledge the Seller Privacy Notice before submission', 400, 'PRIVACY_NOT_ACKNOWLEDGED');
    }

    // Update status to PENDING
    profile.verificationStatus = 'PENDING';
    profile.isEligibleToSell = false;
    await profile.save();

    return profile;
  }
}

export const sellerService = new SellerService();
