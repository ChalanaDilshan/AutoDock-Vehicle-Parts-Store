import React, { useState } from 'react';
import { Building2, Copy, Check, Upload } from 'lucide-react';
import { BankTransferInstructions } from '../api/ordersDeliveryApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';
import { Button, Modal } from '../../../shared/components/index.js';

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
  const [copied, setCopied] = useState(false);

  if (!isOpen || !instructions) return null;

  const handleCopyAccount = () => {
    navigator.clipboard?.writeText(instructions.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Direct Bank Deposit Instructions"
      subtitle={`${instructions.sellerBusinessName} · Order ${instructions.suborderNumber}`}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {onUploadReceiptClick && (
            <Button
              variant="primary"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => {
                onClose();
                onUploadReceiptClick();
              }}
            >
              Upload Deposit Slip
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-slate-600">Amount Due</span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">
            {formatLKR(instructions.amountDueInCents)}
          </span>
        </div>

        <dl className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200 text-sm">
          <div className="p-3.5 flex items-center justify-between gap-2">
            <dt className="text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-slate-400" />
              <span>Bank</span>
            </dt>
            <dd className="font-semibold text-slate-900">{instructions.bankName}</dd>
          </div>
          <div className="p-3.5 flex items-center justify-between gap-2">
            <dt className="text-slate-500">Branch</dt>
            <dd className="font-medium text-slate-900">{instructions.branchName}</dd>
          </div>
          <div className="p-3.5 flex items-center justify-between gap-2">
            <dt className="text-slate-500">Account Holder</dt>
            <dd className="font-medium text-slate-900">{instructions.accountHolderName}</dd>
          </div>
          <div className="p-3.5 flex items-center justify-between gap-2">
            <dt className="text-slate-500">Account Number</dt>
            <dd className="flex items-center gap-2">
              <span className="font-mono font-semibold text-slate-900">
                {instructions.accountNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyAccount}
                className="inline-flex items-center gap-1 px-2 py-1 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </dd>
          </div>
        </dl>

        <p className="text-xs text-slate-600 leading-relaxed">
          Include <span className="font-mono font-medium text-slate-900">{instructions.suborderNumber}</span> as the deposit reference, then upload a photo or PDF of your bank slip so the seller can confirm and ship your parts.
        </p>
      </div>
    </Modal>
  );
};
