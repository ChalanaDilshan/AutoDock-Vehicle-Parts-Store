import React, { useState } from 'react';
import { SellerProfileData } from '../../api/identityApi.js';
import { X, CheckCircle, AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

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
  >(isPhysical ? 'PHYSICAL_VISIT' : 'DOCUMENT_ONLY');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!notes.trim()) {
      if (decision === 'REJECT') {
        setValidationError('A clear rejection reason is mandatory.');
        return;
      }
      if (decision === 'REQUEST_INFO') {
        setValidationError('Please specify the exact additional information or documents required.');
        return;
      }
      if (decision === 'APPROVE') {
        setValidationError('Verification audit notes are required for compliance tracking.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        decision,
        verificationMethod: decision === 'APPROVE' ? (isPhysical ? verificationMethod : 'DOCUMENT_ONLY') : undefined,
        verificationNotes: notes.trim(),
      });
      onClose();
    } catch (err: any) {
      setValidationError(err?.message || 'Failed to submit verification decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="decision-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 id="decision-modal-title" className="font-bold text-slate-900 text-sm">
            Record Verification Decision: {seller.businessName}
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Decision Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Action Decision</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision('APPROVE')}
                className={`py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  decision === 'APPROVE'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-4 h-4" /> Approve
              </button>
              <button
                type="button"
                onClick={() => setDecision('REQUEST_INFO')}
                className={`py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  decision === 'REQUEST_INFO'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <HelpCircle className="w-4 h-4" /> Request Info
              </button>
              <button
                type="button"
                onClick={() => setDecision('REJECT')}
                className={`py-2 px-3 rounded text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${
                  decision === 'REJECT'
                    ? 'bg-red-600 text-white border-red-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <AlertTriangle className="w-4 h-4" /> Reject
              </button>
            </div>
          </div>

          {/* Verification Method for Physical Stores on Approval */}
          {decision === 'APPROVE' && isPhysical && (
            <div className="bg-blue-50/70 p-3.5 rounded-lg border border-blue-200 space-y-2">
              <label className="block text-xs font-bold text-blue-950">
                Physical Store Verification Method <span className="text-red-500">*</span>
              </label>
              <p className="text-[11px] text-blue-800">
                Physical retail store verification mandates either an on-premise physical inspection or a live WhatsApp video inspection.
              </p>
              <div className="space-y-1.5 pt-1">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="verMethod"
                    value="PHYSICAL_VISIT"
                    checked={verificationMethod === 'PHYSICAL_VISIT'}
                    onChange={() => setVerificationMethod('PHYSICAL_VISIT')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>Physical On-Site Store Inspection Visit</span>
                </label>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-800 cursor-pointer">
                  <input
                    type="radio"
                    name="verMethod"
                    value="WHATSAPP_VIDEO_CALL"
                    checked={verificationMethod === 'WHATSAPP_VIDEO_CALL'}
                    onChange={() => setVerificationMethod('WHATSAPP_VIDEO_CALL')}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span>WhatsApp Live Video Call Verification</span>
                </label>
              </div>
            </div>
          )}

          {/* Decision Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {decision === 'APPROVE' && 'Inspection Audit Notes & Approval Justification *'}
              {decision === 'REQUEST_INFO' && 'Information / Document Corrections Requested *'}
              {decision === 'REJECT' && 'Mandatory Rejection Reason *'}
            </label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                decision === 'APPROVE'
                  ? 'E.g., Premises visited and physical stock verified; valid BR and owner identity matched.'
                  : decision === 'REQUEST_INFO'
                  ? 'E.g., Please upload a clearer photograph of the business registration page 2.'
                  : 'E.g., Provided business registration number could not be validated with Registrar of Companies.'
              }
              className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {validationError && (
            <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded border border-red-200">
              {validationError}
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3 py-1.5 border border-slate-300 rounded text-xs font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-1.5 rounded text-xs font-semibold text-white transition flex items-center gap-1.5 ${
                decision === 'APPROVE'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : decision === 'REQUEST_INFO'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Confirm {decision === 'APPROVE' ? 'Approval' : decision === 'REQUEST_INFO' ? 'Request' : 'Rejection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
