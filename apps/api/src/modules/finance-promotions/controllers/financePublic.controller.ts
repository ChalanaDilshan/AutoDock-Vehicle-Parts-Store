import { Request, Response, NextFunction } from 'express';
import { platformFinancialSettingsService } from '../services/platformFinancialSettings.service.js';
import { sendSuccess } from '../../../shared/utils/apiResponse.js';

export class FinancePublicController {
  public async getPlatformBankAccount(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await platformFinancialSettingsService.getPlatformBankSettings();

      sendSuccess({
        res,
        data: {
          bankName: settings.bankName,
          accountHolderName: settings.accountHolderName,
          accountNumber: settings.accountNumber,
          branchName: settings.branchName,
          branchCode: settings.branchCode,
          paymentInstructions: settings.paymentInstructions,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  public getHealth(_req: Request, res: Response): void {
    res.json({
      module: 'MOD-04 Finance & Promotion Management',
      status: 'READY',
      version: 'v1.0.0',
    });
  }
}

export const financePublicController = new FinancePublicController();
