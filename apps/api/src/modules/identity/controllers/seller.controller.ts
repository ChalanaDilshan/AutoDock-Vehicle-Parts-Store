import { Request, Response, NextFunction } from 'express';
import { sellerService } from '../services/seller.service.js';
import {
  CreateSellerProfileSchema,
  UploadDocumentSchema,
  SubmitBankDetailsSchema,
  AcknowledgePrivacySchema,
} from '../validators/seller.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class SellerController {
  public async registerSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateSellerProfileSchema.parse(req.body);
      const profile = await sellerService.registerSellerProfile(req.user!.userId, validated);

      sendSuccess({
        res,
        statusCode: 201,
        code: 'SELLER_PROFILE_CREATED',
        message: 'Seller profile registered. Please upload required documents and bank details.',
        data: {
          sellerId: profile._id.toString(),
          businessName: profile.businessName,
          storeSlug: profile.storeSlug,
          sellerType: profile.sellerType,
          verificationStatus: profile.verificationStatus,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getSellerMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await sellerService.getSellerProfile(req.user!.userId);

      sendSuccess({
        res,
        data: {
          sellerId: result.profile._id.toString(),
          businessName: result.profile.businessName,
          storeSlug: result.profile.storeSlug,
          sellerType: result.profile.sellerType,
          businessRegistrationNumber: result.profile.businessRegistrationNumber,
          operatingAddress: result.profile.operatingAddress,
          contactPhone: result.profile.contactPhone,
          verificationStatus: result.profile.verificationStatus,
          isEligibleToSell: result.profile.isEligibleToSell,
          documentsCount: result.documentsCount,
          bankVerificationStatus: result.bankVerificationStatus,
          privacyAcknowledged: result.privacyAcknowledged,
          rejectionReason: result.profile.rejectionReason,
          additionalInfoRequested: result.profile.additionalInfoRequested,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async uploadDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = UploadDocumentSchema.parse(req.body);
      const doc = await sellerService.uploadDocument(req.user!.userId, validated);

      sendSuccess({
        res,
        statusCode: 201,
        code: 'DOCUMENT_UPLOADED',
        message: 'Verification document uploaded successfully.',
        data: {
          documentId: doc._id.toString(),
          documentType: doc.documentType,
          fileName: doc.fileName,
          reviewStatus: doc.reviewStatus,
          createdAt: doc.createdAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getDocuments(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const documents = await sellerService.getSellerDocuments(req.user!.userId);

      sendSuccess({
        res,
        data: documents.map((doc) => ({
          documentId: doc._id.toString(),
          documentType: doc.documentType,
          fileName: doc.fileName,
          mimeType: doc.mimeType,
          fileSizeBytes: doc.fileSizeBytes,
          reviewStatus: doc.reviewStatus,
          adminReviewNotes: doc.adminReviewNotes,
          createdAt: doc.createdAt,
        })),
      });
    } catch (err) {
      next(err);
    }
  }

  public async submitBankDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = SubmitBankDetailsSchema.parse(req.body);
      const bankDetails = await sellerService.submitBankDetails(req.user!.userId, validated);

      sendSuccess({
        res,
        code: 'BANK_DETAILS_SUBMITTED',
        message: 'Bank details submitted and awaiting administrator verification.',
        data: {
          bankName: bankDetails.bankName,
          accountHolderName: bankDetails.accountHolderName,
          maskedAccountNumber: bankDetails.maskedAccountNumber,
          branchName: bankDetails.branchName,
          verificationStatus: bankDetails.verificationStatus,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async acknowledgePrivacy(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = AcknowledgePrivacySchema.parse(req.body);
      const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
      const userAgent = req.headers['user-agent'];

      const result = await sellerService.acknowledgePrivacyNotice(
        req.user!.userId,
        validated,
        ip,
        userAgent
      );

      sendSuccess({
        res,
        code: 'PRIVACY_ACKNOWLEDGED',
        message: 'Privacy notice acknowledgement recorded.',
        data: {
          noticeVersion: result.noticeVersion,
          acknowledgedAt: result.acknowledgedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async submitApplication(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const profile = await sellerService.submitApplicationForReview(req.user!.userId);

      sendSuccess({
        res,
        code: 'SELLER_APPLICATION_SUBMITTED',
        message: 'Seller application submitted successfully and queued for review.',
        data: {
          sellerId: profile._id.toString(),
          verificationStatus: profile.verificationStatus,
          isEligibleToSell: profile.isEligibleToSell,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const sellerController = new SellerController();
