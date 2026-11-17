import React from 'react';
import { Shield, Lock, FileText } from 'lucide-react';
import { PRIVACY_NOTICE_V1_2_TEXT } from '../components/PrivacyNoticeModal.js';

export const PrivacyPolicyPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto my-8 px-4">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <Shield className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">Privacy & Data Governance</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">AutoDock Privacy Policy</h1>
          <p className="text-xs text-slate-500 mt-1">Last Updated: Version 1.2 — Sri Lanka Vehicle Spare-Parts Marketplace</p>
        </div>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" /> 1. Overview & Scope
          </h2>
          <p>
            AutoDock operates as a vehicle spare-parts multi-vendor e-commerce platform connecting automotive component sellers with vehicle owners and maintenance workshops across Sri Lanka. This Privacy Policy governs personal information collected through our website, mobile interfaces, customer checkout, and seller onboarding services.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" /> 2. Seller Verification Data Governance
          </h2>
          <p>
            To uphold consumer trust and prevent fraudulent spare parts distribution, AutoDock collects identity, business registration, and financial credentials from merchants applying to sell on the marketplace:
          </p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 font-mono text-xs whitespace-pre-wrap text-slate-800">
            {PRIVACY_NOTICE_V1_2_TEXT.trim()}
          </div>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">3. Customer Personal Information</h2>
          <p>
            Customer names, delivery addresses, telephone numbers, and order histories are processed strictly for fulfillment, delivery coordination with island-wide couriers, and order status communications.
          </p>
        </section>

        <section className="space-y-3 text-sm text-slate-700 leading-relaxed">
          <h2 className="text-base font-bold text-slate-900">4. Contact & Inquiries</h2>
          <p>
            For privacy inquiries or document correction requests, contact the AutoDock administrative governance team at <span className="font-semibold text-slate-900">privacy@autodock.lk</span>.
          </p>
        </section>
      </div>
    </div>
  );
};
