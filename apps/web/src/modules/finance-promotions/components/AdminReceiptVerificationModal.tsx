import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { adminFinanceApi, InvoicePaymentReceipt } from '../api/financePromotionsApi.js';
import { formatLKR, centsToRupees, rupeesToCents } from '../../customer-experience/utils/formatters.js';

interface AdminReceiptVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  receipt: InvoicePaymentReceipt | null;
  onDecisionComplete: () => void;
}

export const AdminReceiptVerificationModal: React.FC<AdminReceiptVerificationModalProps> = ({
  isOpen,
  onClose,
  receipt,
  onDecisionComplete,
}) => {
  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [bankReference, setBankReference] = useState<string>('');
  const [verifiedRupees, setVerifiedRupees] = useState<number>(0);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Initialize form state when receipt changes
  React.useEffect(() => {
    if (receipt) {
      setDecision(null);
      setBankReference('');
      setVerifiedRupees(centsToRupees(receipt.claimedAmountInCents));
      setRejectionReason('');
      setAdminNotes('');
      setErrorMessage(null);
    }
  }, [receipt]);

  if (!isOpen || !receipt) return null;

  const invoiceObj = typeof receipt.invoiceId === 'object' ? receipt.invoiceId : null;
  const sellerObj = typeof receipt.sellerId === 'object' ? receipt.sellerId : null;
  const invoiceIdStr = invoiceObj?._id || (receipt.invoiceId as string);

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankReference.trim()) {
      setErrorMessage('Bank transaction reference is required to verify and approve payment.');
      return;
    }

    const verifiedCents = rupeesToCents(verifiedRupees);
    if (verifiedCents <= 0) {
      setErrorMessage('Verified deposit amount must be greater than zero.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await adminFinanceApi.verifyPaymentReceipt(invoiceIdStr, receipt._id, {
        action: 'APPROVE',
        depositedAmountInCents: verifiedCents,
        bankTransactionReference: bankReference.trim(),
        adminNotes: adminNotes.trim() || undefined,
      });

      if (res.success) {
        onDecisionComplete();
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to approve payment receipt.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while approving receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim() || rejectionReason.trim().length < 5) {
      setErrorMessage('Rejection reason (min 5 characters) is required to reject payment receipt.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await adminFinanceApi.verifyPaymentReceipt(invoiceIdStr, receipt._id, {
        action: 'REJECT',
        rejectionReason: rejectionReason.trim(),
        adminNotes: adminNotes.trim() || undefined,
      });

      if (res.success) {
        onDecisionComplete();
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to reject payment receipt.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while rejecting receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const streamUrl = `/api/v1/seller/finance/invoices/${invoiceIdStr}/receipts/${receipt._id}/view`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10 max-h-[90vh] overflow-y-auto animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Verify Seller Invoice Payment</h3>
              <p className="text-xs text-slate-500">
                Invoice: {invoiceObj?.invoiceNumber || invoiceIdStr}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Invoice and Seller Context Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-700 block">Seller Information</span>
            <div className="flex justify-between">
              <span className="text-slate-500">Store / Business:</span>
              <span className="font-semibold text-slate-900">
                {sellerObj?.businessName || sellerObj?.storeName || 'Merchant'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Contact Phone:</span>
              <span className="text-slate-700">{sellerObj?.contactPhone || 'N/A'}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
            <span className="font-bold text-slate-700 block">Invoice Balances</span>
            <div className="flex justify-between">
              <span className="text-slate-500">Gross Invoiced:</span>
              <span className="font-semibold text-slate-900">
                {formatLKR(invoiceObj?.grossCommissionInCents || 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Outstanding:</span>
              <span className="font-bold text-rose-700">
                {formatLKR(invoiceObj?.outstandingBalanceInCents || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Submission Details & Receipt Preview Action */}
        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 text-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-950 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" />
              <span>Claimed Deposit Receipt</span>
            </span>
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-blue-50 border border-blue-300 rounded-lg text-blue-700 font-bold transition shadow-2xs"
            >
              <span>View Confidential Receipt</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-200/60">
            <div>
              <span className="text-slate-500 block">Claimed Amount:</span>
              <strong className="text-slate-900 text-sm">
                {formatLKR(receipt.claimedAmountInCents)}
              </strong>
            </div>
            <div>
              <span className="text-slate-500 block">Deposit Date:</span>
              <span className="text-slate-800 font-medium">
                {new Date(receipt.depositDate).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Original File:</span>
              <span className="text-slate-800 truncate block font-medium" title={receipt.originalFileName}>
                {receipt.originalFileName}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">File Size:</span>
              <span className="text-slate-800 font-medium">
                {(receipt.fileSizeBytes / 1024).toFixed(0)} KB
              </span>
            </div>
          </div>
        </div>

        {/* Decision Selector Buttons */}
        {!decision && (
          <div className="pt-2 space-y-3">
            <span className="text-xs font-bold text-slate-700 block">Select Audit Action:</span>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setDecision('APPROVE')}
                className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Approve & Credit Payment</span>
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className="p-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded-xl text-rose-800 font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Reject Deposit Slip</span>
              </button>
            </div>
          </div>
        )}

        {/* APPROVE Form */}
        {decision === 'APPROVE' && (
          <form onSubmit={handleApproveSubmit} className="space-y-4 pt-2 border-t border-slate-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Approving Payment & Crediting Invoice</span>
              </span>
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Change Action
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank Transaction Reference *
                </label>
                <input
                  type="text"
                  placeholder="e.g. BOC-TXN-1029384"
                  value={bankReference}
                  onChange={(e) => setBankReference(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Verified Deposit Amount (LKR) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={verifiedRupees}
                  onChange={(e) => setVerifiedRupees(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Internal Administrative Notes (Optional)
              </label>
              <textarea
                placeholder="Optional notes for audit log..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Confirming Approval...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirm Approval</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* REJECT Form */}
        {decision === 'REJECT' && (
          <form onSubmit={handleRejectSubmit} className="space-y-4 pt-2 border-t border-slate-200 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-800 flex items-center gap-1.5">
                <XCircle className="w-4 h-4 text-rose-600" />
                <span>Rejecting Payment Receipt</span>
              </span>
              <button
                type="button"
                onClick={() => setDecision(null)}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Change Action
              </button>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Rejection Reason (Required, min 5 chars — Sent to Seller) *
              </label>
              <textarea
                placeholder="e.g. Deposit slip illegible; transaction reference not found on bank statement..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                required
                minLength={5}
                rows={3}
                className="w-full px-3 py-2 border border-rose-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Internal Administrative Notes (Optional)
              </label>
              <textarea
                placeholder="Optional notes for audit log..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={2}
                maxLength={500}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Rejecting Slip...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Confirm Rejection</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
