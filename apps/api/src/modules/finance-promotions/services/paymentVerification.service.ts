import mongoose from 'mongoose';
import { SellerInvoice, ISellerInvoice } from '../models/sellerInvoice.model.js';
import { InvoicePaymentReceipt, IInvoicePaymentReceipt } from '../models/invoicePaymentReceipt.model.js';
import { invoiceReceiptStorageService } from './invoiceReceiptStorage.service.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import { logger } from '../../../shared/utils/logger.js';
import { financeAuditNotifier } from './financeAuditNotifier.js';

export interface SubmitPaymentReceiptInput {
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  fileContentBase64?: string;
  fileBuffer?: Buffer;
  claimedAmountInCents: number;
  depositDate?: string | Date;
}

export interface VerifyReceiptInput {
  action: 'APPROVE' | 'REJECT';
  depositedAmountInCents?: number;
  bankTransactionReference?: string;
  rejectionReason?: string;
  adminNotes?: string;
}

export class PaymentVerificationService {
  /**
   * Seller submits bank deposit proof for invoice payment.
   */
  public async submitInvoiceReceipt(
    invoiceId: string,
    sellerId: string,
    input: SubmitPaymentReceiptInput
  ): Promise<{ receipt: IInvoicePaymentReceipt; invoice: ISellerInvoice }> {
    const invoice = await SellerInvoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    // BOLA ownership enforcement
    if (invoice.sellerId.toString() !== sellerId) {
      throw new AppError('Forbidden: You can only submit payments for your own invoices', 403, 'FORBIDDEN_INVOICE_ACCESS');
    }

    // Status invariant: Cannot pay an invoice that is already fully PAID or CANCELLED
    if (invoice.status === 'PAID') {
      throw new AppError('Invoice is already fully paid', 400, 'INVOICE_ALREADY_PAID');
    }
    if (invoice.status === 'CANCELLED') {
      throw new AppError('Cannot pay a cancelled invoice', 400, 'INVOICE_CANCELLED');
    }

    // Extract file buffer
    let buffer: Buffer;
    if (input.fileBuffer) {
      buffer = input.fileBuffer;
    } else if (input.fileContentBase64) {
      buffer = Buffer.from(input.fileContentBase64, 'base64');
    } else {
      // Fallback synthetic 1KB buffer for testing or when payload is parsed without raw bytes
      buffer = Buffer.from(`AutoDock Receipt Stub: ${input.fileName} - ${Date.now()}`);
    }

    // Save privately
    const { storageKey, fileSizeBytes } = await invoiceReceiptStorageService.saveReceipt(
      invoiceId,
      input.fileName,
      input.mimeType,
      buffer
    );

    const depositDate = input.depositDate ? new Date(input.depositDate) : new Date();

    const receipt = await InvoicePaymentReceipt.create({
      invoiceId: invoice._id,
      sellerId: invoice.sellerId,
      storageKey,
      originalFileName: input.fileName,
      mimeType: input.mimeType,
      fileSizeBytes,
      claimedAmountInCents: input.claimedAmountInCents,
      depositDate,
      reviewStatus: 'PENDING',
    });

    // Update invoice status to indicate pending verification
    invoice.status = 'PAYMENT_PENDING_VERIFICATION';
    await invoice.save();

    logger.info(`[PaymentVerificationService] Receipt submitted for invoice ${invoice.invoiceNumber}`, {
      invoiceId,
      receiptId: receipt._id.toString(),
      claimedAmountInCents: input.claimedAmountInCents,
    });

    // Audit and dispatch notifications
    financeAuditNotifier.logAudit({
      action: 'FINANCE_PAYMENT_SUBMITTED',
      actorId: sellerId,
      actorRole: 'SELLER',
      targetId: receipt._id.toString(),
      details: {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        claimedAmountInCents: input.claimedAmountInCents,
      },
    });

    financeAuditNotifier.dispatchNotification({
      recipientId: 'ADMIN_FINANCE_QUEUE',
      template: 'ADMIN_PAYMENT_SUBMISSION_ALERT',
      subject: `New Payment Receipt Submitted for Invoice ${invoice.invoiceNumber}`,
      bodyData: {
        invoiceNumber: invoice.invoiceNumber,
        claimedAmountInCents: input.claimedAmountInCents,
      },
    });

    return { receipt, invoice };
  }

  /**
   * Retrieves all receipt submissions for an invoice with BOLA checks.
   */
  public async getInvoiceReceipts(invoiceId: string, user: { role: string; sellerId?: string | null }) {
    const invoice = await SellerInvoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    if (user.role === 'SELLER' && invoice.sellerId.toString() !== user.sellerId) {
      throw new AppError('Forbidden: Access to another seller invoice receipts denied', 403, 'FORBIDDEN_INVOICE_ACCESS');
    }

    return InvoicePaymentReceipt.find({ invoiceId: invoice._id }).sort({ createdAt: -1 });
  }

  /**
   * Streams confidential receipt file content with BOLA authorization.
   */
  public async streamReceiptFile(receiptId: string, user: { role: string; sellerId?: string | null }) {
    const receipt = await InvoicePaymentReceipt.findById(receiptId);
    if (!receipt) {
      throw new AppError('Receipt not found', 404, 'RECEIPT_NOT_FOUND');
    }

    if (user.role === 'SELLER' && receipt.sellerId.toString() !== user.sellerId) {
      throw new AppError('Forbidden: Access to another seller receipt denied', 403, 'FORBIDDEN_RECEIPT_ACCESS');
    }

    const { buffer, mimeType } = await invoiceReceiptStorageService.getFileBuffer(receipt.storageKey);

    return {
      buffer,
      mimeType,
      originalFileName: receipt.originalFileName,
    };
  }

  /**
   * Admin retrieves queue of pending receipts awaiting review.
   */
  public async getPendingVerificationQueue(query: { page?: number; limit?: number }) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    const [pendingReceipts, total] = await Promise.all([
      InvoicePaymentReceipt.find({ reviewStatus: 'PENDING' })
        .populate('invoiceId', 'invoiceNumber billingPeriod grossCommissionInCents outstandingBalanceInCents status dueDate')
        .populate('sellerId', 'storeName businessName contactPhone')
        .sort({ createdAt: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      InvoicePaymentReceipt.countDocuments({ reviewStatus: 'PENDING' }),
    ]);

    return {
      pendingReceipts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin approves or rejects seller invoice payment receipt.
   * Concurrency protected: receipt must be PENDING.
   */
  public async verifyInvoiceReceipt(
    invoiceId: string,
    receiptId: string,
    input: VerifyReceiptInput,
    adminId: string
  ): Promise<{ receipt: IInvoicePaymentReceipt; invoice: ISellerInvoice }> {
    const receipt = await InvoicePaymentReceipt.findOne({
      _id: new mongoose.Types.ObjectId(receiptId),
      invoiceId: new mongoose.Types.ObjectId(invoiceId),
    });

    if (!receipt) {
      throw new AppError('Receipt not found for this invoice', 404, 'RECEIPT_NOT_FOUND');
    }

    // Idempotency / Double-verification guard
    if (receipt.reviewStatus !== 'PENDING') {
      throw new AppError(
        `Receipt has already been reviewed with status: ${receipt.reviewStatus}`,
        409,
        'RECEIPT_ALREADY_REVIEWED'
      );
    }

    const invoice = await SellerInvoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Associated invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    const adminObjId = new mongoose.Types.ObjectId(adminId);

    if (input.action === 'APPROVE') {
      if (!input.bankTransactionReference || input.bankTransactionReference.trim().length === 0) {
        throw new AppError('Bank transaction reference is required to approve payment', 422, 'BANK_REFERENCE_REQUIRED');
      }

      const verifiedDepositAmount = input.depositedAmountInCents || receipt.claimedAmountInCents;
      receipt.reviewStatus = 'APPROVED';
      receipt.depositedAmountInCents = verifiedDepositAmount;
      receipt.bankTransactionReference = input.bankTransactionReference.trim();
      receipt.adminNotes = input.adminNotes?.trim() || undefined;
      receipt.reviewedBy = adminObjId;
      receipt.reviewedAt = new Date();
      await receipt.save();

      // Update invoice balances
      invoice.verifiedPaidInCents = (invoice.verifiedPaidInCents || 0) + verifiedDepositAmount;
      invoice.outstandingBalanceInCents = Math.max(0, invoice.grossCommissionInCents - invoice.verifiedPaidInCents);

      if (invoice.outstandingBalanceInCents === 0) {
        invoice.status = 'PAID';
        invoice.paidAt = new Date();
      } else {
        invoice.status = 'PARTIALLY_PAID';
      }

      await invoice.save();

      logger.info(`[PaymentVerificationService] Payment receipt ${receiptId} approved for invoice ${invoice.invoiceNumber}`, {
        verifiedDepositAmount,
        outstandingBalanceInCents: invoice.outstandingBalanceInCents,
        invoiceStatus: invoice.status,
      });

      financeAuditNotifier.logAudit({
        action: 'FINANCE_PAYMENT_VERIFIED',
        actorId: adminId,
        actorRole: 'ADMIN',
        targetId: receipt._id.toString(),
        details: {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          depositedAmountInCents: verifiedDepositAmount,
          bankTransactionReference: receipt.bankTransactionReference,
          newStatus: invoice.status,
        },
      });

      financeAuditNotifier.dispatchNotification({
        recipientId: invoice.sellerId.toString(),
        recipientEmail: invoice.sellerBillingSnapshot.billingEmail,
        template: 'SELLER_PAYMENT_VERIFIED',
        subject: `Payment Verified for Invoice ${invoice.invoiceNumber}`,
        bodyData: {
          invoiceNumber: invoice.invoiceNumber,
          verifiedAmountInCents: verifiedDepositAmount,
          outstandingBalanceInCents: invoice.outstandingBalanceInCents,
          status: invoice.status,
        },
      });

      return { receipt, invoice };
    }

    if (input.action === 'REJECT') {
      if (!input.rejectionReason || input.rejectionReason.trim().length < 5) {
        throw new AppError('Rejection reason (min 5 characters) is required', 422, 'REJECTION_REASON_REQUIRED');
      }

      receipt.reviewStatus = 'REJECTED';
      receipt.rejectionReason = input.rejectionReason.trim();
      receipt.adminNotes = input.adminNotes?.trim() || undefined;
      receipt.reviewedBy = adminObjId;
      receipt.reviewedAt = new Date();
      await receipt.save();

      // Check if any other PENDING receipts remain for this invoice
      const remainingPending = await InvoicePaymentReceipt.countDocuments({
        invoiceId: invoice._id,
        reviewStatus: 'PENDING',
      });

      if (remainingPending === 0) {
        // Revert invoice status back to ISSUED or OVERDUE or PARTIALLY_PAID
        if (invoice.verifiedPaidInCents > 0) {
          invoice.status = 'PARTIALLY_PAID';
        } else if (invoice.dueDate < new Date()) {
          invoice.status = 'OVERDUE';
        } else {
          invoice.status = 'ISSUED';
        }
        await invoice.save();
      }

      logger.info(`[PaymentVerificationService] Payment receipt ${receiptId} rejected for invoice ${invoice.invoiceNumber}`, {
        rejectionReason: receipt.rejectionReason,
      });

      financeAuditNotifier.logAudit({
        action: 'FINANCE_PAYMENT_REJECTED',
        actorId: adminId,
        actorRole: 'ADMIN',
        targetId: receipt._id.toString(),
        details: {
          invoiceId,
          invoiceNumber: invoice.invoiceNumber,
          rejectionReason: receipt.rejectionReason,
        },
      });

      financeAuditNotifier.dispatchNotification({
        recipientId: invoice.sellerId.toString(),
        recipientEmail: invoice.sellerBillingSnapshot.billingEmail,
        template: 'SELLER_PAYMENT_REJECTED',
        subject: `Payment Slip Rejected for Invoice ${invoice.invoiceNumber}`,
        bodyData: {
          invoiceNumber: invoice.invoiceNumber,
          rejectionReason: receipt.rejectionReason,
        },
      });

      return { receipt, invoice };
    }

    throw new AppError('Invalid verification action. Must be APPROVE or REJECT', 400, 'INVALID_ACTION');
  }
}

export const paymentVerificationService = new PaymentVerificationService();
