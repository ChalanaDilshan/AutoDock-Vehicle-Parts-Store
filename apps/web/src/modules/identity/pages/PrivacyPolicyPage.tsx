import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PRIVACY_NOTICE_V1_2_TEXT } from '../components/PrivacyNoticeModal.js';
import { PageHeader } from '../../../shared/components/index.js';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title="AutoDock Privacy Notice"
        subtitle="How we collect, protect, and govern identity and marketplace data (Version 1.2)"
        backTo="/"
        backLabel="Back to Home"
      />

      <div className="bg-white border border-slate-200 rounded-lg p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#E11D30]">
          <ShieldCheck className="w-4 h-4" />
          <span>Data Protection &amp; Verification Policy</span>
        </div>
        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700 leading-relaxed">
          {PRIVACY_NOTICE_V1_2_TEXT.trim()}
        </pre>
      </div>
    </div>
  );
};
