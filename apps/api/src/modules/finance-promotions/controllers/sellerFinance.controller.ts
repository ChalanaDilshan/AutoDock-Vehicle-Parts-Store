import { Request, Response, NextFunction } from 'express';
import { commissionService } from '../services/commission.service.js';
import { invoiceService } from '../services/invoice.service.js';
import { paymentVerificationService } from '../services/paymentVerification.service.js';
import { subsidyService } from '../services/subsidy.service.js';
import { SellerInvoice } from '../models/sellerInvoice.model.js';
import { PlatformSubsidyLedger } from '../models/platformSubsidyLedger.model.js';
import { InvoiceQuerySchema, UploadInvoiceReceiptSchema } from '../validators/invoice.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import mongoose from 'mongoose';

export class SellerFinanceController {
  private getSellerId(req: Request): string {
    const sellerId = req.user?.sellerId;
    if (!sellerId) {
      throw new AppError('Seller profile context is required for this operation', 403, 'SELLER_CONTEXT_REQUIRED');
    }
    return sellerId;
  }

  public async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const sellerObjId = new mongoose.Types.ObjectId(sellerId);

      const [commSummary, invoiceAgg, subsidyAgg] = await Promise.all([
        commissionService.getSellerCommissionSummary(sellerId),
        SellerInvoice.aggregate([
          { $match: { sellerId: sellerObjId, status: { $in: ['ISSUED', 'PAYMENT_PENDING_VERIFICATION', 'PARTIALLY_PAID', 'OVERDUE'] } } },
          { $group: { _id: null, totalOutstanding: { $sum: '$outstandingBalanceInCents' } } },
        ]),
        PlatformSubsidyLedger.aggregate([
          { $match: { sellerId: sellerObjId, status: 'ACCRUED' } },
          { $group: { _id: null, totalSubsidy: { $sum: '$subsidyAmountInCents' } } },
        ]),
      ]);

      sendSuccess({
        res,
        data: {
          lifetimeCommissionInCents: commSummary.lifetimeCommissionInCents,
          currentMonthAccruedInCents: commSummary.currentMonthAccruedInCents,
          uninvoicedAccruedInCents: commSummary.uninvoicedAccruedInCents,
          outstandingInvoiceBalanceInCents: invoiceAgg[0]?.totalOutstanding || 0,
          totalSubsidyAccruedInCents: subsidyAgg[0]?.totalSubsidy || 0,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const validated = InvoiceQuerySchema.parse(req.query);
      const result = await invoiceService.getSellerInvoices(sellerId, validated);

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getInvoiceById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const result = await invoiceService.getSellerInvoiceById(req.params.id, sellerId);

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async uploadReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const validated = UploadInvoiceReceiptSchema.parse(req.body);
      const result = await paymentVerificationService.submitInvoiceReceipt(
        req.params.id,
        sellerId,
        validated
      );

      sendSuccess({
        res,
        statusCode: 201,
        code: 'RECEIPT_UPLOADED',
        message: 'Bank transfer receipt uploaded successfully. Pending administrator verification.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getReceipts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const receipts = await paymentVerificationService.getInvoiceReceipts(req.params.id, {
        role: 'SELLER',
        sellerId,
      });

      sendSuccess({
        res,
        data: { receipts },
      });
    } catch (err) {
      next(err);
    }
  }

  public async streamReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const { buffer, mimeType, originalFileName } = await paymentVerificationService.streamReceiptFile(
        req.params.receiptId,
        { role: 'SELLER', sellerId }
      );

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(originalFileName)}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  public async getSubsidies(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sellerId = this.getSellerId(req);
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as string | undefined;

      const result = await subsidyService.getSellerSubsidies(sellerId, { page, limit, status });

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

export const sellerFinanceController = new SellerFinanceController();
