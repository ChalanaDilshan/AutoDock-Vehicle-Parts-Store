import React, { useState } from 'react';
import {
  X,
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { sellerFinanceApi } from '../api/financePromotionsApi.js';
import { formatLKR, centsToRupees, rupeesToCents } from '../../customer-experience/utils/formatters.js';

interface InvoiceReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  outstandingBalanceInCents: number;
  onUploadSuccess: () => void;
}

export const InvoiceReceiptUploadModal: React.FC<InvoiceReceiptUploadModalProps> = ({
  isOpen,
  onClose,
  invoiceId,
  invoiceNumber,
  outstandingBalanceInCents,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [claimedRupees, setClaimedRupees] = useState<number>(
    centsToRupees(outstandingBalanceInCents)
  );
  const [depositDate, setDepositDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(selected.type)) {
        setErrorMessage('Invalid file format. Only JPG, PNG, WebP or PDF are accepted.');
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setErrorMessage('File size exceeds the 5MB maximum limit.');
        return;
      }

      setFile(selected);

      // Convert to Base64 for upload payload
      const reader = new FileReader();
      reader.onload = () => {
        const resultStr = reader.result as string;
        // Strip data:mime;base64, prefix if present
        const base64Data = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
        setFileBase64(base64Data);
      };
      reader.onerror = () => {
        setErrorMessage('Failed to read file contents. Please try again.');
      };
      reader.readAsDataURL(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a bank transfer deposit receipt file.');
      return;
    }

    const claimedInCents = rupeesToCents(claimedRupees);
    if (claimedInCents <= 0) {
      setErrorMessage('Claimed transfer amount must be greater than Rs. 0.00.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      const response = await sellerFinanceApi.uploadReceipt(invoiceId, {
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        fileContentBase64: fileBase64 || undefined,
        claimedAmountInCents: claimedInCents,
        depositDate: depositDate || new Date().toISOString(),
      });

      if (response.success) {
        setSuccessMessage(
          'Bank transfer receipt submitted successfully. Status is now PENDING administrator verification.'
        );
        setTimeout(() => {
          onUploadSuccess();
          onClose();
        }, 1500);
      } else {
        setErrorMessage(response.message || 'Failed to submit payment receipt.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while uploading your receipt.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Upload Invoice Payment Slip</h3>
              <p className="text-xs text-slate-500">Invoice: {invoiceNumber}</p>
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

        {/* Financial Disclaimer Banner */}
        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Verification Policy Notice</span>
          </div>
          <p className="leading-relaxed">
            Uploading a deposit slip submits it for administrative verification. It{' '}
            <strong className="font-semibold text-slate-900">does not</strong> mark the invoice as
            paid or deduct balance until confirmed by AutoDock Finance.
          </p>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Outstanding Context */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-600">Current Outstanding Balance:</span>
            <span className="font-bold text-blue-900 font-mono text-sm">
              {formatLKR(outstandingBalanceInCents)}
            </span>
          </div>

          {/* Amount Paid Field */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Transferred Amount (LKR) *
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={claimedRupees}
              onChange={(e) => setClaimedRupees(parseFloat(e.target.value) || 0)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* Deposit Date */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Bank Deposit / Transfer Date *
            </label>
            <input
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              required
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* File Picker */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Transfer Slip Document (JPG, PNG, WebP, PDF &lt; 5MB) *
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition">
              <input
                type="file"
                id="receiptFile"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="receiptFile" className="cursor-pointer block space-y-1">
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>{file.name}</span>
                    <span className="text-[10px] text-slate-400">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                ) : (
                  <>
                    <UploadCloud className="w-7 h-7 mx-auto text-slate-400" />
                    <p className="text-xs text-slate-600 font-semibold">
                      Click to choose or browse deposit receipt
                    </p>
                    <p className="text-[10px] text-slate-400">PDF, PNG, JPG or WebP up to 5MB</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Receipt...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Submit for Review</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
