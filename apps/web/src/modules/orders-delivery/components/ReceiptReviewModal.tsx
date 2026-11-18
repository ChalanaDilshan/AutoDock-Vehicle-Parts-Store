import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  Hash,
} from 'lucide-react';
import {
  sellerOrderApi,
  orderApi,
  PaymentSlipRecord,
} from '../api/ordersDeliveryApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';

interface ReceiptReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  suborderId: string;
  suborderNumber: string;
  onDecisionComplete: () => void;
}

export const ReceiptReviewModal: React.FC<ReceiptReviewModalProps> = ({
  isOpen,
  onClose,
  suborderId,
  suborderNumber,
  onDecisionComplete,
}) => {
  const [slip, setSlip] = useState<PaymentSlipRecord | null>(null);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [rejectionMode, setRejectionMode] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !suborderId) return;

    const fetchReceipt = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      setRejectionMode(false);
      setRejectionReason('');
      try {
        const response = await sellerOrderApi.getSellerSuborderReceipt(suborderId);
        if (response.success && response.data) {
          setSlip(response.data.slip);
          setDownloadToken(response.data.downloadToken);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to load receipt details for this suborder.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReceipt();
  }, [isOpen, suborderId]);

  if (!isOpen) return null;

  const handleApprove = async () => {
    if (!confirm('Are you sure you want to approve this payment receipt? This will mark the suborder as PAID and unlock fulfillment.')) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await sellerOrderApi.verifyReceipt(suborderId, {
        action: 'APPROVE',
      });
      if (response.success) {
        onDecisionComplete();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to approve receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      setErrorMessage('A detailed rejection reason is required so the customer knows how to proceed.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const response = await sellerOrderApi.verifyReceipt(suborderId, {
        action: 'REJECT',
        rejectionReason: rejectionReason.trim(),
      });
      if (response.success) {
        onDecisionComplete();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reject receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const streamUrl = downloadToken ? orderApi.getReceiptStreamUrl(downloadToken) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Review Customer Deposit Receipt</h3>
            <p className="text-xs text-slate-500">Suborder Reference: {suborderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            aria-label="Close review dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-xs">Loading receipt document...</p>
          </div>
        ) : slip ? (
          <div className="space-y-4">
            {/* Slip Metadata Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reported Amount</span>
                </span>
                <span className="font-bold text-slate-900">
                  {slip.depositedAmountInCents ? formatLKR(slip.depositedAmountInCents) : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deposit Date</span>
                </span>
                <span className="font-semibold text-slate-800">
                  {slip.depositDate ? new Date(slip.depositDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Transfer Reference</span>
                </span>
                <span className="font-mono text-slate-800">
                  {slip.transferReference || 'None Provided'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-slate-500">Review Status</span>
                <span className="font-bold uppercase tracking-wider text-[11px] text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {slip.verificationStatus}
                </span>
              </div>
            </div>

            {/* Document Preview Link */}
            <div className="p-3.5 bg-blue-50/60 border border-blue-200/60 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <span className="font-semibold text-slate-900 block truncate max-w-[220px]">
                    {slip.originalFilename}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    {(slip.fileSize / 1024).toFixed(1)} KB • {slip.mimeType}
                  </span>
                </div>
              </div>
              {streamUrl && (
                <a
                  href={streamUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition shadow-sm"
                >
                  <span>View Document</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            {/* Rejection Form Mode */}
            {rejectionMode ? (
              <form onSubmit={handleReject} className="space-y-3 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-red-700">
                  State Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Deposited amount does not match, receipt illegible, incorrect merchant account..."
                  rows={3}
                  required
                  className="w-full px-3 py-2 border border-red-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectionMode(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !rejectionReason.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    <span>Confirm Rejection</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setRejectionMode(true)}
                  disabled={isSubmitting}
                  className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span>Reject Slip</span>
                </button>
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Approve Payment</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No customer deposit slip has been submitted for this suborder yet.
          </div>
        )}
      </div>
    </div>
  );
};
