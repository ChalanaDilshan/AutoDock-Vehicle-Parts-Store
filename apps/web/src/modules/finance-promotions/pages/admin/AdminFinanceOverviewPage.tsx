import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  ShieldCheck,
  TrendingUp,
  Percent,
  AlertCircle,
  Clock,
  ArrowRight,
  Tag,
  Users,
  Settings,
} from 'lucide-react';
import {
  adminFinanceApi,
  adminPromotionApi,
  CommissionRateConfig,
} from '../../api/financePromotionsApi.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const AdminFinanceOverviewPage: React.FC = () => {
  const [currentRate, setCurrentRate] = useState<CommissionRateConfig | null>(null);
  const [pendingQueueCount, setPendingQueueCount] = useState<number>(0);
  const [ledgerSummary, setLedgerSummary] = useState<{
    totalCommissionInCents: number;
    totalBaseInCents: number;
  }>({ totalCommissionInCents: 0, totalBaseInCents: 0 });
  const [subsidySummary, setSubsidySummary] = useState<{
    totalAccruedInCents: number;
    totalSettledInCents: number;
  }>({ totalAccruedInCents: 0, totalSettledInCents: 0 });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [rateRes, queueRes, ledgerRes, subsidyRes] = await Promise.all([
        adminFinanceApi.getCommissionRate(),
        adminFinanceApi.getPaymentVerificationQueue({ limit: 1 }),
        adminFinanceApi.getCommissionLedger({ limit: 1 }),
        adminPromotionApi.getSubsidies({ limit: 1 }),
      ]);

      if (rateRes.success && rateRes.data) {
        setCurrentRate(rateRes.data.currentRate);
      }
      if (queueRes.success && queueRes.data?.pagination) {
        setPendingQueueCount(queueRes.data.pagination.total);
      }
      if (ledgerRes.success && ledgerRes.data?.summary) {
        setLedgerSummary(ledgerRes.data.summary);
      }
      if (subsidyRes.success && subsidyRes.data) {
        setSubsidySummary({
          totalAccruedInCents: subsidyRes.data.totalAccruedInCents || 0,
          totalSettledInCents: subsidyRes.data.totalSettledInCents || 0,
        });
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load administrator finance overview.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Finance & Settlements Governance
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
              Admin Platform
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Centralized platform commission control, seller exemptions, payment verification, and
            subsidy ledgers.
          </p>
        </div>

        <button
          onClick={fetchOverview}
          className="self-start sm:self-auto px-3.5 py-1.5 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition"
        >
          Refresh Data
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={fetchOverview}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Aggregated KPI Metrics Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse h-28"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Commission Rate */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Active Commission Rate</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Percent className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-blue-900">
              {currentRate ? `${currentRate.percentage.toFixed(2)}%` : '8.00%'}
            </div>
            <p className="text-[11px] text-slate-400">
              {currentRate ? `${currentRate.basisPoints} basis points` : 'Default platform rate'}
            </p>
          </div>

          {/* Pending Payment Verification Queue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Receipts Pending Review</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-2xl font-black text-amber-900">{pendingQueueCount}</div>
            <Link
              to="/admin/finance/verification-queue"
              className="text-[11px] text-amber-700 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Review Verification Queue</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Platform Commission Accrued */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Commission Earned (All-Time)</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-emerald-900 font-mono">
              {formatLKR(ledgerSummary.totalCommissionInCents)}
            </div>
            <p className="text-[11px] text-slate-400">
              Base sales: {formatLKR(ledgerSummary.totalBaseInCents)}
            </p>
          </div>

          {/* Platform Subsidy Accruals */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Platform Subsidy Accrued</span>
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-purple-950 font-mono">
              {formatLKR(subsidySummary.totalAccruedInCents)}
            </div>
            <Link
              to="/admin/finance/subsidies"
              className="text-[11px] text-purple-700 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>Subsidy Reconciliation</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Governance Workstation Quick Navigation Cards */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider text-xs">
          Financial Management Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          {/* 1. Commission Rate Configuration */}
          <Link
            to="/admin/finance/commission-rate"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <Percent className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Commission Rate Configuration</h3>
            <p className="text-slate-500 leading-relaxed">
              Adjust global platform commission basis points, schedule effective dates, and inspect
              audit logs.
            </p>
          </Link>

          {/* 2. Seller Commission Exemptions */}
          <Link
            to="/admin/finance/exemptions"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
                <Users className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Seller Commission Exemptions</h3>
            <p className="text-slate-500 leading-relaxed">
              Grant or revoke 0% commission exemptions to strategic partner merchants with audit
              reasons.
            </p>
          </Link>

          {/* 3. Commission Ledger */}
          <Link
            to="/admin/finance/commission-ledger"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition">
                <TrendingUp className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Commission Ledger (Audit Trail)</h3>
            <p className="text-slate-500 leading-relaxed">
              Search the immutable transaction ledger of commission accrued on completed suborders.
            </p>
          </Link>

          {/* 4. Monthly Invoices & Batch Generation */}
          <Link
            to="/admin/finance/invoices"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
                <FileText className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Monthly Invoices & Batch Run</h3>
            <p className="text-slate-500 leading-relaxed">
              Inspect all issued merchant commission invoices and execute monthly batch generation.
            </p>
          </Link>

          {/* 5. Payment Verification Queue */}
          <Link
            to="/admin/finance/verification-queue"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-rose-400 hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:scale-105 transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Payment Verification Queue</h3>
            <p className="text-slate-500 leading-relaxed">
              Audit submitted bank deposit slips, compare balances, and approve or reject payments.
            </p>
          </Link>

          {/* 6. Marketplace Promotions */}
          <Link
            to="/admin/finance/promotions"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-purple-400 hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition">
                <Tag className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Marketplace Promotions</h3>
            <p className="text-slate-500 leading-relaxed">
              Launch AutoDock-funded promotional campaigns and track redemption subsidy metrics.
            </p>
          </Link>

          {/* 7. Platform Subsidy Ledger */}
          <Link
            to="/admin/finance/subsidies"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition">
                <DollarSign className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Platform Subsidy Ledger</h3>
            <p className="text-slate-500 leading-relaxed">
              Inspect subsidy liabilities accrued to merchants from marketplace discount campaigns.
            </p>
          </Link>

          {/* 8. Platform Bank Settings */}
          <Link
            to="/admin/finance/bank-settings"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-md transition space-y-2 group"
          >
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:scale-105 transition">
                <Settings className="w-5 h-5" />
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition" />
            </div>
            <h3 className="font-bold text-slate-900 text-sm">Platform Bank Account</h3>
            <p className="text-slate-500 leading-relaxed">
              Configure corporate receiving bank details, account number, branch, and transfer
              instructions.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
};
