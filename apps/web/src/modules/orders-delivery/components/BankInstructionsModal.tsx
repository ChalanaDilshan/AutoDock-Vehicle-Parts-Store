import React, { useState } from 'react';
import { X, Copy, Check, Building2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { BankTransferInstructions } from '../api/ordersDeliveryApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';

interface BankInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  instructions: BankTransferInstructions | null;
  onUploadReceiptClick?: () => void;
}

export const BankInstructionsModal: React.FC<BankInstructionsModalProps> = ({
  isOpen,
  onClose,
  instructions,
  onUploadReceiptClick,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !instructions) return null;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(instructions.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Direct Bank Deposit Instructions</h3>
              <p className="text-xs text-slate-500">Verified Seller Account for Suborder {instructions.suborderNumber}</p>
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

        {/* Warning Banner */}
        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="w-4 h-4" />
            <span>Important Multi-Vendor Payment Notice</span>
          </div>
          <p className="leading-relaxed">
            AutoDock does not pool funds. You are transferring funds directly to merchant{' '}
            <strong className="font-semibold text-slate-900">{instructions.sellerBusinessName}</strong>. Please quote
            your suborder number as the payment reference.
          </p>
        </div>

        {/* Verified Bank Credentials */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Merchant Store</span>
            <span className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              {instructions.sellerBusinessName}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Bank Name</span>
            <span className="text-xs font-semibold text-slate-900">{instructions.bankName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Branch Name</span>
            <span className="text-xs font-semibold text-slate-900">{instructions.branchName}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">Account Holder</span>
            <span className="text-xs font-semibold text-slate-900">{instructions.accountHolderName}</span>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 block">Account Number</span>
              <span className="text-sm font-mono font-bold text-slate-900 tracking-wider">
                {instructions.accountNumber}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCopyAccount}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition shadow-sm"
              title="Copy account number"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Exact Amount to Remit</span>
            <span className="text-base font-black text-blue-600">
              {formatLKR(instructions.amountDueInCents)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
          >
            Close
          </button>
          {onUploadReceiptClick && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onUploadReceiptClick();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              Upload Deposit Slip Now
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
