import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  Package,
  Layers,
  Users,
  ShieldCheck,
  Truck,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  ShieldAlert,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminPlatformApi, DashboardSummaryData } from '../api/adminPlatformApi.js';
import { MetricCard } from '../components/MetricCard.js';
import { FreshnessIndicator } from '../components/FreshnessIndicator.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';

export const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSummary = async (forceFresh: boolean = false) => {
    if (forceFresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setErrorMessage(null);

    try {
      const res = await adminPlatformApi.getDashboardSummary(forceFresh);
      if (res.success && res.data) {
        setSummary(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to retrieve platform dashboard summary.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchSummary(false);
  }, []);

  return (
    <div className="space-y-8 pb-16">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            Executive Marketplace Workstation
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time platform overview, cross-module health status, and administrative action backlogs.
          </p>
        </div>

        {/* Global Freshness & Degradation Bar */}
        <FreshnessIndicator
          cachedAt={summary?.systemFreshness?.cachedAt}
          ttlSeconds={summary?.systemFreshness?.ttlSeconds}
          moduleHealth={summary?.systemFreshness?.moduleHealth}
          onRefresh={() => fetchSummary(true)}
          isRefreshing={isRefreshing}
        />
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading && !summary && (
        <div className="p-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span className="text-xs font-semibold">Aggregating cross-module KPIs...</span>
        </div>
      )}

      {/* Action Queues Callout */}
      {summary && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Pending Administrative Action Queues</span>
            </h2>
            <span className="text-[11px] font-semibold text-slate-400">
              Requires Operational Review
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* 1. Seller KYC Queue (MOD-01) */}
            <Link
              to="/admin/sellers/verification"
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition block group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Seller KYC Verification</span>
                <ShieldCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {summary.actionQueues.pendingSellerKYC}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Awaiting Review</span>
                <span className="text-blue-600 font-bold group-hover:underline">MOD-01 →</span>
              </p>
            </Link>

            {/* 2. Delivery Rates Queue (MOD-03) */}
            <Link
              to="/admin/delivery-proposals"
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition block group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Rate Card Proposals</span>
                <Truck className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {summary.actionQueues.pendingDeliveryProposals}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Island-wide Rates</span>
                <span className="text-blue-600 font-bold group-hover:underline">MOD-03 →</span>
              </p>
            </Link>

            {/* 3. Bank Transfer Slips Queue (MOD-03) */}
            <Link
              to="/admin/orders"
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition block group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Bank Payment Slips</span>
                <FileText className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {summary.actionQueues.pendingBankPaymentSlips}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Slip Verification</span>
                <span className="text-blue-600 font-bold group-hover:underline">MOD-03 →</span>
              </p>
            </Link>

            {/* 4. Overdue Invoices (MOD-04) */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 block">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Overdue Invoices</span>
                <ShieldAlert className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {summary.actionQueues.unpaidOverdueInvoices}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Commission Receivables</span>
                <span className="text-slate-400 font-bold">MOD-04</span>
              </p>
            </div>

            {/* 5. Failed Notifications Queue (MOD-05) */}
            <Link
              to="/admin/notifications"
              className="p-4 bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-xs transition block group"
            >
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Failed Dispatches</span>
                <AlertCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600">
                {summary.actionQueues.failedNotificationDeliveries}
              </div>
              <p className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Retry Pipeline</span>
                <span className="text-blue-600 font-bold group-hover:underline">MOD-05 →</span>
              </p>
            </Link>
          </div>
        </div>
      )}

      {/* Marketplace Financials & Transaction Volume */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            <span>Marketplace Gross Value & Platform Revenue</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            Sri Lankan Rupees (LKR)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Gross Merchandise Value (GMV)"
            value={formatLKR(summary?.overview.grossMerchandiseValueInCents || 0)}
            subtext="Total vehicle parts value across delivered merchant suborders."
            icon={TrendingUp}
            iconColor="text-emerald-600"
            badge={{ text: 'Completed Parts', variant: 'success' }}
            isDegraded={summary?.systemFreshness?.moduleHealth.MOD_03 === 'DEGRADED'}
            timeContext="Synchronous Snapshot"
          />

          <MetricCard
            label="Logistics Delivery Revenue"
            value={formatLKR(summary?.overview.logisticsRevenueInCents || 0)}
            subtext="Island-wide courier shipping charges paid by customers."
            icon={Truck}
            iconColor="text-blue-600"
            badge={{ text: 'Shipping Pool', variant: 'info' }}
            isDegraded={summary?.systemFreshness?.moduleHealth.MOD_03 === 'DEGRADED'}
            timeContext="25 Districts"
          />

          <MetricCard
            label="Earned Platform Commission"
            value={formatLKR(summary?.overview.accruedCommissionInCents || 0)}
            subtext="Marketplace commission accrued from vendor catalogue sales."
            icon={DollarSign}
            iconColor="text-indigo-600"
            badge={{ text: 'AutoDock Fee', variant: 'neutral' }}
            isDegraded={summary?.systemFreshness?.moduleHealth.MOD_04 === 'DEGRADED'}
            timeContext="Accrued Basis"
          />

          <MetricCard
            label="Platform Promotional Subsidy"
            value={formatLKR(summary?.overview.platformSubsidyLiabilityInCents || 0)}
            subtext="Promotional discounts funded directly by AutoDock (not vendor-funded)."
            icon={ShieldAlert}
            iconColor="text-amber-600"
            badge={{ text: 'Platform Burn', variant: 'warning' }}
            isDegraded={summary?.systemFreshness?.moduleHealth.MOD_04 === 'DEGRADED'}
            timeContext="Liability"
          />
        </div>
      </div>

      {/* Marketplace Orders: STRICT SEPARATION of Master Orders vs Merchant Suborders */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Package className="w-4 h-4 text-blue-600" />
            <span>Order Velocity & Basket Diversity (Strict Separation)</span>
          </h2>
          <span className="text-[11px] text-slate-400">
            Master Checkouts vs. Merchant Fulfillment Suborders
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Customer Master Orders"
            value={summary?.overview.totalMasterOrders || 0}
            subtext="Distinct shopping cart checkout transactions by vehicle owners."
            icon={Package}
            iconColor="text-blue-600"
            badge={{ text: 'Checkout Baskets', variant: 'info' }}
            linkTo="/admin/orders"
            isDegraded={summary?.systemFreshness?.moduleHealth.MOD_03 === 'DEGRADED'}
          />

          <MetricCard
            label="Merchant Suborders"
            value={summary?.overview.totalMerchantSuborders || 0}
            subtext="Discrete merchant fulfillment packages routed to individual sellers."
            icon={Layers}
            iconColor="text-purple-600"
            badge={{ text: 'Vendor Packages', variant: 'neutral' }}
            isDegraded={summary?.systemFreshness?.moduleHealth.MOD_03 === 'DEGRADED'}
          />

          <MetricCard
            label="Suborder-to-Master Split Ratio"
            value={
              summary && summary.overview.totalMasterOrders > 0
                ? (summary.overview.totalMerchantSuborders / summary.overview.totalMasterOrders).toFixed(2) + 'x'
                : '1.00x'
            }
            subtext="Average number of vendor packages generated per customer order."
            icon={TrendingUp}
            iconColor="text-emerald-600"
            badge={{ text: 'Multi-Vendor Split', variant: 'success' }}
          />

          <MetricCard
            label="Active Catalogue Parts"
            value={summary?.overview.activeCatalogueProducts || 0}
            subtext="Verified spare parts indexed and available in the public catalog."
            icon={Layers}
            iconColor="text-amber-600"
            badge={{ text: 'Live Listings', variant: 'neutral' }}
            linkTo="/admin/catalogue"
            isDegraded={summary?.systemFreshness?.moduleHealth.MOD_02 === 'DEGRADED'}
          />
        </div>
      </div>

      {/* Platform Participants */}
      <div className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-2">
          <Users className="w-4 h-4 text-slate-600" />
          <span>Platform Participant Base</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <MetricCard
            label="Active Registered Customers"
            value={summary?.overview.activeRegisteredCustomers || 0}
            subtext="Vehicle owners with active verified buyer accounts and saved garages."
            icon={Users}
            iconColor="text-blue-600"
            badge={{ text: 'Car Owners', variant: 'info' }}
            isDegraded={summary?.systemFreshness?.moduleHealth.MOD_01 === 'DEGRADED'}
          />

          <MetricCard
            label="Approved & Verified Merchants"
            value={summary?.overview.approvedSellers || 0}
            subtext="Automotive spare part vendors with verified physical or digital stores."
            icon={ShieldCheck}
            iconColor="text-emerald-600"
            badge={{ text: 'Approved Sellers', variant: 'success' }}
            linkTo="/admin/sellers/verification"
            isDegraded={summary?.systemFreshness?.moduleHealth.MOD_01 === 'DEGRADED'}
          />
        </div>
      </div>

      {/* Quick Navigation to Module Workstations */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Integrated Module Workstations
            </h3>
            <p className="text-xs text-slate-500">
              Access domain management screens maintained across AutoDock modules.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <Link
            to="/admin/sellers/verification"
            className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition flex items-center justify-between"
          >
            <div>
              <span className="font-bold text-slate-800 block">MOD-01: Seller KYC</span>
              <span className="text-[11px] text-slate-500">Identity & Merchant Onboarding</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/admin/catalogue"
            className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition flex items-center justify-between"
          >
            <div>
              <span className="font-bold text-slate-800 block">MOD-02: Catalogue Taxonomy</span>
              <span className="text-[11px] text-slate-500">Categories, Brands & Reviews</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/admin/orders"
            className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition flex items-center justify-between"
          >
            <div>
              <span className="font-bold text-slate-800 block">MOD-03: Orders & Slips</span>
              <span className="text-[11px] text-slate-500">Master Orders & Rate Cards</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>

          <Link
            to="/admin/audit-logs"
            className="p-3 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 transition flex items-center justify-between"
          >
            <div>
              <span className="font-bold text-slate-800 block">MOD-05: Audit Trail</span>
              <span className="text-[11px] text-slate-500">Security & Compliance Log</span>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </Link>
        </div>
      </div>
    </div>
  );
};
