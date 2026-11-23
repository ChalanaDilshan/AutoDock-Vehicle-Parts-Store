import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
} from 'lucide-react';
import {
  adminFinanceApi,
} from '../../api/financePromotionsApi.js';

export const AdminPlatformBankSettingsPage: React.FC = () => {
  const [bankName, setBankName] = useState<string>('');
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [branchName, setBranchName] = useState<string>('');
  const [branchCode, setBranchCode] = useState<string>('');
  const [paymentInstructions, setPaymentInstructions] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSettings = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminFinanceApi.getPlatformBankSettings();
      if (res.success && res.data?.settings) {
        const s = res.data.settings;
        setBankName(s.bankName);
        setAccountHolderName(s.accountHolderName);
        setAccountNumber(s.accountNumber);
        setBranchName(s.branchName);
        setBranchCode(s.branchCode || '');
        setPaymentInstructions(s.paymentInstructions);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch platform bank account settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!confirm('Are you sure you want to update platform corporate bank details? All merchants settling invoices will see these updated instructions.')) {
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await adminFinanceApi.updatePlatformBankSettings({
        bankName: bankName.trim(),
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        branchName: branchName.trim(),
        branchCode: branchCode.trim() || undefined,
        paymentInstructions: paymentInstructions.trim(),
      });

      if (res.success) {
        setSuccessMessage('AutoDock corporate bank details updated successfully.');
      } else {
        setErrorMessage(res.message || 'Failed to update bank account settings.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while saving bank settings.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Platform Bank Account Settings
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
              Corporate Account
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure authoritative bank transfer instructions shown to sellers for commission payment settlements.
          </p>
        </div>

        <Link
          to="/admin/finance"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <span>← Back to Finance Overview</span>
        </Link>
      </div>

      {/* Information Notice */}
      <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="font-bold">Authoritative Receiving Account</span>
          <p className="text-blue-800 leading-relaxed text-[11px]">
            These bank credentials represent AutoDock Marketplace (Pvt) Ltd. Merchants transferring
            monthly commission invoice balances will deposit funds to this account.
          </p>
        </div>
      </div>

      {/* Form Feedback */}
      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Settings Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading corporate bank settings...</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Bank of Ceylon"
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Account Holder / Beneficiary *
                </label>
                <input
                  type="text"
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="e.g. AutoDock Marketplace (Pvt) Ltd"
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Account Number *
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Account Number"
                  required
                  maxLength={30}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Branch Name *
                </label>
                <input
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. Corporate Branch, Colombo 01"
                  required
                  maxLength={100}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Branch Code (Optional)
                </label>
                <input
                  type="text"
                  value={branchCode}
                  onChange={(e) => setBranchCode(e.target.value)}
                  placeholder="e.g. 7010"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Merchant Payment Instructions *
              </label>
              <textarea
                value={paymentInstructions}
                onChange={(e) => setPaymentInstructions(e.target.value)}
                rows={3}
                required
                maxLength={1000}
                placeholder="Instructions displayed to merchants when viewing invoice bank transfer modal..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Settings...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Platform Bank Details</span>
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
