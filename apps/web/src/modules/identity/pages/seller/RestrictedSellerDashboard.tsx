import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  Landmark,
  Percent,
  Truck,
  MessageSquare,
  Lock,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { sellerApi, SellerProfileData } from '../../api/identityApi.js';
import {
  Alert,
  Badge,
  Button,
  PageHeader,
} from '../../../../shared/components/index.js';

export const RestrictedSellerDashboard: React.FC = () => {
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
        setErrorMessage(err?.message || 'Unable to load merchant profile.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      </div>
    );
  }

  if (errorMessage || !seller) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-4">
        <Alert variant="warning" title="Merchant store setup incomplete">
          {errorMessage || 'Create a seller store profile to access the Seller Portal.'}
        </Alert>
        <Link to="/sellers/register">
          <Button variant="primary">Register Seller Store</Button>
        </Link>
      </div>
    );
  }

  const isStoreApproved = seller.verificationStatus === 'APPROVED';
  const bankStatus =
    seller.bankDetails?.verificationStatus ?? seller.bankVerificationStatus;
  const bankVerified = bankStatus === 'VERIFIED';
  const isFullyEligible = Boolean(seller.isEligibleToSell);
  const isStoreApprovedBankPending =
    isStoreApproved &&
    (!isFullyEligible || (bankStatus !== undefined && !bankVerified));

  const tools = [
    {
      title: 'Spare Parts Inventory',
      description: 'List spare parts, adjust stock, and configure vehicle fitment.',
      to: '/seller/products',
      icon: <Package className="w-5 h-5" />,
      locked: !isFullyEligible,
      lockLabel: isStoreApprovedBankPending
        ? 'Locked pending bank verification'
        : 'Locked pending verification',
    },
    {
      title: 'Orders & Fulfillment',
      description: 'Confirm payments, pack items, and dispatch tracking details.',
      to: '/seller/orders',
      icon: <ShoppingBag className="w-5 h-5" />,
      locked: !isFullyEligible,
      lockLabel: isStoreApprovedBankPending
        ? 'Requires bank verification'
        : 'Requires seller approval',
    },
    {
      title: 'Finance & Invoices',
      description: 'View monthly commission statements, subsidies, and payment slips.',
      to: '/seller/finance',
      icon: <Landmark className="w-5 h-5" />,
      locked: false,
      lockLabel: '',
    },
    {
      title: 'Promotions & Coupons',
      description: 'Launch seller-funded discounts across selected parts.',
      to: '/seller/promotions',
      icon: <Percent className="w-5 h-5" />,
      locked: !isFullyEligible,
      lockLabel: isStoreApprovedBankPending
        ? 'Requires bank verification'
        : 'Requires seller approval',
    },
    {
      title: 'Delivery Rates',
      description: 'Propose district delivery rates across Sri Lanka.',
      to: '/seller/delivery-rates',
      icon: <Truck className="w-5 h-5" />,
      locked: !isFullyEligible,
      lockLabel: isStoreApprovedBankPending
        ? 'Requires bank verification'
        : 'Requires seller approval',
    },
    {
      title: 'Customer Reviews',
      description: 'Read verified buyer feedback on your spare parts.',
      to: '/seller/reviews',
      icon: <MessageSquare className="w-5 h-5" />,
      locked: false,
      lockLabel: '',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title={seller.businessName}
        subtitle={`Registration: ${seller.businessRegistrationNumber} · ${seller.operatingAddress.city}, ${seller.operatingAddress.district}`}
        badge={
          <Badge
            variant={
              isFullyEligible
                ? 'success'
                : isStoreApproved
                  ? 'primary'
                  : 'warning'
            }
            size="md"
          >
            {seller.verificationStatus}
          </Badge>
        }
        actions={
          <Link to="/seller/onboarding">
            <Button variant="outline" size="sm">
              Onboarding &amp; Documents
            </Button>
          </Link>
        }
      />

      {!isStoreApproved ? (
        <Alert
          variant="warning"
          title="Restricted Merchant Access — Catalog Publishing Locked"
        >
          Your store cannot publish live listings until administrative verification finishes.{' '}
          <Link to="/seller/onboarding" className="font-semibold underline">
            Complete or review onboarding
          </Link>
        </Alert>
      ) : isStoreApprovedBankPending ? (
        <Alert
          variant="warning"
          title="Store Approved, Bank Verification Pending"
        >
          Your store profile is approved, but bank account verification ({bankStatus || 'PENDING'}) must be verified before catalog publishing and checkout eligibility unlock.{' '}
          <Link to="/seller/onboarding" className="font-semibold underline">
            Review bank details
          </Link>
        </Alert>
      ) : (
        <Alert variant="success" title="Store Verified & Active">
          Your merchant store is approved and eligible for public listings and checkout orders. Bank status: Verified.
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.to}
            className={`bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4 ${
              tool.locked ? 'bg-slate-50/70' : ''
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                  {tool.icon}
                </div>
                {tool.locked ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    <Lock className="w-3 h-3" />
                    <span>{tool.lockLabel}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Available</span>
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-slate-900">
                {tool.title}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {tool.description}
              </p>
            </div>

            {!tool.locked && (
              <Link
                to={tool.to}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 pt-2 border-t border-slate-100"
              >
                <span>Open workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
