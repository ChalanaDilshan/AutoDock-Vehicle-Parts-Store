import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Percent,
  Gift,
  Truck,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  GitBranch,
} from 'lucide-react';
import {
  adminPlatformApi,
  DashboardSummaryData,
} from '../api/adminPlatformApi.js';
import { MetricCard } from '../components/MetricCard.js';
import { FreshnessIndicator } from '../components/FreshnessIndicator.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';
import { Alert, PageHeader } from '../../../shared/components/index.js';

export const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSummary = async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await adminPlatformApi.getDashboardSummary(forceRefresh);
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load dashboard summary.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary(false);
  }, []);

  if (isLoading && !summary) {
    return (
      <div className="space-y-6">
        <PageHeader title="Executive Marketplace Workstation" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className="h-32 bg-white border border-slate-200 rounded-lg"
            />
          ))}
        </div>
      </div>
    );
  }

  const health = summary?.systemFreshness?.moduleHealth;
  const mod1Degraded = health?.MOD_01 === 'DEGRADED';
  const mod2Degraded = health?.MOD_02 === 'DEGRADED';
  const mod3Degraded = health?.MOD_03 === 'DEGRADED';
  const mod4Degraded = health?.MOD_04 === 'DEGRADED';

  const ov = summary?.overview;
  const q = summary?.actionQueues;
  const splitRatio =
    ov && ov.totalMasterOrders > 0
      ? `${(ov.totalMerchantSuborders / ov.totalMasterOrders).toFixed(2)}x`
      : '0.00x';

  const actionQueues = [
    {
      label: 'Seller KYC Verification',
      count: q?.pendingSellerKYC ?? 0,
      to: '/admin/sellers/verification',
      icon: <ShieldCheck className="w-4 h-4 text-blue-700" />,
    },
    {
      label: 'Rate Card Proposals',
      count: q?.pendingDeliveryProposals ?? 0,
      to: '/admin/delivery-proposals',
      icon: <Truck className="w-4 h-4 text-slate-600" />,
    },
    {
      label: 'Bank Payment Slips',
      count: q?.pendingBankPaymentSlips ?? 0,
      to: '/admin/finance/verification-queue',
      icon: <CreditCard className="w-4 h-4 text-amber-600" />,
    },
    {
      label: 'Failed Dispatches',
      count: q?.failedNotificationDeliveries ?? 0,
      to: '/admin/notifications',
      icon: <AlertTriangle className="w-4 h-4 text-rose-600" />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Marketplace Workstation"
        subtitle="Live marketplace revenue, order fulfillment splits, and operational action queues"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {summary && (
        <FreshnessIndicator
          cachedAt={summary.systemFreshness.cachedAt}
          ttlSeconds={summary.systemFreshness.ttlSeconds}
          moduleHealth={summary.systemFreshness.moduleHealth}
          onRefresh={() => fetchSummary(true)}
          isRefreshing={isRefreshing}
        />
      )}

      {/* Action Queues Strip */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Pending Review Queues
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {actionQueues.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className="bg-white border border-slate-200 hover:border-blue-300 rounded-lg p-4 flex items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-md bg-slate-100 flex items-center justify-center shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-500 truncate">
                    {item.label}
                  </div>
                  <div className="text-lg font-bold text-slate-900 tabular-nums">
                    {item.count}
                  </div>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
            </Link>
          ))}
        </div>
      </section>

      {/* Primary KPIs */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
          Commerce &amp; Settlement Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Gross Merchandise Value"
            value={formatLKR(ov?.grossMerchandiseValueInCents ?? 0)}
            icon={DollarSign}
            iconColor="text-blue-700"
            subtext={`Logistics: ${formatLKR(ov?.logisticsRevenueInCents ?? 0)}`}
            isDegraded={mod3Degraded}
          />
          <MetricCard
            label="Customer Master Orders"
            value={ov?.totalMasterOrders ?? 0}
            icon={ShoppingCart}
            isDegraded={mod3Degraded}
            subtext="Customer checkouts placed"
            linkTo="/admin/orders"
          />
          <MetricCard
            label="Merchant Suborders"
            value={ov?.totalMerchantSuborders ?? 0}
            icon={Package}
            isDegraded={mod3Degraded}
            subtext="Seller fulfillment packages"
          />
          <MetricCard
            label="Suborder Split Ratio"
            value={splitRatio}
            icon={GitBranch}
            isDegraded={mod3Degraded}
            subtext="Avg seller splits per order"
          />
        </div>
      </section>

      {/* Platform Health & Finances */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Accrued Commission"
          value={formatLKR(ov?.accruedCommissionInCents ?? 0)}
          icon={Percent}
          iconColor="text-emerald-700"
          isDegraded={mod4Degraded}
          linkTo="/admin/finance/commission-ledger"
          subtext="Platform fee revenue"
        />
        <MetricCard
          label="Platform Subsidies"
          value={formatLKR(ov?.platformSubsidyLiabilityInCents ?? 0)}
          icon={Gift}
          iconColor="text-amber-600"
          isDegraded={mod4Degraded}
          linkTo="/admin/finance/subsidies"
          subtext="Payable promo liability"
        />
        <MetricCard
          label="Verified Sellers"
          value={ov?.approvedSellers ?? 0}
          icon={Users}
          isDegraded={mod1Degraded}
          linkTo="/admin/sellers/verification"
          subtext={`${ov?.activeRegisteredCustomers ?? 0} customers registered`}
        />
        <MetricCard
          label="Active Catalogue Parts"
          value={ov?.activeCatalogueProducts ?? 0}
          icon={Package}
          isDegraded={mod2Degraded}
          linkTo="/admin/catalogue"
          subtext="Published spare parts"
        />
      </div>
    </div>
  );
};
