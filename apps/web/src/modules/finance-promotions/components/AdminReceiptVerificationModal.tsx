import React, { useState, useEffect } from 'react';
import { ExternalLink, CheckCircle2, XCircle } from 'lucide-react';
import {
  InvoicePaymentReceipt,
  adminFinanceApi,
} from '../api/financePromotionsApi.js';
import {
  formatLKR,
  centsToRupees,
  rupeesToCents,
} from '../../customer-experience/utils/formatters.js';
import { Alert, Button, Input, Modal } from '../../../shared/components/index.js';

interface AdminReceiptVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: InvoicePaymentReceipt | null;
  onDecisionComplete: () => void;
}

export const AdminReceiptVerificationModal: React.FC<
  AdminReceiptVerificationModalProps
> = ({ isOpen, onClose, receipt, onDecisionComplete }) => {
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [bankReference, setBankReference] = useState('');
  const [verifiedRupees, setVerifiedRupees] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (receipt) {
      setVerifiedRupees(centsToRupees(receipt.claimedAmountInCents));
      setDecision(null);
      setBankReference('');
      setRejectionReason('');
      setAdminNotes('');
      setErrorMessage(null);
    }
  }, [receipt, isOpen]);

  if (!receipt) return null;

  const invoiceObj =
    typeof receipt.invoiceId === 'object' ? receipt.invoiceId : null;
  const invoiceIdStr = invoiceObj ? invoiceObj._id : (receipt.invoiceId as string);
  const sellerObj =
    typeof receipt.sellerId === 'object' ? receipt.sellerId : null;
  const sellerName =
    sellerObj?.businessName || sellerObj?.storeName || 'Seller Store';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!decision) {
      setErrorMessage('Select Approve or Reject before submitting.');
      return;
    }

    if (decision === 'APPROVE' && !bankReference.trim()) {
      setErrorMessage('Enter the bank statement transaction reference.');
      return;
    }

    if (decision === 'REJECT' && rejectionReason.trim().length < 5) {
      setErrorMessage('Rejection reason (min 5 characters) is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminFinanceApi.verifyPaymentReceipt(invoiceIdStr, receipt._id, {
        action: decision,
        depositedAmountInCents:
          decision === 'APPROVE' ? rupeesToCents(verifiedRupees) : undefined,
        bankTransactionReference:
          decision === 'APPROVE' ? bankReference.trim() : undefined,
        rejectionReason:
          decision === 'REJECT' ? rejectionReason.trim() : undefined,
        adminNotes: adminNotes.trim() || undefined,
      });
      onDecisionComplete();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to verify invoice payment receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verify Seller Invoice Payment"
      subtitle={`${sellerName} · ${invoiceObj?.invoiceNumber || ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-600">Claimed Transfer</span>
            <span className="font-bold text-slate-900 tabular-nums">
              {formatLKR(receipt.claimedAmountInCents)}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Slip File: {receipt.originalFileName}</span>
            <a
              href={adminFinanceApi.getReceiptStreamUrl(invoiceIdStr, receipt._id)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-medium text-[#E11D30] hover:underline"
            >
              <span>Inspect Slip</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDecision('APPROVE')}
            className={`py-2 px-3 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-1.5 ${
              decision === 'APPROVE'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve &amp; Credit Payment</span>
          </button>
          <button
            type="button"
            onClick={() => setDecision('REJECT')}
            className={`py-2 px-3 rounded-lg border text-sm font-medium inline-flex items-center justify-center gap-1.5 ${
              decision === 'REJECT'
                ? 'border-rose-600 bg-rose-50 text-rose-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Reject Deposit Slip</span>
          </button>
        </div>

        {decision === 'APPROVE' && (
          <div className="space-y-3">
            <Input
              label="Bank Transaction Reference"
              required
              value={bankReference}
              onChange={(e) => setBankReference(e.target.value)}
              placeholder="e.g. BOC-TXN-1029384"
            />
            <Input
              label="Verified Amount (LKR)"
              type="number"
              min={1}
              step="0.01"
              value={verifiedRupees}
              onChange={(e) => setVerifiedRupees(Number(e.target.value))}
            />
          </div>
        )}

        {decision === 'REJECT' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Deposit slip illegible or reference not found on statement..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none"
            />
          </div>
        )}

        <Input
          label="Admin Notes (Optional)"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          placeholder="Internal reconciliation notes"
        />

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          {decision === 'REJECT' ? (
            <Button type="submit" variant="danger" isLoading={isSubmitting}>
              Confirm Rejection
            </Button>
          ) : (
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Confirm Approval
            </Button>
          )}
        </div>
      </form>
    </Modal>
  );
};
