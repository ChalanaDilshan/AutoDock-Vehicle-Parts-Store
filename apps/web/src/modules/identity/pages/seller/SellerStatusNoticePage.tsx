import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { sellerApi, SellerProfileData } from '../../api/identityApi.js';
import {
  Alert,
  Badge,
  Button,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerStatusNoticePage: React.FC = () => {
  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    sellerApi
      .getMe()
      .then((res) => {
        if (res.success && res.data) setSeller(res.data);
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Unable to load application status.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="h-56 bg-white border border-slate-200 rounded-lg" />
      </div>
    );
  }

  if (errorMessage || !seller) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Alert variant="danger">{errorMessage || 'Application not found.'}</Alert>
        <Link to="/sellers/register">
          <Button variant="primary">Register Seller Account</Button>
        </Link>
      </div>
    );
  }

  const status = seller.verificationStatus;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <PageHeader
        title="Seller Application Status"
        subtitle={seller.businessName}
        badge={
          <Badge
            variant={
              status === 'APPROVED'
                ? 'success'
                : status === 'REJECTED' || status === 'SUSPENDED'
                  ? 'danger'
                  : 'warning'
            }
          >
            {status}
          </Badge>
        }
      />

      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
        {status === 'APPROVED' ? (
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">
                Your store is approved
              </h2>
              <p className="text-sm text-slate-600">
                You can now publish spare parts inventory, set district delivery fees, and receive orders.
              </p>
              <Link to="/seller/dashboard">
                <Button variant="primary">Open Seller Portal</Button>
              </Link>
            </div>
          </div>
        ) : status === 'REJECTED' ? (
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-slate-900">
                Application not approved
              </h2>
              {seller.rejectionReason && (
                <p className="text-sm text-slate-700">{seller.rejectionReason}</p>
              )}
              <Link to="/seller/onboarding">
                <Button variant="outline">Review Submission</Button>
              </Link>
            </div>
          </div>
        ) : status === 'ADDITIONAL_INFO_REQUIRED' ? (
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">
                Additional information requested
              </h2>
              {seller.additionalInfoRequested && (
                <p className="text-sm text-slate-700">{seller.additionalInfoRequested}</p>
              )}
              <Link to="/seller/onboarding">
                <Button variant="primary">Update Onboarding Documents</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3">
            <Clock className="w-6 h-6 text-[#E11D30] shrink-0 mt-0.5" />
            <div className="space-y-3">
              <h2 className="text-base font-semibold text-slate-900">
                Application under verification
              </h2>
              <p className="text-sm text-slate-600">
                Our team is reviewing your documents and bank account details. You will be notified as soon as verification finishes.
              </p>
              <Link to="/seller/dashboard">
                <Button variant="outline">View Merchant Dashboard</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
