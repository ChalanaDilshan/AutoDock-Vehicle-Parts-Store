import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import { sellerFinanceApi } from '../api/financePromotionsApi.js';
import {
  centsToRupees,
  rupeesToCents,
} from '../../customer-experience/utils/formatters.js';
import { Alert, Button, Input, Modal } from '../../../shared/components/index.js';

interface InvoiceReceiptUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceId: string;
  invoiceNumber: string;
  outstandingBalanceInCents: number;
  onUploadSuccess: () => void;
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'application/pdf'];

export const InvoiceReceiptUploadModal: React.FC<
  InvoiceReceiptUploadModalProps
> = ({
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setClaimedRupees(centsToRupees(outstandingBalanceInCents));
    setErrorMessage(null);
    setFile(null);
    setFileBase64(null);
  }, [outstandingBalanceInCents, isOpen]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setErrorMessage(null);

    if (!ALLOWED_MIME_TYPES.includes(selected.type)) {
      setErrorMessage(
        'Invalid file format. Please upload a JPG, PNG, or PDF deposit slip.'
      );
      setFile(null);
      return;
    }

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMessage('File exceeds maximum allowed size of 5MB.');
      setFile(null);
      return;
    }

    setFile(selected);
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      setFileBase64(res.includes(',') ? res.split(',')[1] : res);
    };
    reader.readAsDataURL(selected);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!file) {
      setErrorMessage('Please select a bank transfer receipt file.');
      return;
    }
    if (!claimedRupees || claimedRupees <= 0) {
      setErrorMessage('Please enter a valid deposit amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      await sellerFinanceApi.uploadReceipt(invoiceId, {
        fileName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        fileContentBase64: fileBase64 || undefined,
        claimedAmountInCents: rupeesToCents(claimedRupees),
        depositDate,
      });
      onUploadSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload invoice payment slip.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Invoice Payment Slip"
      subtitle={`Invoice ${invoiceNumber}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 text-center space-y-2">
          <input
            id="invoice-receipt-file"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label
            htmlFor="invoice-receipt-file"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{file ? file.name : 'Choose Deposit Slip (JPG, PNG, PDF)'}</span>
          </label>
          <p className="text-xs text-slate-500">Maximum size 5MB</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Claimed Amount (LKR)"
            type="number"
            min={1}
            step="0.01"
            required
            value={claimedRupees}
            onChange={(e) => setClaimedRupees(Number(e.target.value))}
          />
          <Input
            label="Deposit Date"
            type="date"
            required
            value={depositDate}
            onChange={(e) => setDepositDate(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Submit Payment Slip
          </Button>
        </div>
      </form>
    </Modal>
  );
};
