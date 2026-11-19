import { Request, Response, NextFunction } from 'express';
import { commissionService } from '../services/commission.service.js';
import { invoiceService } from '../services/invoice.service.js';
import { paymentVerificationService } from '../services/paymentVerification.service.js';
import { platformFinancialSettingsService } from '../services/platformFinancialSettings.service.js';
import {
  ConfigureCommissionRateSchema,
  CreateSellerExemptionSchema,
  RevokeSellerExemptionSchema,
  CommissionLedgerQuerySchema,
} from '../validators/commission.validator.js';
import {
  GenerateInvoicesSchema,
  InvoiceQuerySchema,
  VerifyInvoiceReceiptSchema,
  PlatformBankAccountSchema,
} from '../validators/invoice.validator.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class AdminFinanceController {
  public async getCommissionRate(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const currentRate = await commissionService.getEffectiveCommissionRate();
      const history = await commissionService.getCommissionRateHistory();

      sendSuccess({
        res,
        data: {
          currentRate: {
            id: currentRate._id.toString(),
            basisPoints: currentRate.basisPoints,
            percentage: currentRate.percentage,
            effectiveFrom: currentRate.effectiveFrom,
            status: currentRate.status,
            description: currentRate.description,
          },
          history,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public async configureCommissionRate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const validated = ConfigureCommissionRateSchema.parse(req.body);
      const newRate = await commissionService.configureCommissionRate(validated, adminId);

      sendSuccess({
        res,
        statusCode: 201,
        code: 'COMMISSION_RATE_CONFIGURED',
        message: `Platform commission rate updated to ${newRate.percentage}%`,
        data: { newRate },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getExemptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const status = req.query.status as string | undefined;
      const sellerId = req.query.sellerId as string | undefined;

      const result = await commissionService.getSellerExemptions({ sellerId, status, page, limit });

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async grantExemption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const validated = CreateSellerExemptionSchema.parse(req.body);
      const exemption = await commissionService.grantSellerExemption(
        validated.sellerId,
        validated.reason,
        adminId
      );

      sendSuccess({
        res,
        statusCode: 201,
        code: 'EXEMPTION_GRANTED',
        message: 'Commission exemption granted to seller successfully',
        data: { exemption },
      });
    } catch (err) {
      next(err);
    }
  }

  public async revokeExemption(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const validated = RevokeSellerExemptionSchema.parse(req.body);
      const exemption = await commissionService.revokeSellerExemption(
        req.params.sellerId,
        validated.reason,
        adminId
      );

      sendSuccess({
        res,
        code: 'EXEMPTION_REVOKED',
        message: 'Commission exemption revoked successfully',
        data: { exemption },
      });
    } catch (err) {
      next(err);
    }
  }

  public async getCommissionLedger(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CommissionLedgerQuerySchema.parse(req.query);
      const result = await commissionService.getCommissionLedgerEntries(validated);

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = InvoiceQuerySchema.parse(req.query);
      const result = await invoiceService.getAdminInvoices(validated);

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
      const result = await invoiceService.getAdminInvoiceById(req.params.id);

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async generateInvoices(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const validated = GenerateInvoicesSchema.parse(req.body);
      const result = await invoiceService.generateInvoicesForPeriod(validated.billingPeriod, adminId);

      sendSuccess({
        res,
        code: 'INVOICES_GENERATED',
        message: `Monthly commission invoice batch completed for ${result.billingPeriod}: ${result.generatedCount} generated, ${result.skippedCount} skipped`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getPaymentVerificationQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await paymentVerificationService.getPendingVerificationQueue({ page, limit });

      sendSuccess({
        res,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async verifyPaymentReceipt(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const validated = VerifyInvoiceReceiptSchema.parse(req.body);
      const result = await paymentVerificationService.verifyInvoiceReceipt(
        req.params.id,
        req.params.receiptId,
        validated,
        adminId
      );

      sendSuccess({
        res,
        code: 'RECEIPT_VERIFIED',
        message: `Payment receipt successfully ${result.receipt.reviewStatus.toLowerCase()}`,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  public async getPlatformBankSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await platformFinancialSettingsService.getPlatformBankSettings();

      sendSuccess({
        res,
        data: { settings },
      });
    } catch (err) {
      next(err);
    }
  }

  public async updatePlatformBankSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = req.user!.userId;
      const validated = PlatformBankAccountSchema.parse(req.body);
      const settings = await platformFinancialSettingsService.updatePlatformBankSettings(
        validated,
        adminId
      );

      sendSuccess({
        res,
        message: 'Platform bank account settings updated successfully',
        data: { settings },
      });
    } catch (err) {
      next(err);
    }
  }
}

export const adminFinanceController = new AdminFinanceController();
