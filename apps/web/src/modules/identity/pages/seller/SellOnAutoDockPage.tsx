import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Globe,
  Landmark,
  Lock,
  ShieldCheck,
  Store,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { sellerApi, SellerProfileData } from '../../api/identityApi.js';
import { Badge, Button } from '../../../../shared/components/index.js';

const ONBOARDING_STEPS = [
  {
    step: '01',
    title: 'Create Account & Submit Store Profile',
    description:
      'Sign in with an AutoDock account and enter your registered business name, BR number, operating district, and contact phone.',
    routeLabel: '/sellers/register',
  },
  {
    step: '02',
    title: 'Upload Verification Documents & Bank Details',
    description:
      'Submit private verification documents, Sri Lankan bank account details for direct transfers, and acknowledge the Seller Privacy Notice.',
    routeLabel: '/seller/onboarding',
  },
  {
    step: '03',
    title: 'Complete Administrative Verification',
    description:
      'Administrators verify your store and bank account. Pending sellers may sign in to the portal, but cannot publish products or sell until approved.',
    routeLabel: '/seller/onboarding/status',
  },
  {
    step: '04',
    title: 'Publish Parts & Fulfill Orders',
    description:
      'List vehicle spare parts, configure district delivery rates, and receive direct bank-transfer or Cash on Delivery (COD) orders.',
    routeLabel: '/seller/dashboard',
  },
];

export const SellOnAutoDockPage: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sellerProfile, setSellerProfile] = useState<SellerProfileData | null>(null);
  const [sellerFetchMissing, setSellerFetchMissing] = useState(false);

  const isSeller = isAuthenticated && user?.role === 'SELLER';
  const isAdmin = isAuthenticated && user?.role === 'ADMIN';
  const isCustomer = isAuthenticated && user?.role === 'CUSTOMER';

  useEffect(() => {
    let active = true;
    if (!isSeller) {
      setSellerProfile(null);
      setSellerFetchMissing(false);
      return;
    }

    sellerApi
      .getMe()
      .then((res) => {
        if (!active) return;
        if (res.success && res.data) {
          setSellerProfile(res.data);
          setSellerFetchMissing(false);
        }
      })
      .catch((err: any) => {
        if (!active) return;
        if (err?.status === 404) {
          setSellerFetchMissing(true);
        }
      });

    return () => {
      active = false;
    };
  }, [isSeller]);

  const renderHeroActions = () => {
    if (isLoading) {
      return (
        <div
          role="status"
          aria-live="polite"
          className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-sm text-slate-200"
        >
          Checking account session...
        </div>
      );
    }

    if (!isAuthenticated || !user) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            An AutoDock account is required before you can register a merchant store.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/login?next=/sellers/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="min-h-[44px] bg-[#E11D30] hover:bg-[#BE123C]"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Sign In to Register Store
              </Button>
            </Link>
            <Link to="/register?next=/sellers/register" className="w-full sm:w-auto">
              <Button
                variant="secondary-dark"
                size="lg"
                fullWidth
                className="min-h-[44px]"
              >
                Create AutoDock Account
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    if (isAdmin) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Signed in as an AutoDock Administrator. Review merchant applications in the verification queue.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/admin/sellers/verification" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="min-h-[44px] bg-[#E11D30] hover:bg-[#BE123C]"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Open Seller Verification Queue
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    if (isSeller) {
      if (sellerFetchMissing && !user.sellerId) {
        return (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/sellers/register" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="min-h-[44px] bg-[#E11D30] hover:bg-[#BE123C]"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Start Store Registration
              </Button>
            </Link>
          </div>
        );
      }

      const status = sellerProfile?.verificationStatus;
      const shouldOpenPortal =
        status === 'APPROVED' || status === 'PENDING' || status === 'UNDER_VERIFICATION';

      return (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            {shouldOpenPortal
              ? 'Your merchant profile is registered. Access your Seller Portal or review your onboarding documents.'
              : 'Continue uploading your verification documents and bank details to submit your store for review.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            {shouldOpenPortal ? (
              <>
                <Link key="hero-portal-primary" to="/seller/dashboard" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="min-h-[44px] bg-[#E11D30] hover:bg-[#BE123C]"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Open Seller Portal
                  </Button>
                </Link>
                <Link key="hero-onboarding-secondary" to="/seller/onboarding" className="w-full sm:w-auto">
                  <Button
                    variant="secondary-dark"
                    size="lg"
                    fullWidth
                    className="min-h-[44px]"
                  >
                    Continue Store Onboarding
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link key="hero-onboarding-primary" to="/seller/onboarding" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    className="min-h-[44px] bg-[#E11D30] hover:bg-[#BE123C]"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Continue Store Onboarding
                  </Button>
                </Link>
                <Link key="hero-portal-secondary" to="/seller/dashboard" className="w-full sm:w-auto">
                  <Button
                    variant="secondary-dark"
                    size="lg"
                    fullWidth
                    className="min-h-[44px]"
                  >
                    Open Seller Portal
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      );
    }

    if (isCustomer) {
      const targetPath = user.sellerId ? '/seller/onboarding' : '/sellers/register';
      const label = user.sellerId ? 'Continue Store Onboarding' : 'Start Store Registration';

      return (
        <div className="space-y-3">
          <p className="text-sm text-slate-300">
            Your customer account is active. Complete Step 1 store registration to begin merchant verification.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={targetPath} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="min-h-[44px] bg-[#E11D30] hover:bg-[#BE123C]"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                {label}
              </Button>
            </Link>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="bg-slate-50">
      {/* Hero Banner */}
      <section className="bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold tracking-wide uppercase">
              <Store className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Merchant Onboarding</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
                Sell Vehicle Spare Parts on AutoDock
              </h1>
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                Reach vehicle owners, workshops, and fleet buyers across Sri Lanka&apos;s 25 districts. Register your parts store, verify your business credentials, and manage inventory and fulfillment from one merchant portal.
              </p>
            </div>

            {renderHeroActions()}
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 space-y-12">
        {/* Physical Store vs. Online-Only Comparison */}
        <section aria-labelledby="seller-models-heading" className="space-y-5">
          <div className="space-y-1.5">
            <h2
              id="seller-models-heading"
              className="text-2xl font-semibold text-slate-900 tracking-tight"
            >
              Supported Merchant Models
            </h2>
            <p className="text-sm text-slate-600">
              Choose the operating model that matches how your spare-parts business serves customers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Physical Store */}
            <article className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-red-50 border border-red-200 text-[#E11D30] flex items-center justify-center shrink-0">
                    <Store className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Physical Store
                    </h3>
                    <p className="text-xs text-slate-600">
                      Auto parts retail shops, garages, and showrooms
                    </p>
                  </div>
                </div>
                <Badge variant="primary">Storefront Required</Badge>
              </div>

              <ul className="space-y-2.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E11D30] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Business Registration (BR) certificate matching store details</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E11D30] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>National Identity Card (NIC) or Passport of the owner or director</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E11D30] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Owner live verification photo</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="font-medium text-slate-900">
                    Storefront photographs showing shop signage and parts counter
                  </span>
                </li>
              </ul>

              <div className="pt-3 border-t border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">Verification method:</span>{' '}
                Verified via physical visit or WhatsApp video call.
              </div>
            </article>

            {/* Online-Only Merchant */}
            <article className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center shrink-0">
                    <Globe className="w-5 h-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      Online-Only Merchant
                    </h3>
                    <p className="text-xs text-slate-600">
                      Direct importers, distributors, and warehouse sellers
                    </p>
                  </div>
                </div>
                <Badge variant="default">No Storefront Photos</Badge>
              </div>

              <ul className="space-y-2.5 text-sm text-slate-700">
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E11D30] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Business Registration (BR) certificate matching registered business</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E11D30] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>National Identity Card (NIC) or Passport of the owner or director</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-[#E11D30] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Owner live verification photo</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>Storefront photographs are not required for online-only sellers</span>
                </li>
              </ul>

              <div className="pt-3 border-t border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-900">Verification method:</span>{' '}
                Document-based verification by AutoDock administrators.
              </div>
            </article>
          </div>
        </section>

        {/* 4-Step Onboarding Process */}
        <section aria-labelledby="onboarding-steps-heading" className="space-y-5">
          <div className="space-y-1.5">
            <h2
              id="onboarding-steps-heading"
              className="text-2xl font-semibold text-slate-900 tracking-tight"
            >
              4-Step Onboarding Process
            </h2>
            <p className="text-sm text-slate-600">
              Follow each stage to activate catalog publishing and customer checkout for your store.
            </p>
          </div>

          <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ONBOARDING_STEPS.map((item) => (
              <li
                key={item.step}
                className="bg-white border border-slate-200 rounded-lg p-5 flex flex-col justify-between gap-4 shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold px-2.5 py-1 rounded bg-red-50 text-[#E11D30] border border-red-200">
                      STEP {item.step}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-100 text-xs font-mono text-slate-500">
                  {item.routeLabel}
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Settlement & Privacy Policy Summary */}
        <section aria-labelledby="settlement-privacy-heading" className="space-y-5">
          <div className="space-y-1.5">
            <h2
              id="settlement-privacy-heading"
              className="text-2xl font-semibold text-slate-900 tracking-tight"
            >
              Settlement &amp; Privacy Policy Summary
            </h2>
            <p className="text-sm text-slate-600">
              How bank-transfer settlements, platform invoicing, and private verification documents are handled on AutoDock.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-red-50 text-[#E11D30] flex items-center justify-center">
                <Landmark className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Direct-to-Seller Bank Transfers
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Customer direct bank transfers settle directly to your verified Sri Lankan bank account. AutoDock does not pool direct bank-transfer funds.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-amber-50 text-amber-700 flex items-center justify-center">
                <FileCheck2 className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Monthly Commission Invoicing
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Platform commission is configured by AutoDock administrators and billed via monthly seller invoices inside your merchant finance workspace.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2.5">
              <div className="w-9 h-9 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center">
                <Lock className="w-5 h-5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold text-slate-900">
                Private Verification Storage
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Verification documents and bank details are stored privately with restricted administrator access and are never exposed publicly.{' '}
                <Link
                  to="/privacy-policy"
                  className="font-medium text-[#E11D30] hover:underline inline-flex items-center gap-1"
                >
                  <span>Read Privacy Policy</span>
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Bottom Readiness Strip */}
        <section className="bg-white border border-slate-200 rounded-lg p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-[#E11D30]" aria-hidden="true" />
              <span>Ready to prepare your store application?</span>
            </div>
            <p className="text-sm text-slate-600">
              Have your BR certificate, NIC or Passport, owner verification photo, and Sri Lankan bank details ready.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!isAuthenticated ? (
              <Link to="/login?next=/sellers/register">
                <Button variant="primary" size="md" className="min-h-[44px]">
                  Sign In to Register Store
                </Button>
              </Link>
            ) : isCustomer ? (
              <Link to="/sellers/register">
                <Button variant="primary" size="md" className="min-h-[44px]">
                  Start Store Registration
                </Button>
              </Link>
            ) : isSeller ? (
              <Link to="/seller/onboarding">
                <Button variant="primary" size="md" className="min-h-[44px]">
                  Go to Store Onboarding
                </Button>
              </Link>
            ) : (
              <Link to="/admin/sellers/verification">
                <Button variant="primary" size="md" className="min-h-[44px]">
                  Open Verification Queue
                </Button>
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
