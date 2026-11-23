import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  AlertCircle,
  Tag,
  Building2,
  ArrowRight,
  Loader2,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import {
  sellerFinanceApi,
  CommissionSummary,
  SellerInvoice,
} from '../../api/financePromotionsApi.js';
import { InvoiceStatusBadge } from '../../components/FinanceStatusBadge.js';
import { InvoiceBankInstructionsModal } from '../../components/InvoiceBankInstructionsModal.js';
import { InvoiceReceiptUploadModal } from '../../components/InvoiceReceiptUploadModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const SellerFinanceOverviewPage: React.FC = () => {
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<SellerInvoice[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states for quick actions
  const [selectedInvoice, setSelectedInvoice] = useState<SellerInvoice | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [summaryRes, invoicesRes] = await Promise.all([
        sellerFinanceApi.getSummary(),
        sellerFinanceApi.getInvoices({ limit: 5 }),
      ]);

      if (summaryRes.success && summaryRes.data) {
        setSummary(summaryRes.data);
      }
      if (invoicesRes.success && invoicesRes.data?.invoices) {
        setRecentInvoices(invoicesRes.data.invoices);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load seller finance summary.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Finance & Settlements
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200">
              Merchant Workstation
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative platform commission invoicing, payment verification, and promotion
            subsidy balances.
          </p>
        </div>

        {/* Quick Nav Buttons */}
        <div className="flex items-center gap-2.5">
          <Link
            to="/seller/invoices"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition shadow-2xs"
          >
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Monthly Invoices</span>
          </Link>
          <Link
            to="/seller/promotions"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Tag className="w-4 h-4" />
            <span>Seller Promotions</span>
          </Link>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={fetchDashboardData}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Top Financial Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white p-5 rounded-2xl border border-slate-200 animate-pulse h-28"
            />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Outstanding Invoice Balance */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Outstanding Invoices</span>
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Clock className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-amber-900">
              {formatLKR(summary.outstandingInvoiceBalanceInCents)}
            </div>
            <p className="text-[11px] text-slate-400">Total payable across issued & overdue invoices</p>
          </div>

          {/* Current Month Accrued Commission */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Month Accrual</span>
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <Calendar className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-slate-900">
              {formatLKR(summary.currentMonthAccruedInCents)}
            </div>
            <p className="text-[11px] text-slate-400">
              Commission on completed suborders this month
            </p>
          </div>

          {/* Uninvoiced Accrued Ledger */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Uninvoiced Accrued</span>
              <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <FileText className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-slate-900">
              {formatLKR(summary.uninvoicedAccruedInCents)}
            </div>
            <p className="text-[11px] text-slate-400">Awaiting monthly invoice batch generation</p>
          </div>

          {/* AutoDock Platform Subsidy Accrued */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Platform Subsidies</span>
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <ShieldCheck className="w-4 h-4" />
              </span>
            </div>
            <div className="text-xl font-black text-emerald-800">
              {formatLKR(summary.totalSubsidyAccruedInCents)}
            </div>
            <Link
              to="/seller/subsidies"
              className="text-[11px] text-emerald-700 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>View Subsidy Ledger</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ) : null}

      {/* Subsidy Separation Banner */}
      <div className="p-4 bg-blue-50/70 border border-blue-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
        <div className="flex items-start gap-2.5">
          <Building2 className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-bold">Separation of Subsidy Settlement & Commission Invoices</span>
            <p className="text-blue-800 leading-relaxed text-[11px]">
              In strict accordance with AutoDock governance, platform promotional subsidies are
              recorded separately. Subsidies are settled directly and are not automatically deducted
              from monthly commission invoices.
            </p>
          </div>
        </div>
        <Link
          to="/seller/subsidies"
          className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-2xs text-[11px] text-center"
        >
          Subsidy Ledger
        </Link>
      </div>

      {/* Recent Invoices Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Monthly Commission Invoices</h2>
            <p className="text-xs text-slate-500">Latest 5 billing statements issued for your store</p>
          </div>
          <Link
            to="/seller/invoices"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition"
          >
            <span>View All Invoices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading recent invoices...</span>
          </div>
        ) : recentInvoices.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs space-y-1">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-semibold">No commission invoices issued yet.</p>
            <p className="text-slate-400">
              Monthly invoices are generated at the end of each billing period.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Invoice Number</th>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Commission Total</th>
                  <th className="px-5 py-3">Outstanding Balance</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-blue-900">
                      <Link to={`/seller/invoices/${inv._id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-700">{inv.billingPeriod}</td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {formatLKR(inv.grossCommissionInCents)}
                    </td>
                    <td className="px-5 py-3.5 font-extrabold text-blue-950">
                      {formatLKR(inv.outstandingBalanceInCents)}
                    </td>
                    <td className="px-5 py-3.5">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <Link
                        to={`/seller/invoices/${inv._id}`}
                        className="px-2.5 py-1 text-slate-600 hover:text-blue-600 font-bold transition hover:underline"
                      >
                        Details
                      </Link>
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsBankModalOpen(true);
                          }}
                          className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold transition"
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals for Quick Actions */}
      {selectedInvoice && (
        <>
          <InvoiceBankInstructionsModal
            isOpen={isBankModalOpen}
            onClose={() => setIsBankModalOpen(false)}
            invoiceNumber={selectedInvoice.invoiceNumber}
            outstandingBalanceInCents={selectedInvoice.outstandingBalanceInCents}
            onOpenUpload={() => setIsUploadModalOpen(true)}
          />

          <InvoiceReceiptUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            invoiceId={selectedInvoice._id}
            invoiceNumber={selectedInvoice.invoiceNumber}
            outstandingBalanceInCents={selectedInvoice.outstandingBalanceInCents}
            onUploadSuccess={fetchDashboardData}
          />
        </>
      )}
    </div>
  );
};
