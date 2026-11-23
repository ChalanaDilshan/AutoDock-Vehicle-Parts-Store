import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag,
  Plus,
  ShieldCheck,
  XCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
} from 'lucide-react';
import {
  adminPromotionApi,
  PromotionRecord,
  Pagination,
} from '../../api/financePromotionsApi.js';
import { PromotionStatusBadge } from '../../components/FinanceStatusBadge.js';
import { CreateAdminPromotionModal } from '../../components/CreateAdminPromotionModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const AdminPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [analyticsModalPromo, setAnalyticsModalPromo] = useState<{
    promotion: PromotionRecord;
    redemptionCount: number;
    totalDiscountFundedInCents: number;
  } | null>(null);

  const fetchPromotions = async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminPromotionApi.getPromotions({
        page,
        limit: 20,
        status: statusFilter || undefined,
      });

      if (res.success && res.data) {
        setPromotions(res.data.promotions || []);
        setPagination(
          res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch platform promotions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPromotions(1);
  }, [statusFilter]);

  const handleToggleStatus = async (promo: PromotionRecord) => {
    const newStatus = promo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const actionLabel = newStatus === 'ACTIVE' ? 'activate' : 'pause';

    if (!confirm(`Are you sure you want to ${actionLabel} promotion "${promo.code}"?`)) {
      return;
    }

    try {
      const res = await adminPromotionApi.updateStatus(promo._id, newStatus);
      if (res.success) {
        fetchPromotions(pagination.page);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update promotion status.');
    }
  };

  const handleViewAnalytics = async (promoId: string) => {
    try {
      const res = await adminPromotionApi.getPromotionById(promoId);
      if (res.success && res.data) {
        setAnalyticsModalPromo(res.data);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to load promotion analytics.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Marketplace Promotions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-900 border border-purple-300">
              AutoDock-Funded
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Platform-wide customer promotional campaigns funded directly by AutoDock.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/finance"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <span>← Back to Finance Overview</span>
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Launch Marketplace Promo</span>
          </button>
        </div>
      </div>

      {/* Funding Invariant Banner */}
      <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3 text-xs text-purple-950">
        <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">Platform Subsidy Accounting Notice</span>
          <p className="text-purple-800 leading-relaxed text-[11px]">
            Marketplace promotions created here are classified as <strong>AUTODOCK_FUNDED</strong>.
            Redemptions on customer checkouts are fully recognized as platform subsidy obligations
            owed to the participating sellers.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <label className="font-semibold text-slate-600">Filter Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-purple-500 outline-none"
          >
            <option value="">All Campaigns</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive / Paused</option>
          </select>
        </div>

        <span className="text-slate-400 text-[11px]">Total: {pagination.total} campaigns</span>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchPromotions(pagination.page)}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
            <span>Loading marketplace promotions...</span>
          </div>
        ) : promotions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-3">
            <Tag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No Marketplace Promotions Found</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Launch platform-wide AutoDock-funded promotional campaigns to drive marketplace conversion.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Campaign Title</th>
                  <th className="px-5 py-3">Discount</th>
                  <th className="px-5 py-3">Min Spend</th>
                  <th className="px-5 py-3">Validity</th>
                  <th className="px-5 py-3">Redemptions</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {promotions.map((promo) => {
                  const discountDisplay =
                    promo.discountType === 'PERCENTAGE'
                      ? `${(promo.discountValue / 100).toFixed(0)}% Off`
                      : `${formatLKR(promo.discountValue)} Off`;

                  return (
                    <tr key={promo._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4 font-mono font-bold text-purple-950 tracking-wider">
                        {promo.code}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800">
                        {promo.title}
                      </td>
                      <td className="px-5 py-4 font-bold text-emerald-700">
                        {discountDisplay}
                        {promo.maxDiscountInCents && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Cap: {formatLKR(promo.maxDiscountInCents)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {promo.minSpendInCents > 0 ? formatLKR(promo.minSpendInCents) : 'None'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <span>{new Date(promo.startDate).toLocaleDateString()}</span>
                        <span className="text-slate-400"> → </span>
                        <span>{new Date(promo.endDate).toLocaleDateString()}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-700">
                        {promo.currentUsageCount}
                        {promo.totalUsageLimit ? ` / ${promo.totalUsageLimit}` : ' (unlimited)'}
                      </td>
                      <td className="px-5 py-4">
                        <PromotionStatusBadge status={promo.status} />
                      </td>
                      <td className="px-5 py-4 text-right space-x-2">
                        <button
                          onClick={() => handleViewAnalytics(promo._id)}
                          className="px-2.5 py-1 text-slate-600 hover:text-purple-600 font-bold transition hover:underline"
                        >
                          Metrics
                        </button>
                        <button
                          onClick={() => handleToggleStatus(promo)}
                          className={`px-3 py-1 rounded-lg font-bold transition text-xs ${
                            promo.status === 'ACTIVE'
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200'
                          }`}
                        >
                          {promo.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchPromotions(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => fetchPromotions(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateAdminPromotionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchPromotions(1)}
      />

      {/* Analytics Modal */}
      {analyticsModalPromo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setAnalyticsModalPromo(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10 animate-fadeIn text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Marketplace Campaign Metrics</h3>
                  <p className="text-slate-500 font-mono">{analyticsModalPromo.promotion.code}</p>
                </div>
              </div>
              <button
                onClick={() => setAnalyticsModalPromo(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block">Total Redemptions</span>
                <strong className="text-slate-900 text-lg font-black">
                  {analyticsModalPromo.redemptionCount}
                </strong>
              </div>

              <div className="p-3.5 bg-purple-50/70 rounded-xl border border-purple-200 space-y-1">
                <span className="text-purple-800 block font-semibold">Total AutoDock Subsidy</span>
                <strong className="text-purple-950 text-lg font-black font-mono">
                  {formatLKR(analyticsModalPromo.totalDiscountFundedInCents)}
                </strong>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Funding Source:</span>
                <strong className="text-purple-900">
                  {analyticsModalPromo.promotion.fundingSource}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Per Customer Limit:</span>
                <span className="text-slate-800">
                  {analyticsModalPromo.promotion.perCustomerLimit}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total Redemptions Cap:</span>
                <span className="text-slate-800">
                  {analyticsModalPromo.promotion.totalUsageLimit || 'Unlimited'}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setAnalyticsModalPromo(null)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
