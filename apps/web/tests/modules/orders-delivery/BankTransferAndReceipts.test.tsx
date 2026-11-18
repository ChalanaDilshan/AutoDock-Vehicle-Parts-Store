// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { BankInstructionsModal } from '../../../src/modules/orders-delivery/components/BankInstructionsModal.js';
import { ReceiptUploadDrawer } from '../../../src/modules/orders-delivery/components/ReceiptUploadDrawer.js';
import { ReceiptReviewModal } from '../../../src/modules/orders-delivery/components/ReceiptReviewModal.js';
import {
  orderApi,
  sellerOrderApi,
} from '../../../src/modules/orders-delivery/api/ordersDeliveryApi.js';

vi.mock('../../../src/modules/orders-delivery/api/ordersDeliveryApi.js', async () => {
  const actual = await vi.importActual<any>(
    '../../../src/modules/orders-delivery/api/ordersDeliveryApi.js'
  );
  return {
    ...actual,
    orderApi: {
      uploadReceipt: vi.fn(),
      getReceiptStreamUrl: vi.fn((token: string) => `http://mock-api/stream?token=${token}`),
    },
    sellerOrderApi: {
      getSellerSuborderReceipt: vi.fn(),
      verifyReceipt: vi.fn(),
    },
  };
});

describe('MOD-03 Bank Transfer Instructions & Receipt Review Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renders verified bank instructions modal with seller account details', () => {
    const mockInstructions = {
      bankName: 'Commercial Bank of Ceylon',
      branchName: 'Kollupitiya Branch',
      accountHolderName: 'Apex Auto Spare Parts (Pvt) Ltd',
      accountNumber: '1000987654321',
      maskedAccountNumber: '******4321',
      sellerBusinessName: 'Apex Auto Spare Parts',
      suborderNumber: 'ORD-20261118-0001-01',
      amountDueInCents: 2550000,
    };

    render(
      <BankInstructionsModal
        isOpen={true}
        onClose={vi.fn()}
        instructions={mockInstructions}
        onUploadReceiptClick={vi.fn()}
      />
    );

    expect(screen.getByText('Direct Bank Deposit Instructions')).toBeDefined();
    expect(screen.getByText('Commercial Bank of Ceylon')).toBeDefined();
    expect(screen.getByText('Kollupitiya Branch')).toBeDefined();
    expect(screen.getByText('1000987654321')).toBeDefined();
    expect(screen.getByText(/25,500/)).toBeDefined(); // 25,500.00 LKR
  });

  it('Customer ReceiptUploadDrawer validates file and submits multipart form data', async () => {
    const handleSuccess = vi.fn();
    const handleClose = vi.fn();

    vi.mocked(orderApi.uploadReceipt).mockResolvedValueOnce({
      success: true,
      data: {
        _id: 'slip-01',
        suborderId: 'sub-01',
        sellerId: 'sel-01',
        customerId: 'cust-101',
        receiptUrl: '/storage/private/receipts/mock.png',
        originalFilename: 'bank_deposit_slip.png',
        fileSize: 102400,
        mimeType: 'image/png',
        verificationStatus: 'PENDING',
        submittedAt: new Date().toISOString(),
      },
    });

    render(
      <ReceiptUploadDrawer
        isOpen={true}
        onClose={handleClose}
        suborderId="sub-01"
        suborderNumber="ORD-20261118-0001-01"
        amountDueInCents={2550000}
        onUploadSuccess={handleSuccess}
      />
    );

    expect(screen.getByText('Upload Bank Deposit Slip')).toBeDefined();

    // Select valid image file
    const file = new File(['mock content'], 'bank_slip.png', { type: 'image/png' });
    const fileInput = document.getElementById('receipt-file-input') as HTMLInputElement;

    fireEvent.change(fileInput, { target: { files: [file] } });

    // Fill optional transfer reference
    fireEvent.change(screen.getByPlaceholderText('e.g. TXN987654321 or Bank Slip #'), {
      target: { value: 'TXN-COM-991122' },
    });

    // Submit form
    fireEvent.click(screen.getByText('Submit Deposit Slip'));

    await waitFor(() => {
      expect(orderApi.uploadReceipt).toHaveBeenCalledTimes(1);
    });

    const [calledSubId, calledFormData] = vi.mocked(orderApi.uploadReceipt).mock.calls[0];
    expect(calledSubId).toBe('sub-01');
    expect(calledFormData.get('transferReference')).toBe('TXN-COM-991122');
  });

  it('Seller ReceiptReviewModal allows approving valid customer receipt', async () => {
    vi.mocked(sellerOrderApi.getSellerSuborderReceipt).mockResolvedValueOnce({
      success: true,
      data: {
        slip: {
          _id: 'slip-01',
          suborderId: 'sub-01',
          sellerId: 'sel-01',
          customerId: 'cust-101',
          receiptUrl: '/storage/private/receipts/slip.png',
          originalFilename: 'customer_payment.png',
          fileSize: 154000,
          mimeType: 'image/png',
          transferReference: 'TXN-778899',
          depositedAmountInCents: 2550000,
          depositDate: '2026-11-18',
          verificationStatus: 'PENDING',
          submittedAt: new Date().toISOString(),
        },
        downloadToken: 'valid-stream-token-xyz',
      },
    });

    vi.mocked(sellerOrderApi.verifyReceipt).mockResolvedValueOnce({
      success: true,
      data: {
        suborder: {} as any,
        slip: {} as any,
      },
    });

    // Mock window.confirm
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    const onDecision = vi.fn();
    const onClose = vi.fn();

    render(
      <ReceiptReviewModal
        isOpen={true}
        onClose={onClose}
        suborderId="sub-01"
        suborderNumber="ORD-20261118-0001-01"
        onDecisionComplete={onDecision}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('customer_payment.png')).toBeDefined();
      expect(screen.getByText('TXN-778899')).toBeDefined();
    });

    // Verify stream link
    const viewDocLink = screen.getByText('View Document').closest('a');
    expect(viewDocLink?.getAttribute('href')).toBe('http://mock-api/stream?token=valid-stream-token-xyz');

    // Click Approve Payment
    fireEvent.click(screen.getByText('Approve Payment'));

    await waitFor(() => {
      expect(sellerOrderApi.verifyReceipt).toHaveBeenCalledWith('sub-01', {
        action: 'APPROVE',
      });
      expect(onDecision).toHaveBeenCalledTimes(1);
    });
  });

  it('Seller ReceiptReviewModal enforces mandatory reason when rejecting slip', async () => {
    vi.mocked(sellerOrderApi.getSellerSuborderReceipt).mockResolvedValueOnce({
      success: true,
      data: {
        slip: {
          _id: 'slip-01',
          suborderId: 'sub-01',
          sellerId: 'sel-01',
          customerId: 'cust-101',
          receiptUrl: '/storage/private/receipts/slip.png',
          originalFilename: 'customer_payment.png',
          fileSize: 154000,
          mimeType: 'image/png',
          transferReference: 'TXN-INVALID',
          depositedAmountInCents: 100000,
          depositDate: '2026-11-18',
          verificationStatus: 'PENDING',
          submittedAt: new Date().toISOString(),
        },
        downloadToken: 'valid-stream-token-xyz',
      },
    });

    vi.mocked(sellerOrderApi.verifyReceipt).mockResolvedValueOnce({
      success: true,
      data: {
        suborder: {} as any,
        slip: {} as any,
      },
    });

    const onDecision = vi.fn();

    render(
      <ReceiptReviewModal
        isOpen={true}
        onClose={vi.fn()}
        suborderId="sub-01"
        suborderNumber="ORD-20261118-0001-01"
        onDecisionComplete={onDecision}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('customer_payment.png')).toBeDefined();
    });

    // Click Reject Slip to toggle rejection mode
    fireEvent.click(screen.getByText('Reject Slip'));

    expect(screen.getByText('State Reason for Rejection')).toBeDefined();

    // Fill rejection reason
    fireEvent.change(
      screen.getByPlaceholderText(
        'e.g. Deposited amount does not match, receipt illegible, incorrect merchant account...'
      ),
      { target: { value: 'Transferred amount (Rs 1,000) does not match suborder total (Rs 25,500).' } }
    );

    // Confirm rejection
    fireEvent.click(screen.getByText('Confirm Rejection'));

    await waitFor(() => {
      expect(sellerOrderApi.verifyReceipt).toHaveBeenCalledWith('sub-01', {
        action: 'REJECT',
        rejectionReason:
          'Transferred amount (Rs 1,000) does not match suborder total (Rs 25,500).',
      });
      expect(onDecision).toHaveBeenCalledTimes(1);
    });
  });
});
