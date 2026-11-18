import React, { useState } from 'react';
import { X, UploadCloud, FileText, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { orderApi } from '../api/ordersDeliveryApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';

interface ReceiptUploadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  suborderId: string;
  suborderNumber: string;
  amountDueInCents: number;
  onUploadSuccess: () => void;
}

export const ReceiptUploadDrawer: React.FC<ReceiptUploadDrawerProps> = ({
  isOpen,
  onClose,
  suborderId,
  suborderNumber,
  amountDueInCents,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [transferReference, setTransferReference] = useState<string>('');
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
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(selected.type)) {
        setErrorMessage('Only JPG, PNG or PDF files are accepted.');
        return;
      }
      if (selected.size > 5 * 1024 * 1024) {
        setErrorMessage('File size must not exceed 5MB.');
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage('Please select a bank deposit slip or transfer receipt.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    const formData = new FormData();
    formData.append('receipt', file);
    if (transferReference.trim()) {
      formData.append('transferReference', transferReference.trim());
    }
    if (depositDate) {
      formData.append('depositDate', depositDate);
    }
    // Amount deposited in cents defaults to amount due
    formData.append('depositedAmountInCents', amountDueInCents.toString());

    try {
      const response = await orderApi.uploadReceipt(suborderId, formData);
      if (response.success) {
        setSuccessMessage('Deposit slip uploaded successfully. Sent to merchant for review.');
        setTimeout(() => {
          onUploadSuccess();
          onClose();
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload deposit receipt. Please retry.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer Card */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Upload Bank Deposit Slip</h3>
            <p className="text-xs text-slate-500">Suborder Reference: {suborderNumber}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            aria-label="Close upload dialog"
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

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
            <span className="text-slate-600 font-medium">Suborder Amount Payable</span>
            <span className="font-bold text-slate-900">{formatLKR(amountDueInCents)}</span>
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Receipt Document / Image <span className="text-red-500">*</span>
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center hover:border-blue-500 transition bg-slate-50">
              <input
                type="file"
                id="receipt-file-input"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="receipt-file-input" className="cursor-pointer block space-y-2">
                <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="text-xs font-semibold text-blue-600">
                  {file ? file.name : 'Click to select or drag and drop receipt file'}
                </div>
                <p className="text-[11px] text-slate-400">
                  Supported formats: JPG, PNG, PDF (Max size: 5MB)
                </p>
              </label>
            </div>
            {file && (
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 bg-slate-100 p-2 rounded-lg">
                <FileText className="w-4 h-4 text-blue-600" />
                <span className="truncate flex-1 font-medium">{file.name}</span>
                <span className="text-slate-400 text-[10px]">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            )}
          </div>

          {/* Transfer Reference */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Transfer Reference / Transaction ID (Optional)
            </label>
            <input
              type="text"
              value={transferReference}
              onChange={(e) => setTransferReference(e.target.value)}
              placeholder="e.g. TXN987654321 or Bank Slip #"
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Deposit Date */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Deposit Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={depositDate}
              onChange={(e) => setDepositDate(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading || !file}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading Slip...</span>
                </>
              ) : (
                <span>Submit Deposit Slip</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
