import React, { useState } from 'react';
import { SellerProfileData } from '../../api/identityApi.js';
import { Alert, Button, Modal, Select } from '../../../../shared/components/index.js';

interface VerificationDecisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: SellerProfileData;
  onConfirm: (payload: {
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
    verificationMethod?: 'PHYSICAL_VISIT' | 'WHATSAPP_VIDEO_CALL' | 'DOCUMENT_ONLY';
    verificationNotes: string;
  }) => Promise<void>;
}

export const VerificationDecisionModal: React.FC<VerificationDecisionModalProps> = ({
  isOpen,
  onClose,
  seller,
  onConfirm,
}) => {
  const isPhysical = seller.sellerType === 'PHYSICAL_STORE';

  const [decision, setDecision] = useState<'APPROVE' | 'REJECT' | 'REQUEST_INFO'>('APPROVE');
  const [verificationMethod, setVerificationMethod] = useState<
    'PHYSICAL_VISIT' | 'WHATSAPP_VIDEO_CALL' | 'DOCUMENT_ONLY'
  >(isPhysical ? 'PHYSICAL_VISIT' : 'WHATSAPP_VIDEO_CALL');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (verificationNotes.trim().length < 5) {
      setErrorMessage('Please enter verification notes (min 5 characters).');
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        decision,
        verificationMethod: decision === 'APPROVE' ? verificationMethod : undefined,
        verificationNotes: verificationNotes.trim(),
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to record verification decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record Verification Decision"
      subtitle={`${seller.businessName} (${seller.sellerType === 'PHYSICAL_STORE' ? 'Physical Store' : 'Online Merchant'})`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {[
            { value: 'APPROVE' as const, label: 'Approve' },
            { value: 'REQUEST_INFO' as const, label: 'Request Info' },
            { value: 'REJECT' as const, label: 'Reject' },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDecision(opt.value)}
              className={`py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${
                decision === opt.value
                  ? opt.value === 'APPROVE'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : opt.value === 'REQUEST_INFO'
                      ? 'border-amber-600 bg-amber-50 text-amber-800'
                      : 'border-rose-600 bg-rose-50 text-rose-800'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {decision === 'APPROVE' && (
          <Select
            label="Verification Method Used"
            value={verificationMethod}
            onChange={(e) => setVerificationMethod(e.target.value as any)}
            options={[
              { value: 'PHYSICAL_VISIT', label: 'Physical Inspection Visit' },
              { value: 'WHATSAPP_VIDEO_CALL', label: 'WhatsApp Video Call Verification' },
              { value: 'DOCUMENT_ONLY', label: 'Document Audit Only' },
            ]}
          />
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            Verification Notes <span className="text-rose-600">*</span>
          </label>
          <textarea
            rows={4}
            required
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="Record inspection findings, requested changes, or approval remarks..."
            className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-[#E11D30] focus:outline-none"
          />
        </div>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={decision === 'REJECT' ? 'danger' : 'primary'}
            isLoading={isSubmitting}
          >
            Submit Decision
          </Button>
        </div>
      </form>
    </Modal>
  );
};
