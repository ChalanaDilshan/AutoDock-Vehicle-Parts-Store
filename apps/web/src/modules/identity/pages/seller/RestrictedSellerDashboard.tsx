import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sellerApi, SellerProfileData } from '../../api/identityApi.js';
import {
  Lock,
  PackageX,
  CreditCard,
  FileText,
  Clock,
  Loader2,
  Building2,
} from 'lucide-react';

export const RestrictedSellerDashboard: React.FC = () => {
  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const response = await sellerApi.getMe();
        if (response.success && response.data) {
          setSeller(response.data);
        } else {
          setError(response.message || 'Unable to load seller profile.');
        }
      } catch (err: any) {
        setError(err?.message || 'Error connecting to seller service.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSeller();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Loading seller portal...</p>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-6 rounded-xl border border-slate-200 text-center">
        <Building2 className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900 mb-1">No Active Seller Profile</h2>
        <p className="text-xs text-slate-500 mb-4">{error || 'You have not registered as a seller yet.'}</p>
        <Link
          to="/sellers/register"
          className="inline-block px-4 py-2 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition"
        >
          Register Spare-Parts Business
        </Link>
      </div>
    );
  }

  const isApproved = seller.verificationStatus === 'APPROVED' && seller.isEligibleToSell;

  return (
    <div className="max-w-5xl mx-auto my-6 space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Seller Portal</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded border ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              Status: {seller.verificationStatus}
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">{seller.businessName}</h1>
          <p className="text-xs text-slate-500">
            Store URL: autodock.lk/{seller.storeSlug} | BR: {seller.businessRegistrationNumber}
          </p>
        </div>

        <Link
          to="/seller/onboarding/status"
          className="text-xs border border-slate-300 px-3 py-1.5 rounded-md font-medium text-slate-700 hover:bg-slate-50 transition inline-flex items-center gap-1 self-start md:self-auto"
        >
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>View Verification Dossier</span>
        </Link>
      </div>

      {/* RESTRICTION NOTICE BANNER (WHEN NOT APPROVED) */}
      {!isApproved && (
        <div
          role="alert"
          className="bg-amber-50 border border-amber-200 p-5 rounded-xl flex items-start gap-3.5"
        >
          <div className="p-2 bg-amber-100 text-amber-800 rounded-lg shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-amber-950">
              Restricted Merchant Access — Catalog Publishing Locked
            </h2>
            <p className="text-xs text-amber-800 leading-relaxed">
              Your merchant account is currently in <strong>{seller.verificationStatus}</strong> status. In accordance with AutoDock trust and anti-counterfeit spare-parts regulations, product catalogue publishing and customer order fulfillment are restricted until full administrative verification is completed.
            </p>
            {seller.rejectionReason && (
              <div className="mt-2 p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                <strong>Rejection Notice:</strong> {seller.rejectionReason}
              </div>
            )}
            {seller.additionalInfoRequested && (
              <div className="mt-2 p-2.5 bg-amber-100/70 text-amber-900 border border-amber-300 rounded text-xs">
                <strong>Action Required:</strong> {seller.additionalInfoRequested}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feature Capability Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Capability 1: Parts Catalog Publishing */}
        <div className={`p-5 rounded-xl border bg-white shadow-sm flex flex-col justify-between ${!isApproved ? 'opacity-80' : ''}`}>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${isApproved ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                <PackageX className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                {isApproved ? 'Authorized' : 'Locked'}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Catalog & Inventory</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Publish OEM & aftermarket spare parts, manage vehicle compatibility, and update inventory stock counts.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
            {isApproved ? (
              <span className="text-blue-600 font-semibold cursor-pointer">Manage Inventory →</span>
            ) : (
              <span className="text-slate-400 font-medium">Locked pending verification</span>
            )}
          </div>
        </div>

        {/* Capability 2: Bank Account & Payment Intake */}
        <div className="p-5 rounded-xl border bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                seller.bankDetails?.verificationStatus === 'VERIFIED'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-800'
              }`}>
                {seller.bankDetails?.verificationStatus || 'Not Provided'}
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Bank Settlement Details</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Direct bank-transfer payment routing details. Requires administrator audit before activation.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
            <Link to="/seller/onboarding" className="text-blue-600 hover:text-blue-800 font-semibold">
              Inspect Bank Status →
            </Link>
          </div>
        </div>

        {/* Capability 3: Verification Dossier */}
        <div className="p-5 rounded-xl border bg-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <FileText className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                Onboarding Hub
              </span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mb-1">Onboarding Dossier</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Inspect uploaded BR certificates, NIC photos, storefront media, and legal privacy consent.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
            <Link to="/seller/onboarding" className="text-blue-600 hover:text-blue-800 font-semibold">
              Open Onboarding Hub →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
