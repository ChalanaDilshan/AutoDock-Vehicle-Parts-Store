import mongoose from 'mongoose';
import { PlatformFinancialSettings, IPlatformFinancialSettings } from '../models/platformFinancialSettings.model.js';
import { financeAuditNotifier } from './financeAuditNotifier.js';

export interface UpdatePlatformBankSettingsInput {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branchName: string;
  branchCode?: string;
  paymentInstructions: string;
}

export class PlatformFinancialSettingsService {
  /**
   * Retrieves authoritative AutoDock corporate bank deposit instructions.
   */
  public async getPlatformBankSettings(): Promise<IPlatformFinancialSettings> {
    let settings = await PlatformFinancialSettings.findOne();
    if (!settings) {
      settings = await PlatformFinancialSettings.create({
        bankName: 'Bank of Ceylon',
        accountHolderName: 'AutoDock Marketplace (Pvt) Ltd',
        accountNumber: '0089201928',
        branchName: 'Corporate Branch, Colombo 01',
        branchCode: '7010',
        paymentInstructions:
          'Please transfer the exact invoice balance to the account above. Mention your Invoice Number as the deposit reference. Upload the transfer slip immediately for administrative verification.',
        updatedBy: new mongoose.Types.ObjectId(),
      });
    }
    return settings;
  }

  /**
   * Administrator updates platform corporate bank account settings.
   */
  public async updatePlatformBankSettings(
    input: UpdatePlatformBankSettingsInput,
    adminId: string
  ): Promise<IPlatformFinancialSettings> {
    let settings = await PlatformFinancialSettings.findOne();
    if (!settings) {
      settings = new PlatformFinancialSettings();
    }

    settings.bankName = input.bankName;
    settings.accountHolderName = input.accountHolderName;
    settings.accountNumber = input.accountNumber;
    settings.branchName = input.branchName;
    settings.branchCode = input.branchCode;
    settings.paymentInstructions = input.paymentInstructions;
    settings.updatedBy = new mongoose.Types.ObjectId(adminId);
    await settings.save();

    financeAuditNotifier.logAudit({
      action: 'FINANCE_PLATFORM_BANK_SETTINGS_UPDATED',
      actorId: adminId,
      actorRole: 'ADMIN',
      details: {
        bankName: settings.bankName,
        accountHolderName: settings.accountHolderName,
        branchName: settings.branchName,
      },
    });

    return settings;
  }
}

export const platformFinancialSettingsService = new PlatformFinancialSettingsService();
