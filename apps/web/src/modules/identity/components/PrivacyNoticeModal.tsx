import React from 'react';
import { X, ShieldCheck } from 'lucide-react';

interface PrivacyNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  version?: string;
}

export const PRIVACY_NOTICE_V1_2_TEXT = `
AUTODOCK SELLER PRIVACY NOTICE (Version 1.2)

1. Purpose of Collection:
AutoDock collects merchant identity documents (Business Registration Certificate, National Identity Card or Passport, Live Facial Images), operating location information, and financial disbursement details strictly for:
  a) Verifying lawful commercial entity authorization to vend automotive spare parts.
  b) Mitigating fraudulent counterfeit parts circulation across the Sri Lankan marketplace.
  c) Routing direct-to-seller customer bank transfers and managing marketplace commission settlement records.

2. Confidentiality & Restricted Access:
Identity verification documents and bank details are classified as Strictly Confidential. They are:
  - Accessible solely by authorized AutoDock administrative verification personnel.
  - Never displayed on public storefront listings or exposed via public APIs.
  - Stored in access-controlled private storage with time-limited viewing credentials.

3. Seller Bank Account Verification:
Bank details provided during onboarding undergo mandatory administrative review. They remain in an unverified state and cannot be used for customer bank-transfer payments until formally validated against your Business Registration records.

4. Right to Information & Corrections:
You retain the right to inspect your uploaded business profile information and resubmit corrected verification documentation when formally requested by marketplace administrators.
`;

export const PrivacyNoticeModal: React.FC<PrivacyNoticeModalProps> = ({
  isOpen,
  onClose,
  version = 'v1.2',
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="privacy-modal-title"
    >
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h3 id="privacy-modal-title" className="font-bold text-slate-900">
              AutoDock Seller Privacy Notice ({version})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto font-mono text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/70 border-b border-slate-200">
          {PRIVACY_NOTICE_V1_2_TEXT.trim()}
        </div>

        <div className="p-4 flex items-center justify-between bg-slate-50">
          <span className="text-xs text-slate-500">
            For general platform terms, see{' '}
            <a href="/privacy-policy" target="_blank" rel="noreferrer" className="text-blue-600 underline">
              Full Privacy Policy
            </a>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-md text-xs font-semibold hover:bg-slate-800 transition"
          >
            Understood & Close
          </button>
        </div>
      </div>
    </div>
  );
};
