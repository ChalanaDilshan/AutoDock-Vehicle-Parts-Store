import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Filter,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react';
import {
  adminFinanceApi,
  CommissionLedgerEntry,
  Pagination,
} from '../../api/financePromotionsApi.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const AdminCommissionLedgerPage: React.FC = () => {
  const [entries, setEntries] = useState<CommissionLedgerEntry[]>([]);
  const [summary, setSummary] = useState<{
    totalCommissionInCents: number;
    totalBaseInCents: number;
  }>({ totalCommissionInCents: 0, totalBaseInCents: 0 });
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Filter state
  const [sellerId, setSellerId] = useState<string>('');
  const [orderId, setOrderId] = useState<string>('');
  const [suborderId, setSuborderId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchLedger = async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminFinanceApi.getCommissionLedger({
        page,
        limit: 20,
        sellerId: sellerId.trim() || undefined,
        orderId: orderId.trim() || undefined,
        suborderId: suborderId.trim() || undefined,
        status: status || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (res.success && res.data) {
        setEntries(res.data.entries || []);
        setSummary(res.data.summary || { totalCommissionInCents: 0, totalBaseInCents: 0 });
        setPagination(
          res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch commission ledger entries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger(1);
  }, [status]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLedger(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Commission Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-900 border border-indigo-300 flex items-center gap-1">
              <Lock className="w-3 h-3 text-indigo-700" />
              <span>Immutable Ledger</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative transactional ledger entries accrued upon suborder completion.
          </p>
        </div>

        <Link
          to="/admin/finance"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <span>← Back to Finance Overview</span>
        </Link>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">
            Filtered Total Commission Accrued
          </span>
          <div className="text-2xl font-black text-emerald-900 font-mono">
            {formatLKR(summary.totalCommissionInCents)}
          </div>
          <p className="text-[11px] text-slate-400">Total commission across matching entries</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 block">
            Filtered Commissionable Base
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatLKR(summary.totalBaseInCents)}
          </div>
          <p className="text-[11px] text-slate-400">Net eligible sales value before rate calculation</p>
        </div>
      </div>

      {/* Filter Bar */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3 text-xs"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block font-semibold text-slate-600 mb-1">Seller ID</label>
            <input
              type="text"
              placeholder="24-char ObjectId"
              value={sellerId}
              onChange={(e) => setSellerId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Suborder ID</label>
            <input
              type="text"
              placeholder="Suborder ID"
              value={suborderId}
              onChange={(e) => setSuborderId(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Ledger Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">All Statuses</option>
              <option value="ACCRUED">Accrued (Uninvoiced)</option>
              <option value="INVOICED">Invoiced</option>
              <option value="ADJUSTED">Adjusted</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-600 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-400 text-[11px]">
            Total Entries: {pagination.total} records
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setSellerId('');
                setOrderId('');
                setSuborderId('');
                setStatus('');
                setStartDate('');
                setEndDate('');
              }}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-semibold transition"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-2xs flex items-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter Ledger</span>
            </button>
          </div>
        </div>
      </form>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchLedger(pagination.page)}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading ledger entries...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <TrendingUp className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No Ledger Entries Found</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Entries are automatically accrued into this ledger when suborders transition to DELIVERED status.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Reference</th>
                  <th className="px-5 py-3">Completed Date</th>
                  <th className="px-5 py-3">Seller</th>
                  <th className="px-5 py-3">Suborder ID</th>
                  <th className="px-5 py-3">Product Sales</th>
                  <th className="px-5 py-3">Delivery (Excl)</th>
                  <th className="px-5 py-3">Base</th>
                  <th className="px-5 py-3">Rate</th>
                  <th className="px-5 py-3">Commission</th>
                  <th className="px-5 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {entries.map((item) => {
                  const sObj = typeof item.sellerId === 'object' ? item.sellerId : null;
                  const sIdStr = sObj?._id || (item.sellerId as string);

                  return (
                    <tr key={item._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-900">
                        {item.ledgerReference}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {new Date(item.completionTimestamp).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold text-slate-800 block">
                          {sObj?.businessName || sObj?.storeName || 'Merchant'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {sIdStr.slice(-6)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-600 text-[11px]">
                        {item.suborderId.slice(-8)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-800">
                        {formatLKR(item.productSubtotalInCents)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {formatLKR(item.deliveryFeeInCents)}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800">
                        {formatLKR(item.commissionableBaseInCents)}
                      </td>
                      <td className="px-5 py-3.5">
                        {item.isExempt ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Exempt (0%)
                          </span>
                        ) : (
                          <span className="font-mono font-semibold text-slate-700">
                            {(item.appliedRateBasisPoints / 100).toFixed(2)}%
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 font-extrabold text-blue-950 font-mono">
                        {formatLKR(item.commissionAmountInCents)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {item.status === 'INVOICED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Invoiced
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Accrued
                          </span>
                        )}
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
                onClick={() => fetchLedger(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => fetchLedger(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
