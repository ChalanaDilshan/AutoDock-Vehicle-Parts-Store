import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { SellerProfileData } from '../../api/identityApi.js';
import { Alert, Button, Modal } from '../../../../shared/components/index.js';

interface BankVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: SellerProfileData;
  onConfirm: (payload: {
    decision: 'VERIFY' | 'REJECT';
    rejectionReason?: string;
  }) => Promise<void>;
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

  const bank = seller.bankDetails;
  if (!bank) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (decision === 'REJECT' && rejectionReason.trim().length < 5) {
      setValidationError('Provide a reason explaining why bank details were rejected.');
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
      setValidationError(err?.message || 'Unable to verify bank details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Audit Bank Account Details"
      subtitle={seller.businessName}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 font-semibold text-slate-900 pb-1 border-b border-slate-200">
            <Building2 className="w-4 h-4 text-slate-500" />
            <span>{bank.bankName}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-500 block">Account Holder</span>
              <span className="font-medium text-slate-900">{bank.accountHolderName}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Branch</span>
              <span className="font-medium text-slate-900">{bank.branchName}</span>
            </div>
            <div className="col-span-2">
              <span className="text-slate-500 block">Masked Account Number</span>
              <span className="font-mono font-semibold text-slate-900">
                {bank.maskedAccountNumber}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDecision('VERIFY')}
            className={`py-2 px-3 rounded-lg border text-sm font-medium ${
              decision === 'VERIFY'
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Verify Account
          </button>
          <button
            type="button"
            onClick={() => setDecision('REJECT')}
            className={`py-2 px-3 rounded-lg border text-sm font-medium ${
              decision === 'REJECT'
                ? 'border-rose-600 bg-rose-50 text-rose-800'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            Reject Account
          </button>
        </div>

        {decision === 'REJECT' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Rejection Reason *
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain discrepancy in account holder name or branch..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-[#E11D30] focus:outline-none"
            />
          </div>
        )}

        {validationError && <Alert variant="danger">{validationError}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={decision === 'VERIFY' ? 'primary' : 'danger'}
            isLoading={isSubmitting}
          >
            {decision === 'VERIFY' ? 'Confirm Verification' : 'Reject Bank Details'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
