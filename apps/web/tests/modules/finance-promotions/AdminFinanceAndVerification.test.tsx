// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminFinanceOverviewPage } from '../../../src/modules/finance-promotions/pages/admin/AdminFinanceOverviewPage.js';
import { AdminCommissionRatePage } from '../../../src/modules/finance-promotions/pages/admin/AdminCommissionRatePage.js';
import { AdminSellerExemptionsPage } from '../../../src/modules/finance-promotions/pages/admin/AdminSellerExemptionsPage.js';
import { AdminPaymentVerificationQueuePage } from '../../../src/modules/finance-promotions/pages/admin/AdminPaymentVerificationQueuePage.js';
import { AdminReceiptVerificationModal } from '../../../src/modules/finance-promotions/components/AdminReceiptVerificationModal.js';
import { AdminPlatformBankSettingsPage } from '../../../src/modules/finance-promotions/pages/admin/AdminPlatformBankSettingsPage.js';
import {
  adminFinanceApi,
  adminPromotionApi,
  InvoicePaymentReceipt,
} from '../../../src/modules/finance-promotions/api/financePromotionsApi.js';

// Mock API
vi.mock('../../../src/modules/finance-promotions/api/financePromotionsApi.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    adminFinanceApi: {
      getCommissionRate: vi.fn(),
      configureCommissionRate: vi.fn(),
      getExemptions: vi.fn(),
      grantExemption: vi.fn(),
      revokeExemption: vi.fn(),
      getCommissionLedger: vi.fn(),
      getInvoices: vi.fn(),
      generateInvoices: vi.fn(),
      getInvoiceById: vi.fn(),
      getPaymentVerificationQueue: vi.fn(),
      verifyPaymentReceipt: vi.fn(),
      getPlatformBankSettings: vi.fn(),
      updatePlatformBankSettings: vi.fn(),
      getReceiptStreamUrl: vi.fn((invoiceId, receiptId) => `/api/admin/finance/invoices/${invoiceId}/receipts/${receiptId}/view`),
    },
    adminPromotionApi: {
      getPromotions: vi.fn(),
      getPromotionById: vi.fn(),
      createPromotion: vi.fn(),
      updateStatus: vi.fn(),
      getSubsidies: vi.fn(),
    },
  };
});

describe('MOD-04 Administrator Finance Governance & Verification Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  const mockPendingReceipt: InvoicePaymentReceipt = {
    _id: 'rec-99',
    invoiceId: {
      _id: 'inv-88',
      invoiceNumber: 'INV-202611-0088',
      billingPeriod: '2026-10',
      grossCommissionInCents: 250000,
      outstandingBalanceInCents: 250000,
      status: 'PAYMENT_PENDING_VERIFICATION',
    },
    sellerId: {
      _id: 'sel-88',
      businessName: 'Lanka Auto Dynamics (Pvt) Ltd',
    },
    claimedAmountInCents: 250000,
    depositDate: '2026-11-20T00:00:00.000Z',
    originalFileName: 'bank_deposit_slip_boc.png',
    mimeType: 'image/png',
    fileSizeBytes: 345000,
    reviewStatus: 'PENDING',
    createdAt: '2026-11-20T10:15:00.000Z',
  };

  it('Renders AdminFinanceOverviewPage with platform KPIs and sub-module navigation cards', async () => {
    vi.mocked(adminFinanceApi.getCommissionRate).mockResolvedValueOnce({
      success: true,
      data: {
        currentRate: {
          _id: 'rate-01',
          basisPoints: 800,
          percentage: 8,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          description: 'Current standard commission rate',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        history: [],
      },
    });

    vi.mocked(adminFinanceApi.getPaymentVerificationQueue).mockResolvedValueOnce({
      success: true,
      data: {
        pendingReceipts: [mockPendingReceipt],
        pagination: { page: 1, limit: 1, total: 3, totalPages: 3 },
      },
    });

    vi.mocked(adminFinanceApi.getCommissionLedger).mockResolvedValueOnce({
      success: true,
      data: {
        entries: [],
        summary: { totalCommissionInCents: 154000000, totalBaseInCents: 1925000000 },
        pagination: { page: 1, limit: 1, total: 120, totalPages: 120 },
      },
    });

    vi.mocked(adminPromotionApi.getSubsidies).mockResolvedValueOnce({
      success: true,
      data: {
        subsidies: [],
        totalAccruedInCents: 450000,
        totalSettledInCents: 200000,
        pagination: { page: 1, limit: 1, total: 5, totalPages: 5 },
      },
    });

    render(
      <MemoryRouter>
        <AdminFinanceOverviewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Finance & Settlements Governance')).toBeDefined();
      expect(screen.getByText('Active Commission Rate')).toBeDefined();
      expect(screen.getByText('Receipts Pending Review')).toBeDefined();
      expect(screen.getByText('Commission Earned (All-Time)')).toBeDefined();
      expect(screen.getByText('Commission Rate Configuration')).toBeDefined();
      expect(screen.getByText('Seller Commission Exemptions')).toBeDefined();
      expect(screen.getByText('Payment Verification Queue')).toBeDefined();
    });
  });

  it('Renders AdminCommissionRatePage and displays current platform commission rate', async () => {
    vi.mocked(adminFinanceApi.getCommissionRate).mockResolvedValueOnce({
      success: true,
      data: {
        currentRate: {
          _id: 'rate-01',
          basisPoints: 800,
          percentage: 8,
          effectiveFrom: '2026-01-01T00:00:00.000Z',
          description: 'Initial platform rate',
          createdAt: '2026-01-01T00:00:00.000Z',
        },
        history: [
          {
            _id: 'hist-01',
            basisPoints: 800,
            percentage: 8,
            effectiveFrom: '2026-01-01T00:00:00.000Z',
            description: 'Initial platform rate',
            createdAt: '2026-01-01T00:00:00.000Z',
          },
        ],
      },
    });

    render(
      <MemoryRouter>
        <AdminCommissionRatePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Commission Rate Configuration')).toBeDefined();
      expect(screen.getAllByText('8.00%').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/800 bps/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText('Initial platform rate').length).toBeGreaterThan(0);
    });
  });

  it('Renders AdminSellerExemptionsPage, validates 24-hex ObjectId and grants exemption', async () => {
    vi.mocked(adminFinanceApi.getExemptions).mockResolvedValueOnce({
      success: true,
      data: {
        exemptions: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
      },
    });

    vi.mocked(adminFinanceApi.grantExemption).mockResolvedValueOnce({
      success: true,
      data: {
        exemption: {
          _id: 'ex-01',
          sellerId: '64b8f0000000000000000001',
          status: 'ACTIVE',
          reason: 'Strategic OEM direct distribution contract',
          activatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminSellerExemptionsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Seller Commission Exemptions')).toBeDefined();

    // Click "Grant Seller Exemption"
    const grantBtn = screen.getByRole('button', { name: /Grant Seller Exemption/i });
    fireEvent.click(grantBtn);

    await waitFor(() => {
      expect(screen.getByText('Enable 0% commission for a specific seller')).toBeDefined();
    });

    // Fill invalid seller ID
    const sellerInput = screen.getByPlaceholderText(/e\.g\. 64b8f\.\.\.24 chars/i);
    fireEvent.change(sellerInput, { target: { value: 'invalid-id' } });

    const reasonInput = screen.getByPlaceholderText(/e\.g\. Strategic Tier-1 OEM distributor/i);
    fireEvent.change(reasonInput, { target: { value: 'Strategic partner contract for testing' } });

    const submitBtn = screen.getByRole('button', { name: /Grant Exemption/i });
    fireEvent.click(submitBtn);

    // Shows 24-character hex validation error
    await waitFor(() => {
      expect(screen.getByText(/Seller ID must be a valid 24-character hexadecimal ObjectId/i)).toBeDefined();
    });

    // Correct to valid 24-hex ObjectId
    fireEvent.change(sellerInput, { target: { value: '64b8f0000000000000000001' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(adminFinanceApi.grantExemption).toHaveBeenCalledWith({
        sellerId: '64b8f0000000000000000001',
        reason: 'Strategic partner contract for testing',
      });
    });
  });

  it('Renders AdminPaymentVerificationQueuePage and allows reviewing receipts with AdminReceiptVerificationModal', async () => {
    vi.mocked(adminFinanceApi.getPaymentVerificationQueue).mockResolvedValueOnce({
      success: true,
      data: {
        pendingReceipts: [mockPendingReceipt],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <AdminPaymentVerificationQueuePage />
      </MemoryRouter>
    );

    expect(screen.getByText('Payment Verification Queue')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Lanka Auto Dynamics (Pvt) Ltd')).toBeDefined();
      expect(screen.getByText('Verify & Settle')).toBeDefined();
    });

    // Click "Verify & Settle" to open review modal
    const reviewBtn = screen.getByRole('button', { name: /Verify & Settle/i });
    fireEvent.click(reviewBtn);

    await waitFor(() => {
      expect(screen.getByText('Verify Seller Invoice Payment')).toBeDefined();
      expect(screen.getAllByText('Lanka Auto Dynamics (Pvt) Ltd').length).toBeGreaterThan(0);
    });
  });

  it('AdminReceiptVerificationModal verifies receipt approval with bank transaction reference', async () => {
    const handleClose = vi.fn();
    const handleDecisionComplete = vi.fn();

    vi.mocked(adminFinanceApi.verifyPaymentReceipt).mockResolvedValueOnce({
      success: true,
      data: {
        receipt: {
          ...mockPendingReceipt,
          reviewStatus: 'APPROVED',
          bankTransactionReference: 'BOC-TXN-998877',
        },
        invoice: {} as any,
      },
    });

    render(
      <AdminReceiptVerificationModal
        isOpen={true}
        onClose={handleClose}
        receipt={mockPendingReceipt}
        onDecisionComplete={handleDecisionComplete}
      />
    );

    expect(screen.getByText('Verify Seller Invoice Payment')).toBeDefined();

    // Select Approve action
    const approveSelectBtn = screen.getByRole('button', { name: /Approve & Credit Payment/i });
    fireEvent.click(approveSelectBtn);

    // Fill bank transaction reference
    const txnInput = screen.getByPlaceholderText(/e\.g\. BOC-TXN-1029384/i);
    fireEvent.change(txnInput, { target: { value: 'BOC-TXN-998877' } });

    // Click Confirm Approval
    const confirmBtn = screen.getByRole('button', { name: /Confirm Approval/i });
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminFinanceApi.verifyPaymentReceipt).toHaveBeenCalledWith(
        'inv-88',
        'rec-99',
        expect.objectContaining({
          action: 'APPROVE',
          bankTransactionReference: 'BOC-TXN-998877',
        })
      );
      expect(handleDecisionComplete).toHaveBeenCalled();
    });
  });

  it('AdminReceiptVerificationModal verifies receipt rejection requires min 5 characters reason', async () => {
    const handleClose = vi.fn();
    const handleDecisionComplete = vi.fn();

    render(
      <AdminReceiptVerificationModal
        isOpen={true}
        onClose={handleClose}
        receipt={mockPendingReceipt}
        onDecisionComplete={handleDecisionComplete}
      />
    );

    // Select Reject action
    const rejectSelectBtn = screen.getByRole('button', { name: /Reject Deposit Slip/i });
    fireEvent.click(rejectSelectBtn);

    // Fill rejection reason shorter than 5 chars
    const reasonInput = screen.getByPlaceholderText(/e\.g\. Deposit slip illegible/i);
    fireEvent.change(reasonInput, { target: { value: 'bad' } });

    // Click Confirm Rejection
    const rejectBtn = screen.getByRole('button', { name: /Confirm Rejection/i });
    fireEvent.click(rejectBtn);

    await waitFor(() => {
      expect(screen.getByText(/Rejection reason \(min 5 characters\) is required/i)).toBeDefined();
    });
  });

  it('Renders AdminPlatformBankSettingsPage and saves corporate bank instructions', async () => {
    vi.mocked(adminFinanceApi.getPlatformBankSettings).mockResolvedValueOnce({
      success: true,
      data: {
        settings: {
          bankName: 'Bank of Ceylon',
          accountHolderName: 'AutoDock Marketplace (Pvt) Ltd',
          accountNumber: '000123456789',
          branchName: 'Corporate Branch',
          branchCode: 'BOC001',
          paymentInstructions: 'State invoice number',
        },
      },
    });

    render(
      <MemoryRouter>
        <AdminPlatformBankSettingsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Platform Bank Account Settings')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByDisplayValue('Bank of Ceylon')).toBeDefined();
      expect(screen.getByDisplayValue('000123456789')).toBeDefined();
    });
  });
});
