import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Building2, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { publicFinanceApi, PlatformBankSettings } from '../api/financePromotionsApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';

interface InvoiceBankInstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceNumber: string;
  outstandingBalanceInCents: number;
  onOpenUpload?: () => void;
}

export const InvoiceBankInstructionsModal: React.FC<InvoiceBankInstructionsModalProps> = ({
  isOpen,
  onClose,
  invoiceNumber,
  outstandingBalanceInCents,
  onOpenUpload,
}) => {
  const [bankSettings, setBankSettings] = useState<PlatformBankSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const [copiedReference, setCopiedReference] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchSettings = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await publicFinanceApi.getPlatformBankAccount();
        if (res.success && res.data) {
          setBankSettings(res.data);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve platform bank payment instructions.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSettings();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopyAccount = () => {
    if (bankSettings?.accountNumber) {
      navigator.clipboard.writeText(bankSettings.accountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2000);
    }
  };

  const handleCopyReference = () => {
    navigator.clipboard.writeText(invoiceNumber);
    setCopiedReference(true);
    setTimeout(() => setCopiedReference(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">AutoDock Bank Payment Instructions</h3>
              <p className="text-xs text-slate-500">Official Commission Settlement Account</p>
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

        {/* Invoice Summary Card */}
        <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-600 block">Settling Invoice</span>
            <strong className="font-bold text-blue-950 font-mono text-sm">{invoiceNumber}</strong>
          </div>
          <div className="text-right">
            <span className="text-slate-600 block">Outstanding Amount</span>
            <strong className="font-extrabold text-blue-900 text-sm">{formatLKR(outstandingBalanceInCents)}</strong>
          </div>
        </div>

        {isLoading ? (
          <div className="py-8 flex flex-col items-center justify-center gap-2 text-slate-500 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading corporate bank instructions...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl text-xs space-y-1">
            <strong>Error loading instructions</strong>
            <p>{error}</p>
          </div>
        ) : bankSettings ? (
          <div className="space-y-4">
            {/* Account Details */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Beneficiary / Account Holder</span>
                <span className="font-bold text-slate-900 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {bankSettings.accountHolderName}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bank Name</span>
                <span className="font-semibold text-slate-900">{bankSettings.bankName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Branch Name</span>
                <span className="font-semibold text-slate-900">
                  {bankSettings.branchName} {bankSettings.branchCode ? `(${bankSettings.branchCode})` : ''}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-slate-900">{bankSettings.accountNumber}</span>
                  <button
                    onClick={handleCopyAccount}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
                    title="Copy Account Number"
                  >
                    {copiedAccount ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <span className="text-slate-500 font-medium">Payment Reference (Required)</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                    {invoiceNumber}
                  </span>
                  <button
                    onClick={handleCopyReference}
                    className="p-1 hover:bg-slate-200 rounded text-slate-600 transition"
                    title="Copy Reference"
                  >
                    {copiedReference ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Platform Instructions Box */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Notice for AutoDock Merchants</span>
              </div>
              <p className="leading-relaxed">{bankSettings.paymentInstructions}</p>
            </div>
          </div>
        ) : null}

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
          {onOpenUpload && (
            <button
              onClick={() => {
                onClose();
                onOpenUpload();
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Upload Payment Slip
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
