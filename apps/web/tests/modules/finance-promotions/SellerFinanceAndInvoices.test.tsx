// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SellerFinanceOverviewPage } from '../../../src/modules/finance-promotions/pages/seller/SellerFinanceOverviewPage.js';
import { SellerInvoicesPage } from '../../../src/modules/finance-promotions/pages/seller/SellerInvoicesPage.js';
import { SellerInvoiceDetailPage } from '../../../src/modules/finance-promotions/pages/seller/SellerInvoiceDetailPage.js';
import { SellerSubsidiesPage } from '../../../src/modules/finance-promotions/pages/seller/SellerSubsidiesPage.js';
import { InvoiceReceiptUploadModal } from '../../../src/modules/finance-promotions/components/InvoiceReceiptUploadModal.js';
import {
  sellerFinanceApi,
  publicFinanceApi,
  SellerInvoice,
  CommissionSummary,
  CommissionLedgerEntry,
  InvoicePaymentReceipt,
  PlatformSubsidyRecord,
} from '../../../src/modules/finance-promotions/api/financePromotionsApi.js';

// Mock API
vi.mock('../../../src/modules/finance-promotions/api/financePromotionsApi.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    sellerFinanceApi: {
      getSummary: vi.fn(),
      getInvoices: vi.fn(),
      getInvoiceById: vi.fn(),
      uploadReceipt: vi.fn(),
      getReceipts: vi.fn(),
      getSubsidies: vi.fn(),
      getReceiptStreamUrl: vi.fn((invoiceId, receiptId) => `/api/seller/finance/invoices/${invoiceId}/receipts/${receiptId}/view`),
    },
    publicFinanceApi: {
      getPlatformBankAccount: vi.fn(),
    },
  };
});

describe('MOD-04 Seller Finance, Invoices & Subsidies Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  const mockSummary: CommissionSummary = {
    lifetimeCommissionInCents: 15000000,
    currentMonthAccruedInCents: 450000,
    uninvoicedAccruedInCents: 120000,
    outstandingInvoiceBalanceInCents: 350000,
    totalSubsidyAccruedInCents: 85000,
  };

  const mockInvoice: SellerInvoice = {
    _id: 'inv-01',
    invoiceNumber: 'INV-202611-0001',
    sellerId: 'sel-001',
    billingPeriod: '2026-10',
    periodStart: '2026-10-01T00:00:00.000Z',
    periodEnd: '2026-10-31T23:59:59.999Z',
    issueDate: '2026-11-01T00:00:00.000Z',
    dueDate: '2026-11-15T23:59:59.999Z',
    grossProductTotalInCents: 5000000,
    grossCommissionInCents: 400000,
    verifiedPaidInCents: 0,
    outstandingBalanceInCents: 400000,
    status: 'ISSUED',
    sellerBillingSnapshot: {
      businessName: 'Apex Motor Spares',
      businessRegNumber: 'PV-98765',
      billingEmail: 'billing@apexparts.lk',
      contactPhone: '+94 77 123 4567',
    },
    itemCount: 2,
    createdAt: '2026-11-01T00:00:00.000Z',
    updatedAt: '2026-11-01T00:00:00.000Z',
  };

  const mockLineItems: CommissionLedgerEntry[] = [
    {
      _id: 'led-01',
      ledgerReference: 'LED-202610-001',
      sellerId: 'sel-001',
      orderId: 'ord-101',
      suborderId: '64b8f0000000000000000101',
      completionTimestamp: '2026-10-15T10:00:00.000Z',
      productSubtotalInCents: 3000000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 50000,
      commissionableBaseInCents: 3000000,
      appliedRateBasisPoints: 800,
      isExempt: false,
      commissionAmountInCents: 240000,
      currency: 'LKR',
      status: 'INVOICED',
      createdAt: '2026-10-15T10:00:00.000Z',
    },
    {
      _id: 'led-02',
      ledgerReference: 'LED-202610-002',
      sellerId: 'sel-001',
      orderId: 'ord-102',
      suborderId: '64b8f0000000000000000102',
      completionTimestamp: '2026-10-20T14:30:00.000Z',
      productSubtotalInCents: 2000000,
      sellerDiscountInCents: 0,
      platformDiscountInCents: 0,
      deliveryFeeInCents: 50000,
      commissionableBaseInCents: 2000000,
      appliedRateBasisPoints: 800,
      isExempt: false,
      commissionAmountInCents: 160000,
      currency: 'LKR',
      status: 'INVOICED',
      createdAt: '2026-10-20T14:30:00.000Z',
    },
  ];

  const mockReceipts: InvoicePaymentReceipt[] = [
    {
      _id: 'rec-01',
      invoiceId: 'inv-01',
      sellerId: 'sel-001',
      originalFileName: 'bank_transfer_slip.png',
      mimeType: 'image/png',
      fileSizeBytes: 204800,
      claimedAmountInCents: 400000,
      depositDate: '2026-11-05T00:00:00.000Z',
      reviewStatus: 'PENDING',
      createdAt: '2026-11-05T10:00:00.000Z',
    },
  ];

  const mockSubsidy: PlatformSubsidyRecord = {
    _id: 'sub-01',
    subsidyReference: 'SUB-202611-0001',
    sellerId: 'sel-001',
    orderId: 'ord-101',
    suborderId: '64b8f0000000000000000101',
    promotionId: 'p-01',
    promotionCode: 'AUTODEAL500',
    eligibleProductAmountInCents: 500000,
    subsidyAmountInCents: 50000,
    currency: 'LKR',
    accrualTimestamp: '2026-11-10T12:00:00.000Z',
    status: 'ACCRUED',
    createdAt: '2026-11-10T12:00:00.000Z',
  };

  it('Renders SellerFinanceOverviewPage with metric cards and recent invoices', async () => {
    vi.mocked(sellerFinanceApi.getSummary).mockResolvedValueOnce({
      success: true,
      data: mockSummary,
    });
    vi.mocked(sellerFinanceApi.getInvoices).mockResolvedValueOnce({
      success: true,
      data: {
        invoices: [mockInvoice],
        pagination: { page: 1, limit: 5, total: 1, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <SellerFinanceOverviewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Finance & Settlements')).toBeDefined();
      expect(screen.getByText('Outstanding Invoices')).toBeDefined();
      expect(screen.getByText('Month Accrual')).toBeDefined();
      expect(screen.getByText('Uninvoiced Accrued')).toBeDefined();
      expect(screen.getByText('Platform Subsidies')).toBeDefined();
      expect(screen.getByText('INV-202611-0001')).toBeDefined();
      expect(screen.getByText('Issued (Unpaid)')).toBeDefined();
    });
  });

  it('Renders SellerInvoicesPage with invoices table and filter bar', async () => {
    vi.mocked(sellerFinanceApi.getInvoices).mockResolvedValueOnce({
      success: true,
      data: {
        invoices: [mockInvoice],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <SellerInvoicesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Monthly Commission Invoices')).toBeDefined();
      expect(screen.getByText('INV-202611-0001')).toBeDefined();
      expect(screen.getAllByText('Issued (Unpaid)').length).toBeGreaterThan(0);
    });
  });

  it('Renders SellerInvoiceDetailPage with line items and opens Bank Instructions modal', async () => {
    vi.mocked(sellerFinanceApi.getInvoiceById).mockResolvedValueOnce({
      success: true,
      data: {
        invoice: mockInvoice,
        lineItems: mockLineItems,
        receipts: mockReceipts,
      },
    });

    vi.mocked(publicFinanceApi.getPlatformBankAccount).mockResolvedValueOnce({
      success: true,
      data: {
        bankName: 'Bank of Ceylon',
        accountHolderName: 'AutoDock Marketplace (Pvt) Ltd',
        accountNumber: '000123456789',
        branchName: 'Corporate Branch Colombo',
        branchCode: 'BOC001',
        paymentInstructions: 'Please state your invoice number as the payment reference.',
      },
    });

    render(
      <MemoryRouter initialEntries={['/seller/finance/invoices/inv-01']}>
        <Routes>
          <Route path="/seller/finance/invoices/:id" element={<SellerInvoiceDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('INV-202611-0001').length).toBeGreaterThan(0);
      expect(screen.getByText('LED-202610-001')).toBeDefined();
      expect(screen.getByText('LED-202610-002')).toBeDefined();
    });

    // Click "Bank Transfer Info" button
    const bankBtn = screen.getByRole('button', { name: /Bank Transfer Info/i });
    fireEvent.click(bankBtn);

    await waitFor(() => {
      expect(screen.getByText('Bank of Ceylon')).toBeDefined();
      expect(screen.getByText('000123456789')).toBeDefined();
      expect(screen.getByText(/Corporate Branch Colombo/i)).toBeDefined();
    });
  });

  it('Validates InvoiceReceiptUploadModal file size and types', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    const { container } = render(
      <InvoiceReceiptUploadModal
        isOpen={true}
        onClose={handleClose}
        invoiceId="inv-01"
        invoiceNumber="INV-202611-0001"
        outstandingBalanceInCents={400000}
        onUploadSuccess={handleSuccess}
      />
    );

    expect(screen.getByText('Upload Invoice Payment Slip')).toBeDefined();
    expect(screen.getByText(/INV-202611-0001/)).toBeDefined();

    // Select invalid file type
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const invalidFile = new File(['bad content'], 'test.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Invalid file format/i)).toBeDefined();
    });
  });

  it('Renders SellerSubsidiesPage with governance separation warning and subsidy ledger', async () => {
    vi.mocked(sellerFinanceApi.getSubsidies).mockResolvedValueOnce({
      success: true,
      data: {
        subsidies: [mockSubsidy],
        totalAccruedInCents: 50000,
        totalSettledInCents: 0,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <SellerSubsidiesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('AutoDock Subsidy Ledger')).toBeDefined();
      expect(screen.getByText(/Subsidy Settlement & Invoicing Policy Notice/i)).toBeDefined();
      expect(screen.getByText(/AUTODEAL500/i)).toBeDefined();
      expect(screen.getByText('Accrued (Payable by AutoDock)')).toBeDefined();
    });
  });
});
