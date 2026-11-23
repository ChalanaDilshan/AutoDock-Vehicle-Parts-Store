import mongoose from 'mongoose';
import { Suborder, ISuborder } from '../models/suborder.model.js';
import { PaymentSlip, IPaymentSlip } from '../models/paymentSlip.model.js';
import { receiptStorageService, PresignedReceiptViewUrl } from './receiptStorage.service.js';
import { identityPublicService } from '../../identity/contracts/identity.contract.js';
import { productPublicService } from '../../customer-experience/contracts/product.contract.js';
import { orderService } from './order.service.js';
import { VerifyReceiptInput } from '../validators/payment.validator.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import { logger } from '../../../shared/utils/logger.js';

export interface BankTransferInstructionsDTO {
  suborderId: string;
  suborderNumber: string;
  sellerBusinessName: string;
  amountDueInCents: number;
  currency: string;
  bankDetails: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    branchName: string;
    branchCode?: string | null;
  };
  depositReference: string;
  instructionNotes: string;
}

export class PaymentService {
  /**
   * Retrieves verified seller bank account deposit instructions for direct bank transfer.
   * CRITICAL INVARIANT: Returns 403 Forbidden if the seller's bank details are unverified by an administrator!
   */
  public async getBankTransferInstructions(
    customerId: string,
    suborderId: string
  ): Promise<BankTransferInstructionsDTO> {
    const suborder = await Suborder.findById(suborderId);
    if (!suborder) {
      throw new AppError('Suborder not found', 404, 'SUBORDER_NOT_FOUND');
    }

    if (suborder.customerId.toString() !== customerId) {
      throw new AppError('You do not have permission to view instructions for this suborder', 403, 'FORBIDDEN');
    }

    if (suborder.paymentMethod !== 'BANK_TRANSFER') {
      throw new AppError(
        'Direct bank deposit instructions are only available for bank transfer suborders',
        400,
        'INVALID_PAYMENT_METHOD'
      );
    }

    const verifiedBank = await identityPublicService.getVerifiedSellerBankDetails(suborder.sellerId.toString());
    if (!verifiedBank) {
      throw new AppError(
        'Seller bank details are not verified by an administrator; direct deposit instructions are unavailable',
        403,
        'UNVERIFIED_SELLER_BANK'
      );
    }

    return {
      suborderId: suborder._id.toString(),
      suborderNumber: suborder.suborderNumber,
      sellerBusinessName: suborder.sellerBusinessName,
      amountDueInCents: suborder.totalPayableInCents,
      currency: 'LKR',
      bankDetails: {
        bankName: verifiedBank.bankName,
        accountHolderName: verifiedBank.accountHolderName,
        accountNumber: verifiedBank.accountNumber,
        branchName: verifiedBank.branchName,
        branchCode: verifiedBank.branchCode,
      },
      depositReference: suborder.suborderNumber,
      instructionNotes:
        'Please transfer the exact amount and quote your Suborder Number as the transaction reference. Upload your payment slip once the transfer is completed.',
    };
  }

  /**
   * Customer uploads bank deposit slip image or PDF for their suborder.
   */
  public async uploadBankTransferReceipt(
    customerId: string,
    suborderId: string,
    fileData: {
      originalName: string;
      mimeType: string;
      size: number;
      buffer: Buffer;
      depositedAmountInCents?: number;
      referenceNumber?: string;
    }
  ): Promise<IPaymentSlip> {
    const suborder = await Suborder.findById(suborderId);
    if (!suborder) {
      throw new AppError('Suborder not found', 404, 'SUBORDER_NOT_FOUND');
    }

    if (suborder.customerId.toString() !== customerId) {
      throw new AppError('You do not have permission to upload receipts for this suborder', 403, 'FORBIDDEN');
    }

    if (suborder.paymentMethod !== 'BANK_TRANSFER') {
      throw new AppError('Payment receipts can only be submitted for bank transfer suborders', 400, 'INVALID_PAYMENT_METHOD');
    }

    if (suborder.paymentStatus === 'PAID') {
      throw new AppError('Suborder has already been marked as paid', 400, 'ALREADY_PAID');
    }

    if (suborder.rejectionCount >= 3) {
      throw new AppError(
        'Maximum payment slip resubmission attempts (3) exceeded for this suborder',
        422,
        'MAX_REJECTIONS_EXCEEDED'
      );
    }

    // Validate MIME types and file size (<= 5MB)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimeTypes.includes(fileData.mimeType)) {
      throw new AppError(
        'Invalid file type. Allowed formats: JPEG, PNG, WebP, PDF',
        400,
        'INVALID_FILE_TYPE'
      );
    }

    const maxSizeBytes = 5 * 1024 * 1024; // 5 MB
    if (fileData.size > maxSizeBytes) {
      throw new AppError('File size exceeds the 5MB maximum limit', 400, 'FILE_TOO_LARGE');
    }

    // Save in private isolated storage
    const storageKey = await receiptStorageService.saveReceiptFile(
      suborderId,
      fileData.originalName,
      fileData.mimeType,
      fileData.buffer
    );

    const depositedAmount = fileData.depositedAmountInCents || suborder.totalPayableInCents;

    const slip = await PaymentSlip.create({
      suborderId: suborder._id,
      orderId: suborder.orderId,
      customerId: suborder.customerId,
      sellerId: suborder.sellerId,
      storageKey,
      originalFileName: fileData.originalName,
      mimeType: fileData.mimeType,
      fileSizeBytes: fileData.size,
      depositedAmountInCents: depositedAmount,
      referenceNumber: fileData.referenceNumber,
      verificationStatus: 'PENDING_VERIFICATION',
    });

    suborder.paymentStatus = 'PAYMENT_PENDING_VERIFICATION';
    suborder.statusHistory.push({
      fromFulfillmentStatus: suborder.fulfillmentStatus,
      toFulfillmentStatus: suborder.fulfillmentStatus,
      paymentStatus: 'PAYMENT_PENDING_VERIFICATION',
      actorRole: 'CUSTOMER',
      actorId: customerId,
      notes: `Bank deposit slip uploaded (${fileData.originalName})`,
      timestamp: new Date(),
    });

    await suborder.save();

    logger.info(`[PaymentService] Customer uploaded slip for suborder ${suborder.suborderNumber}`, {
      slipId: slip._id.toString(),
      depositedAmountInCents: depositedAmount,
    });

    return slip;
  }

  /**
   * Seller: Get latest slip with presigned view URL for own suborder.
   */
  public async getReceiptForSeller(
    sellerId: string,
    suborderId: string
  ): Promise<{ slip: IPaymentSlip; viewUrl: PresignedReceiptViewUrl }> {
    const suborder = await Suborder.findById(suborderId);
    if (!suborder) {
      throw new AppError('Suborder not found', 404, 'SUBORDER_NOT_FOUND');
    }

    if (suborder.sellerId.toString() !== sellerId) {
      throw new AppError('You do not have permission to view receipts for this suborder', 403, 'FORBIDDEN');
    }

    const slip = await PaymentSlip.findOne({ suborderId: suborder._id }).sort({ createdAt: -1 });
    if (!slip) {
      throw new AppError('No payment slip uploaded for this suborder', 404, 'RECEIPT_NOT_FOUND');
    }

    const viewUrl = await receiptStorageService.generatePresignedViewUrl(slip.storageKey);

    return { slip, viewUrl };
  }

  /**
   * Seller: Approve or reject bank deposit slip for own suborder.
   */
  public async verifyReceipt(
    sellerId: string,
    suborderId: string,
    input: VerifyReceiptInput
  ): Promise<{ suborder: ISuborder; slip: IPaymentSlip }> {
    const suborder = await Suborder.findById(suborderId);
    if (!suborder) {
      throw new AppError('Suborder not found', 404, 'SUBORDER_NOT_FOUND');
    }

    if (suborder.sellerId.toString() !== sellerId) {
      throw new AppError('You do not have permission to verify receipts for this suborder', 403, 'FORBIDDEN');
    }

    const slip = await PaymentSlip.findOne({
      suborderId: suborder._id,
      verificationStatus: 'PENDING_VERIFICATION',
    }).sort({ createdAt: -1 });

    if (!slip) {
      throw new AppError(
        'No pending payment receipt awaiting review for this suborder',
        400,
        'NO_PENDING_RECEIPT'
      );
    }

    if (input.action === 'APPROVE') {
      slip.verificationStatus = 'APPROVED';
      slip.verifiedBy = new mongoose.Types.ObjectId(sellerId);
      slip.verifiedAt = new Date();
      await slip.save();

      suborder.paymentStatus = 'PAID';
      suborder.paidAt = new Date();
      suborder.fulfillmentStatus = 'PROCESSING';
      suborder.statusHistory.push({
        fromFulfillmentStatus: 'AWAITING_FULFILLMENT',
        toFulfillmentStatus: 'PROCESSING',
        paymentStatus: 'PAID',
        actorRole: 'SELLER',
        actorId: sellerId,
        notes: 'Bank deposit receipt verified and approved by seller',
        timestamp: new Date(),
      });
      await suborder.save();

      await orderService.recalculateMasterOrderStatus(suborder.orderId);

      logger.info(`[PaymentService] Seller approved slip for suborder ${suborder.suborderNumber}`, {
        slipId: slip._id.toString(),
      });
    } else {
      // REJECT
      slip.verificationStatus = 'REJECTED';
      slip.rejectionReason = input.rejectionReason;
      slip.verifiedBy = new mongoose.Types.ObjectId(sellerId);
      slip.verifiedAt = new Date();
      await slip.save();

      suborder.paymentStatus = 'PAYMENT_REJECTED';
      suborder.rejectionCount += 1;

      // If reached maximum 3 rejections, auto-cancel suborder and release stock
      if (suborder.rejectionCount >= 3) {
        suborder.fulfillmentStatus = 'CANCELLED';
        suborder.cancelledAt = new Date();
        suborder.cancellationReason = `Auto-cancelled: 3 deposit slips rejected (${input.rejectionReason})`;
        const releaseItems = suborder.items.map((it) => ({
          productId: it.productId.toString(),
          quantity: it.quantity,
        }));
        await productPublicService.releaseStock(releaseItems);
      }

      suborder.statusHistory.push({
        fromFulfillmentStatus: suborder.fulfillmentStatus,
        toFulfillmentStatus: suborder.fulfillmentStatus,
        paymentStatus: 'PAYMENT_REJECTED',
        actorRole: 'SELLER',
        actorId: sellerId,
        notes: `Bank deposit slip rejected: ${input.rejectionReason}`,
        timestamp: new Date(),
      });
      await suborder.save();

      await orderService.recalculateMasterOrderStatus(suborder.orderId);

      logger.info(`[PaymentService] Seller rejected slip for suborder ${suborder.suborderNumber}`, {
        slipId: slip._id.toString(),
        rejectionReason: input.rejectionReason,
      });
    }

    return { suborder, slip };
  }
}

export const paymentService = new PaymentService();
