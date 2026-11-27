import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Percent,
  ShieldCheck,
  CreditCard,
  Receipt,
  BookOpen,
  Tag,
  Gift,
  Building2,
  ChevronRight,
} from 'lucide-react';
import {
  adminFinanceApi,
  adminPromotionApi,
} from '../../api/financePromotionsApi.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import { Alert, PageHeader } from '../../../../shared/components/index.js';

export const AdminFinanceOverviewPage: React.FC = () => {
  const [ratePercent, setRatePercent] = useState<string>('—');
  const [pendingReceiptsCount, setPendingReceiptsCount] = useState<number>(0);
  const [totalCommissionCents, setTotalCommissionCents] = useState<number>(0);
  const [accruedSubsidyCents, setAccruedSubsidyCents] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setErrorMessage(null);
    Promise.allSettled([
      adminFinanceApi.getCommissionRate(),
      adminFinanceApi.getPaymentVerificationQueue({ limit: 1 }),
      adminFinanceApi.getCommissionLedger({ limit: 1 }),
      adminPromotionApi.getSubsidies({ limit: 1 }),
    ])
      .then(([rateRes, queueRes, ledgerRes, subRes]) => {
        if (rateRes.status === 'fulfilled' && rateRes.value.success) {
          const r = rateRes.value.data.currentRate;
          setRatePercent(`${(r.basisPoints / 100).toFixed(2)}%`);
        }
        if (queueRes.status === 'fulfilled' && queueRes.value.success) {
          setPendingReceiptsCount(
            queueRes.value.data.pagination?.total ?? 0
          );
        }
        if (ledgerRes.status === 'fulfilled' && ledgerRes.value.success) {
          setTotalCommissionCents(
            ledgerRes.value.data.summary?.totalCommissionInCents ?? 0
          );
        }
        if (subRes.status === 'fulfilled' && subRes.value.success) {
          setAccruedSubsidyCents(subRes.value.data.totalAccruedInCents ?? 0);
        }
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Unable to load finance overview.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const sections = [
    {
      title: 'Commission Rate Configuration',
      description: 'Update standard platform commission percentage and view audit history.',
      to: '/admin/finance/commission-rate',
      icon: <Percent className="w-4 h-4" />,
    },
    {
      title: 'Seller Commission Exemptions',
      description: 'Grant or revoke 0% fee exemptions for partner merchants.',
      to: '/admin/finance/exemptions',
      icon: <ShieldCheck className="w-4 h-4" />,
    },
    {
      title: 'Payment Verification Queue',
      description: 'Audit bank deposit receipts submitted against monthly seller invoices.',
      to: '/admin/finance/verification-queue',
      icon: <CreditCard className="w-4 h-4" />,
    },
    {
      title: 'Seller Monthly Invoices',
      description: 'Generate monthly commission invoices and review outstanding balances.',
      to: '/admin/finance/invoices',
      icon: <Receipt className="w-4 h-4" />,
    },
    {
      title: 'Commission Ledger',
      description: 'Browse order-level commission accruals across merchants.',
      to: '/admin/finance/commission-ledger',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      title: 'Platform Promotions',
      description: 'Launch and pause marketplace-funded discount campaigns.',
      to: '/admin/finance/promotions',
      icon: <Tag className="w-4 h-4" />,
    },
    {
      title: 'Platform Subsidies',
      description: 'Monitor seller reimbursements from AutoDock-funded coupons.',
      to: '/admin/finance/subsidies',
      icon: <Gift className="w-4 h-4" />,
    },
    {
      title: 'Platform Bank Settings',
      description: 'Configure AutoDock settlement bank details shown on invoices.',
      to: '/admin/finance/bank-settings',
      icon: <Building2 className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Finance & Settlements Governance"
        subtitle="Manage platform commission rates, seller billing invoices, payment receipts, and promo subsidies"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1">
          <p className="text-xs font-medium text-slate-500">
            Active Commission Rate
          </p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {isLoading ? '...' : ratePercent}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1">
          <p className="text-xs font-medium text-slate-500">
            Receipts Pending Review
          </p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {isLoading ? '...' : pendingReceiptsCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1">
          <p className="text-xs font-medium text-slate-500">
            Commission Earned (All-Time)
          </p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {isLoading ? '...' : formatLKR(totalCommissionCents)}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-1">
          <p className="text-xs font-medium text-slate-500">
            Accrued Subsidy Liability
          </p>
          <p className="text-2xl font-bold text-slate-900 tabular-nums">
            {isLoading ? '...' : formatLKR(accruedSubsidyCents)}
          </p>
        </div>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((sec) => (
          <Link
            key={sec.to}
            to={sec.to}
            className="bg-white border border-slate-200 rounded-lg p-5 hover:border-red-300 hover:shadow-xs transition-all flex items-start justify-between gap-3 group"
          >
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 group-hover:text-[#E11D30]">
                <span className="text-slate-500 group-hover:text-[#E11D30]">
                  {sec.icon}
                </span>
                <span>{sec.title}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {sec.description}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#E11D30] shrink-0 mt-0.5" />
          </Link>
        ))}
      </div>
    </div>
  );
};
