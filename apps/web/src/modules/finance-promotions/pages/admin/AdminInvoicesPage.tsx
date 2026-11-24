import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  ShieldAlert,
} from 'lucide-react';
import {
  adminFinanceApi,
  SellerInvoice,
  Pagination,
} from '../../api/financePromotionsApi.js';
import { InvoiceStatusBadge } from '../../components/FinanceStatusBadge.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const AdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [billingPeriodFilter, setBillingPeriodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sellerIdFilter, setSellerIdFilter] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Batch Generation State
  const [batchPeriod, setBatchPeriod] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  });
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [batchResult, setBatchResult] = useState<{
    generatedCount: number;
    skippedCount: number;
    billingPeriod: string;
  } | null>(null);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [isBatchConfirmOpen, setIsBatchConfirmOpen] = useState<boolean>(false);

  const fetchInvoices = async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminFinanceApi.getInvoices({
        page,
        limit: 20,
        billingPeriod: billingPeriodFilter.trim() || undefined,
        status: statusFilter || undefined,
        sellerId: sellerIdFilter.trim() || undefined,
      });

      if (res.success && res.data) {
        setInvoices(res.data.invoices || []);
        setPagination(
          res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch platform invoices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, [statusFilter]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices(1);
  };

  const handleBatchGenerate = async () => {
    setIsBatchConfirmOpen(false);
    setIsGenerating(true);
    setBatchError(null);
    setBatchResult(null);

    try {
      const res = await adminFinanceApi.generateInvoices({ billingPeriod: batchPeriod });
      if (res.success && res.data) {
        setBatchResult(res.data);
        fetchInvoices(1);
      } else {
        setBatchError(res.message || 'Failed to execute monthly invoice batch.');
      }
    } catch (err: any) {
      setBatchError(err?.message || 'Error occurred while generating invoice batch.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Monthly Invoices & Batch Run
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
              Platform Invoicing
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative billing statements issued to merchants for monthly commission settlement.
          </p>
        </div>

        <Link
          to="/admin/finance"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <span>← Back to Finance Overview</span>
        </Link>
      </div>

      {/* Batch Generation Control Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Monthly Commission Invoice Batch Generation</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregate unassigned accrued ledger entries for a billing period and issue merchant statements.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <input
              type="text"
              placeholder="YYYY-MM"
              value={batchPeriod}
              onChange={(e) => setBatchPeriod(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none w-32"
            />
            <button
              onClick={() => {
                setBatchError(null);
                setBatchResult(null);
                if (!/^\d{4}-\d{2}$/.test(batchPeriod.trim())) {
                  setBatchError('Billing period must be formatted as YYYY-MM (e.g. 2026-11).');
                  return;
                }
                setIsBatchConfirmOpen(true);
              }}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Batch Run</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Batch Feedback Alerts */}
        {batchResult && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Batch generation completed for <strong>{batchResult.billingPeriod}</strong>:{' '}
              <strong>{batchResult.generatedCount}</strong> invoices issued,{' '}
              <strong>{batchResult.skippedCount}</strong> already existed and skipped.
            </span>
          </div>
        )}

        {batchError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{batchError}</span>
          </div>
        )}
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-600">Period:</label>
            <input
              type="text"
              placeholder="YYYY-MM"
              value={billingPeriodFilter}
              onChange={(e) => setBillingPeriodFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs w-28 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ISSUED">Issued</option>
              <option value="PAYMENT_PENDING_VERIFICATION">Verification Pending</option>
              <option value="PARTIALLY_PAID">Partially Paid</option>
              <option value="PAID">Paid / Settled</option>
              <option value="OVERDUE">Overdue</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-600">Seller ID:</label>
            <input
              type="text"
              placeholder="24-char ObjectId"
              value={sellerIdFilter}
              onChange={(e) => setSellerIdFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs w-36 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button
            type="submit"
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold transition shadow-2xs"
          >
            Filter
          </button>
        </div>

        <span className="text-slate-400 text-[11px]">Total: {pagination.total} invoices</span>
      </form>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchInvoices(pagination.page)}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading invoice records...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No Invoices Found</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Execute a monthly invoice batch run or adjust your query filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Seller Store</th>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Commission Total</th>
                  <th className="px-5 py-3">Verified Paid</th>
                  <th className="px-5 py-3">Outstanding</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => {
                  const sObj = typeof inv.sellerId === 'object' ? inv.sellerId : null;
                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-900">
                        <Link to={`/admin/finance/invoices/${inv._id}`} className="hover:underline">
                          {inv.invoiceNumber}
                        </Link>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 block">
                          {sObj?.businessName || sObj?.storeName || inv.sellerBillingSnapshot?.businessName || 'Merchant'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">{inv.billingPeriod}</td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {new Date(inv.issueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900">
                        {formatLKR(inv.grossCommissionInCents)}
                      </td>
                      <td className="px-5 py-3.5 text-emerald-800 font-semibold">
                        {formatLKR(inv.verifiedPaidInCents)}
                      </td>
                      <td className="px-5 py-3.5 font-extrabold text-blue-950 font-mono">
                        {formatLKR(inv.outstandingBalanceInCents)}
                      </td>
                      <td className="px-5 py-3.5">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <Link
                          to={`/admin/finance/invoices/${inv._id}`}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold transition text-xs"
                        >
                          Audit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchInvoices(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => fetchInvoices(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal for Batch Generation */}
      {isBatchConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsBatchConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 z-10 animate-fadeIn text-xs">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Confirm Invoice Batch Execution
              </h3>
              <p className="text-slate-600 leading-relaxed">
                You are about to generate monthly commission invoices for period{' '}
                <strong className="text-slate-900 font-mono font-bold">{batchPeriod}</strong>.
              </p>
              <p className="text-slate-500 text-[11px] pt-1">
                This operation is idempotent. It will scan all unassigned accrued ledger entries in{' '}
                {batchPeriod}, aggregate lines by merchant, and create authoritative invoice records.
                Sellers who already have an invoice for this period will be skipped.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchConfirmOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchGenerate}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
              >
                Confirm & Run Batch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
