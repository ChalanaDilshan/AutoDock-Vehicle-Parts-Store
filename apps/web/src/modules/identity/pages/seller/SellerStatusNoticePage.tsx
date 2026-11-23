import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sellerApi, SellerProfileData } from '../../api/identityApi.js';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  ArrowRight,
  HelpCircle,
} from 'lucide-react';

export const SellerStatusNoticePage: React.FC = () => {
  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await sellerApi.getMe();
        if (response.success && response.data) {
          setSeller(response.data);
        } else {
          setError(response.message || 'Failed to retrieve application status.');
        }
      } catch (err: any) {
        setError(err?.message || 'Error loading status.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm">Retrieving seller verification status...</p>
      </div>
    );
  }

  if (error || !seller) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white p-6 rounded-xl border border-red-200 text-center">
        <XCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h2 className="text-base font-bold text-slate-900 mb-1">Status Unavailable</h2>
        <p className="text-xs text-slate-600 mb-4">{error || 'No active seller profile found.'}</p>
        <Link to="/sellers/register" className="text-xs text-blue-600 underline font-medium">
          Start Seller Registration
        </Link>
      </div>
    );
  }

  const status = seller.verificationStatus;

  return (
    <div className="max-w-2xl mx-auto my-10 space-y-6">
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        {/* Status Graphic */}
        {status === 'APPROVED' && (
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
        )}
        {(status === 'PENDING' || status === 'UNDER_VERIFICATION') && (
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-10 h-10" />
          </div>
        )}
        {status === 'ADDITIONAL_INFO_REQUIRED' && (
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-10 h-10" />
          </div>
        )}
        {status === 'REJECTED' && (
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10" />
          </div>
        )}
        {status === 'SUSPENDED' && (
          <div className="w-16 h-16 bg-red-50 text-red-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-10 h-10" />
          </div>
        )}

        {/* Title */}
        <h1 className="text-xl font-bold text-slate-900 mb-1">
          {status === 'APPROVED' && 'Seller Account Approved!'}
          {status === 'PENDING' && 'Application Under Review'}
          {status === 'UNDER_VERIFICATION' && 'Verification In Progress'}
          {status === 'ADDITIONAL_INFO_REQUIRED' && 'Additional Information Required'}
          {status === 'REJECTED' && 'Application Not Approved'}
          {status === 'SUSPENDED' && 'Merchant Account Suspended'}
        </h1>

        <p className="text-xs text-slate-500 max-w-md mx-auto mb-6">
          {seller.businessName} (BR: {seller.businessRegistrationNumber})
        </p>

        {/* Explanation Box */}
        <div className="p-4 rounded-lg text-left text-xs space-y-3 mb-6 bg-slate-50 border border-slate-200">
          {status === 'PENDING' && (
            <p className="text-slate-700 leading-relaxed">
              Your documents and store registration have been successfully received and are queued for verification by the AutoDock administration team. Expected turnaround time is 1–2 business days.
            </p>
          )}

          {status === 'UNDER_VERIFICATION' && (
            <p className="text-slate-700 leading-relaxed">
              An administrator is actively reviewing your dossier. For physical retail stores, our team will coordinate either an on-premise inspection or a live WhatsApp video call verification.
            </p>
          )}

          {status === 'ADDITIONAL_INFO_REQUIRED' && (
            <div className="space-y-2">
              <p className="font-semibold text-amber-900">Administrator Feedback:</p>
              <div className="p-3 bg-amber-50 rounded border border-amber-200 text-amber-800">
                {seller.additionalInfoRequested || 'Please provide updated or clearer verification documents.'}
              </div>
            </div>
          )}

          {status === 'REJECTED' && (
            <div className="space-y-2">
              <p className="font-semibold text-red-900">Rejection Reason:</p>
              <div className="p-3 bg-red-50 rounded border border-red-200 text-red-800">
                {seller.rejectionReason || 'Application does not meet AutoDock commercial dealer guidelines.'}
              </div>
            </div>
          )}

          {status === 'APPROVED' && (
            <p className="text-emerald-800 leading-relaxed">
              Your merchant credentials and operating premises have been successfully verified. You are now authorized to publish automotive spare parts to the AutoDock catalog.
            </p>
          )}

          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Store Operating Model: {seller.sellerType === 'PHYSICAL_STORE' ? 'Physical Retail Store' : 'Online-Only Merchant'}</span>
            <span>Eligibility to Sell: <strong className={seller.isEligibleToSell ? 'text-emerald-700' : 'text-slate-700'}>{seller.isEligibleToSell ? 'Active' : 'Locked'}</strong></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {status === 'ADDITIONAL_INFO_REQUIRED' && (
            <Link
              to="/seller/onboarding"
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <span>Update Documents in Onboarding Hub</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}

          {status === 'APPROVED' ? (
            <Link
              to="/seller/dashboard"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <span>Go to Seller Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              to="/seller/dashboard"
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-md text-xs font-medium transition"
            >
              View Restricted Seller Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
