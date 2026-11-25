import React, { useState } from 'react';
import { Upload } from 'lucide-react';
import { orderApi } from '../api/ordersDeliveryApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';
import { Alert, Button, Input, Modal } from '../../../shared/components/index.js';

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
  const [transferReference, setTransferReference] = useState('');
  const [depositDate, setDepositDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setErrorMessage(null);

    if (selected.size > 5 * 1024 * 1024) {
      setErrorMessage('File size must be under 5MB.');
      return;
    }
    setFile(selected);
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
    formData.append('depositedAmountInCents', amountDueInCents.toString());

    try {
      const response = await orderApi.uploadReceipt(suborderId, formData);
      if (response.success) {
        setSuccessMessage('Deposit slip uploaded and sent to the seller for review.');
        setTimeout(() => {
          onUploadSuccess();
          onClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to upload deposit receipt. Please retry.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Upload Bank Deposit Slip"
      subtitle={`Suborder ${suborderNumber} · Due ${formatLKR(amountDueInCents)}`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
        {successMessage && <Alert variant="success">{successMessage}</Alert>}

        <div className="bg-slate-50 border border-dashed border-slate-300 rounded-lg p-4 text-center space-y-2">
          <input
            id="receipt-file-input"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <label
            htmlFor="receipt-file-input"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>{file ? file.name : 'Choose Deposit Slip (JPG, PNG, PDF)'}</span>
          </label>
          <p className="text-xs text-slate-500">Maximum file size 5MB</p>
        </div>

        <Input
          label="Transfer / Slip Reference"
          value={transferReference}
          onChange={(e) => setTransferReference(e.target.value)}
          placeholder="e.g. TXN987654321 or Bank Slip #"
        />

        <Input
          label="Deposit Date"
          type="date"
          value={depositDate}
          onChange={(e) => setDepositDate(e.target.value)}
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isUploading}>
            Submit Deposit Slip
          </Button>
        </div>
      </form>
    </Modal>
  );
};
