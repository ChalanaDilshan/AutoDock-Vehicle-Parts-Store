import { Request, Response, NextFunction } from 'express';
import { adminVerificationService } from '../services/adminVerification.service.js';
import {
  ReviewSellerSchema,
  VerifyBankDetailsSchema,
} from '../validators/seller.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class AdminSellerController {
  public async listSellers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, sellerType, page, limit } = req.query;

      const result = await adminVerificationService.listSellerApplications({
        status: status as string | undefined,
        sellerType: sellerType as string | undefined,
        page: page ? parseInt(page as string, 10) : 1,
        limit: limit ? parseInt(limit as string, 10) : 20,
      });

      sendSuccess({
        res,
        data: result.sellers.map((s) => ({
          sellerId: s._id.toString(),
          businessName: s.businessName,
          storeSlug: s.storeSlug,
          sellerType: s.sellerType,
          verificationStatus: s.verificationStatus,
          isEligibleToSell: s.isEligibleToSell,
          operatingAddress: s.operatingAddress,
          contactPhone: s.contactPhone,
          createdAt: s.createdAt,
          user: s.userId,
        })),
        meta: {
          pagination: result.pagination,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getSellerDetail(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const dossier = await adminVerificationService.getSellerApplicationDetail(id);

      sendSuccess({
        res,
        data: {
          sellerId: dossier.profile._id.toString(),
          businessName: dossier.profile.businessName,
          storeSlug: dossier.profile.storeSlug,
          sellerType: dossier.profile.sellerType,
          businessRegistrationNumber: dossier.profile.businessRegistrationNumber,
          operatingAddress: dossier.profile.operatingAddress,
          contactPhone: dossier.profile.contactPhone,
          verificationStatus: dossier.profile.verificationStatus,
          isEligibleToSell: dossier.profile.isEligibleToSell,
          rejectionReason: dossier.profile.rejectionReason,
          additionalInfoRequested: dossier.profile.additionalInfoRequested,
          verificationHistory: dossier.profile.verification_history,
          user: dossier.profile.userId,
          documents: dossier.documents.map((d) => ({
            documentId: d._id.toString(),
            documentType: d.documentType,
            fileName: d.fileName,
            mimeType: d.mimeType,
            fileSizeBytes: d.fileSizeBytes,
            reviewStatus: d.reviewStatus,
            adminReviewNotes: d.adminReviewNotes,
            createdAt: d.createdAt,
          })),
          bankDetails: dossier.bankDetails
            ? {
                bankName: dossier.bankDetails.bankName,
                accountHolderName: dossier.bankDetails.accountHolderName,
                maskedAccountNumber: dossier.bankDetails.maskedAccountNumber,
                branchName: dossier.bankDetails.branchName,
                branchCode: dossier.bankDetails.branchCode,
                verificationStatus: dossier.bankDetails.verificationStatus,
                verifiedAt: dossier.bankDetails.verifiedAt,
                rejectionReason: dossier.bankDetails.rejectionReason,
              }
            : null,
          hasPrivacyAcknowledgement: Boolean(dossier.privacyAcknowledgement),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async reviewSeller(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = ReviewSellerSchema.parse(req.body);
      const profile = await adminVerificationService.reviewSellerApplication(
        req.user!.userId,
        id,
        validated
      );

      sendSuccess({
        res,
        code: 'SELLER_REVIEWED',
        message: `Seller application review recorded: ${validated.decision}`,
        data: {
          sellerId: profile._id.toString(),
          verificationStatus: profile.verificationStatus,
          isEligibleToSell: profile.isEligibleToSell,
          rejectionReason: profile.rejectionReason,
          additionalInfoRequested: profile.additionalInfoRequested,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async verifyBankDetails(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = VerifyBankDetailsSchema.parse(req.body);
      const bankDetails = await adminVerificationService.verifySellerBankDetails(
        req.user!.userId,
        id,
        validated
      );

      sendSuccess({
        res,
        code: 'BANK_DETAILS_VERIFIED',
        message: `Seller bank details decision recorded: ${validated.decision}`,
        data: {
          sellerId: bankDetails.sellerId.toString(),
          verificationStatus: bankDetails.verificationStatus,
          rejectionReason: bankDetails.rejectionReason,
          verifiedAt: bankDetails.verifiedAt,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getDocumentViewUrl(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id, docId } = req.params;
      const result = await adminVerificationService.generateDocumentViewUrl(
        req.user!.userId,
        id,
        docId
      );

      sendSuccess({
        res,
        code: 'DOCUMENT_VIEW_URL_GENERATED',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminSellerController = new AdminSellerController();
