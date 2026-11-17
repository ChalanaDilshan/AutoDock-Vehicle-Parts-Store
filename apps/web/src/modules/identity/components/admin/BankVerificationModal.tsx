import React, { useState } from 'react';
import { SellerProfileData } from '../../api/identityApi.js';
import { X, CheckCircle, AlertTriangle, Building2, Loader2 } from 'lucide-react';

interface BankVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: SellerProfileData;
  onConfirm: (payload: { decision: 'VERIFY' | 'REJECT'; rejectionReason?: string }) => Promise<void>;
}

export const BankVerificationModal: React.FC<BankVerificationModalProps> = ({
  isOpen,
  onClose,
  seller,
  onConfirm,
}) => {
  const [decision, setDecision] = useState<'VERIFY' | 'REJECT'>('VERIFY');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen || !seller.bankDetails) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setValidationError('Please specify a rejection reason for the bank account.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        decision,
        rejectionReason: decision === 'REJECT' ? rejectionReason.trim() : undefined,
      });
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to update bank account verification status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bank-verify-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 id="bank-verify-title" className="font-bold text-slate-900 text-sm">
              Review Seller Bank Account
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Bank Summary Details */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-500">Bank Name:</span>
              <span className="font-semibold text-slate-800">{seller.bankDetails.bankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Account Holder:</span>
              <span className="font-semibold text-slate-800">{seller.bankDetails.accountHolderName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Masked Account:</span>
              <span className="font-mono font-semibold text-slate-900">{seller.bankDetails.maskedAccountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Branch:</span>
              <span className="font-semibold text-slate-800">{seller.bankDetails.branchName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Current Status:</span>
              <span className="font-bold text-amber-700">{seller.bankDetails.verificationStatus}</span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 leading-snug">
            Verify that the bank account holder matches the registered Business Name ({seller.businessName}) or registered business proprietor.
          </div>

          {/* Action Decision */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Verification Decision</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDecision('VERIFY')}
                className={`py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  decision === 'VERIFY'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Verify Account
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  decision === 'REJECT'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4" /> Reject Details
              </button>
            </div>
          </div>

          {/* Rejection Note */}
          {decision === 'REJECT' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rejection Reason *
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="E.g., Account holder name does not match the registered business owner."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
          )}

          {validationError && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {validationError}
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded text-xs font-semibold text-white transition flex items-center gap-1.5 ${
                decision === 'VERIFY' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{decision === 'VERIFY' ? 'Confirm Verification' : 'Confirm Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
