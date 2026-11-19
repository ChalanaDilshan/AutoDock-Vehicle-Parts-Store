import crypto from 'crypto';
import mongoose from 'mongoose';
import { SellerInvoice, ISellerBillingSnapshot } from '../models/sellerInvoice.model.js';
import { CommissionLedger, ICommissionLedger } from '../models/commissionLedger.model.js';
import { InvoicePaymentReceipt } from '../models/invoicePaymentReceipt.model.js';
import { identityPublicService } from '../../identity/contracts/identity.contract.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';
import { logger } from '../../../shared/utils/logger.js';
import { financeAuditNotifier } from './financeAuditNotifier.js';

export class InvoiceService {
  /**
   * Deterministically parses YYYY-MM into start and end UTC timestamps.
   */
  public getPeriodDateRange(billingPeriod: string): { periodStart: Date; periodEnd: Date } {
    const parts = billingPeriod.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);

    const periodStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
    const nextMonth = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const periodEnd = new Date(nextMonth.getTime() - 1);

    return { periodStart, periodEnd };
  }

  /**
   * Generates monthly commission invoices for all active sellers with accrued ledger entries.
   * STRICT INVARIANT: Idempotent. Will not regenerate for the same (sellerId, billingPeriod).
   */
  public async generateInvoicesForPeriod(
    billingPeriod: string,
    adminId: string
  ): Promise<{ generatedCount: number; skippedCount: number; billingPeriod: string }> {
    const { periodStart, periodEnd } = this.getPeriodDateRange(billingPeriod);
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // 14 days due window

    // 1. Fetch unassigned accrued ledger entries for this period
    const accruedEntries = await CommissionLedger.find({
      status: 'ACCRUED',
      completionTimestamp: { $gte: periodStart, $lte: periodEnd },
    });

    if (accruedEntries.length === 0) {
      logger.info(`[InvoiceService] No unassigned accrued ledger entries found for period ${billingPeriod}`);
      return { generatedCount: 0, skippedCount: 0, billingPeriod };
    }

    // 2. Group entries by sellerId
    const entriesBySeller = new Map<string, ICommissionLedger[]>();
    for (const entry of accruedEntries) {
      const sId = entry.sellerId.toString();
      const existingList = entriesBySeller.get(sId) || [];
      existingList.push(entry);
      entriesBySeller.set(sId, existingList);
    }

    let generatedCount = 0;
    let skippedCount = 0;

    for (const [sellerIdStr, entries] of entriesBySeller.entries()) {
      const sellerObjectId = new mongoose.Types.ObjectId(sellerIdStr);

      // Check if invoice already exists
      const existingInvoice = await SellerInvoice.findOne({
        sellerId: sellerObjectId,
        billingPeriod,
      });

      if (existingInvoice) {
        logger.info(`[InvoiceService] Invoice already exists for seller ${sellerIdStr} in period ${billingPeriod}. Skipping.`);
        skippedCount++;
        continue;
      }

      // Aggregate financial figures
      let grossProductTotalInCents = 0;
      let grossCommissionInCents = 0;

      for (const item of entries) {
        grossProductTotalInCents += item.productSubtotalInCents;
        grossCommissionInCents += item.commissionAmountInCents;
      }

      // Obtain official seller billing identity from MOD-01
      let billingSnapshot: ISellerBillingSnapshot;
      try {
        const identity = await identityPublicService.getSellerBillingIdentity(sellerIdStr);
        if (identity) {
          billingSnapshot = {
            businessName: identity.businessName,
            businessRegNumber: identity.businessRegistrationNumber,
            billingEmail: identity.billingEmail,
            contactPhone: identity.contactPhone,
            address: identity.operatingAddress,
          };
        } else {
          billingSnapshot = {
            businessName: `Seller Profile (${sellerIdStr.slice(-6)})`,
            businessRegNumber: 'PV-PENDING',
            billingEmail: 'billing@autodock.lk',
            contactPhone: '+94770000000',
            address: {
              street: 'Marketplace Merchant Road',
              city: 'Colombo',
              district: 'Colombo',
              province: 'Western',
              postalCode: '00100',
            },
          };
        }
      } catch {
        billingSnapshot = {
          businessName: `Seller (${sellerIdStr.slice(-6)})`,
          businessRegNumber: 'PV-PENDING',
          billingEmail: 'billing@autodock.lk',
          contactPhone: '+94770000000',
          address: {
            street: 'Marketplace Merchant Road',
            city: 'Colombo',
            district: 'Colombo',
            province: 'Western',
            postalCode: '00100',
          },
        };
      }

      // Generate invoice number: INV-YYYYMM-XXXX-XXXX
      const periodClean = billingPeriod.replace('-', '');
      const sellerCode = sellerIdStr.slice(-4).toUpperCase();
      const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
      const invoiceNumber = `INV-${periodClean}-${sellerCode}-${randomHex}`;

      const newInvoice = await SellerInvoice.create({
        invoiceNumber,
        sellerId: sellerObjectId,
        billingPeriod,
        periodStart,
        periodEnd,
        issueDate: new Date(),
        dueDate,
        sellerBillingSnapshot: billingSnapshot,
        lineItemCount: entries.length,
        grossProductTotalInCents,
        grossCommissionInCents,
        verifiedPaidInCents: 0,
        outstandingBalanceInCents: grossCommissionInCents,
        currency: 'LKR',
        status: 'ISSUED',
      });

      // Update ledger records to mark them INVOICED
      const entryIds = entries.map((e) => e._id);
      await CommissionLedger.updateMany(
        { _id: { $in: entryIds } },
        { $set: { status: 'INVOICED', invoiceId: newInvoice._id } }
      );

      generatedCount++;

      // Audit and notify
      financeAuditNotifier.logAudit({
        action: 'FINANCE_INVOICE_ISSUED',
        actorId: adminId,
        actorRole: 'ADMIN',
        targetId: newInvoice._id.toString(),
        details: {
          invoiceNumber,
          sellerId: sellerIdStr,
          grossCommissionInCents,
          billingPeriod,
        },
      });

      financeAuditNotifier.dispatchNotification({
        recipientId: sellerIdStr,
        recipientEmail: billingSnapshot.billingEmail,
        template: 'SELLER_MONTHLY_INVOICE_ISSUED',
        subject: `AutoDock Invoice ${invoiceNumber} Issued for ${billingPeriod}`,
        bodyData: {
          invoiceNumber,
          grossCommissionInCents,
          dueDate: dueDate.toISOString(),
        },
      });
    }

    return { generatedCount, skippedCount, billingPeriod };
  }

  /**
   * Seller views own invoices with pagination and filters.
   */
  public async getSellerInvoices(
    sellerId: string,
    query: { status?: string; billingPeriod?: string; page?: number; limit?: number }
  ) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const filter: Record<string, any> = { sellerId: new mongoose.Types.ObjectId(sellerId) };

    if (query.status) filter.status = query.status;
    if (query.billingPeriod) filter.billingPeriod = query.billingPeriod;

    const [invoices, total] = await Promise.all([
      SellerInvoice.find(filter)
        .sort({ issueDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SellerInvoice.countDocuments(filter),
    ]);

    return {
      invoices,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Seller views specific invoice details with BOLA ownership guard.
   */
  public async getSellerInvoiceById(invoiceId: string, sellerId: string) {
    const invoice = await SellerInvoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    if (invoice.sellerId.toString() !== sellerId) {
      throw new AppError('Forbidden: Access to another seller invoice denied', 403, 'FORBIDDEN_INVOICE_ACCESS');
    }

    const lineItems = await CommissionLedger.find({ invoiceId: invoice._id }).sort({
      completionTimestamp: -1,
    });

    return { invoice, lineItems };
  }

  /**
   * Admin lists all seller invoices with summary aggregations.
   */
  public async getAdminInvoices(query: {
    sellerId?: string;
    billingPeriod?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const filter: Record<string, any> = {};

    if (query.sellerId) filter.sellerId = new mongoose.Types.ObjectId(query.sellerId);
    if (query.billingPeriod) filter.billingPeriod = query.billingPeriod;
    if (query.status) filter.status = query.status;

    const [invoices, total, aggregation] = await Promise.all([
      SellerInvoice.find(filter)
        .sort({ issueDate: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      SellerInvoice.countDocuments(filter),
      SellerInvoice.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            totalGrossCommissionInCents: { $sum: '$grossCommissionInCents' },
            totalVerifiedPaidInCents: { $sum: '$verifiedPaidInCents' },
            totalOutstandingBalanceInCents: { $sum: '$outstandingBalanceInCents' },
          },
        },
      ]),
    ]);

    const metrics = aggregation[0] || {
      totalGrossCommissionInCents: 0,
      totalVerifiedPaidInCents: 0,
      totalOutstandingBalanceInCents: 0,
    };

    return {
      invoices,
      metrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Admin views invoice details, ledger line items, and payment receipts.
   */
  public async getAdminInvoiceById(invoiceId: string) {
    const invoice = await SellerInvoice.findById(invoiceId);
    if (!invoice) {
      throw new AppError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
    }

    const [lineItems, receipts] = await Promise.all([
      CommissionLedger.find({ invoiceId: invoice._id }).sort({ completionTimestamp: -1 }),
      InvoicePaymentReceipt.find({ invoiceId: invoice._id }).sort({ createdAt: -1 }),
    ]);

    return { invoice, lineItems, receipts };
  }

  /**
   * Evaluates and transitions overdue invoices.
   */
  public async updateOverdueInvoices(): Promise<number> {
    const now = new Date();
    const result = await SellerInvoice.updateMany(
      {
        status: 'ISSUED',
        dueDate: { $lt: now },
        outstandingBalanceInCents: { $gt: 0 },
      },
      { $set: { status: 'OVERDUE' } }
    );

    return result.modifiedCount;
  }
}

export const invoiceService = new InvoiceService();
