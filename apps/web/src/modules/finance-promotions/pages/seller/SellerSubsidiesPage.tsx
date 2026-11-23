import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Building2,
  AlertCircle,
  Loader2,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  sellerFinanceApi,
  PlatformSubsidyRecord,
  Pagination,
} from '../../api/financePromotionsApi.js';
import { SubsidyStatusBadge } from '../../components/FinanceStatusBadge.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const SellerSubsidiesPage: React.FC = () => {
  const [subsidies, setSubsidies] = useState<PlatformSubsidyRecord[]>([]);
  const [totalAccruedInCents, setTotalAccruedInCents] = useState<number>(0);
  const [totalSettledInCents, setTotalSettledInCents] = useState<number>(0);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchSubsidies = async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await sellerFinanceApi.getSubsidies({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });

      if (res.success && res.data) {
        setSubsidies(res.data.subsidies || []);
        setTotalAccruedInCents(res.data.totalAccruedInCents || 0);
        setTotalSettledInCents(res.data.totalSettledInCents || 0);
        setPagination(
          res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch platform subsidy records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubsidies(1);
  }, [statusFilter]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              AutoDock Subsidy Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
              Platform Reimbursements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Reimbursement obligations owed to your merchant account from AutoDock-funded promotional campaigns.
          </p>
        </div>

        <Link
          to="/seller/finance"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <span>← Back to Finance Overview</span>
        </Link>
      </div>

      {/* Strict Accounting Governance Banner */}
      <div className="p-4 bg-blue-50/80 border border-blue-200/90 rounded-2xl flex items-start gap-3 text-xs text-blue-950">
        <Building2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">Subsidy Settlement & Invoicing Policy Notice</span>
          <p className="text-blue-800 leading-relaxed text-[11px]">
            When customers redeem AutoDock marketplace coupons on your products, the promotional discount
            is recorded as a platform subsidy receivable. In compliance with AutoDock financial governance,
            subsidies are <strong>not automatically netted against monthly commission invoices</strong>.
            Disbursements and reimbursements are processed through dedicated settlement channels.
          </p>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Accrued Platform Subsidy (Payable to You)</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-blue-950 font-mono">
            {formatLKR(totalAccruedInCents)}
          </div>
          <p className="text-[11px] text-slate-400">Total verified subsidy awaiting disbursement</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Settled & Disbursed Subsidies</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-emerald-900 font-mono">
            {formatLKR(totalSettledInCents)}
          </div>
          <p className="text-[11px] text-slate-400">Cumulative historical reimbursements paid</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <label className="font-semibold text-slate-600">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Records</option>
            <option value="ACCRUED">Accrued (Pending Settlement)</option>
            <option value="SETTLED">Settled</option>
          </select>
        </div>

        <span className="text-slate-400 text-[11px]">Total: {pagination.total} entries</span>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchSubsidies(pagination.page)}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Subsidies Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading subsidy ledger records...</span>
          </div>
        ) : subsidies.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <ShieldCheck className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No Subsidy Records Found</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Platform promotional subsidies will appear here when customers redeem AutoDock marketplace coupons on your products.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Subsidy Reference</th>
                  <th className="px-5 py-3">Accrual Date</th>
                  <th className="px-5 py-3">Suborder ID</th>
                  <th className="px-5 py-3">Marketplace Promo</th>
                  <th className="px-5 py-3">Eligible Product Subtotal</th>
                  <th className="px-5 py-3">Subsidy Payable</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subsidies.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-4 font-mono font-bold text-blue-900">
                      {sub.subsidyReference}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(sub.accrualTimestamp).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-mono text-slate-600 text-[11px]">
                      {sub.suborderId.slice(-8)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {sub.promotionCode}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-medium text-slate-800">
                      {formatLKR(sub.eligibleProductAmountInCents)}
                    </td>
                    <td className="px-5 py-4 font-extrabold text-emerald-800 font-mono">
                      {formatLKR(sub.subsidyAmountInCents)}
                    </td>
                    <td className="px-5 py-4">
                      <SubsidyStatusBadge status={sub.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} records)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchSubsidies(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => fetchSubsidies(pagination.page + 1)}
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
