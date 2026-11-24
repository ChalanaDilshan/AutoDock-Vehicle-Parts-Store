import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  adminFinanceApi,
  SellerCommissionExemption,
  Pagination,
} from '../../api/financePromotionsApi.js';
import { ExemptionStatusBadge } from '../../components/FinanceStatusBadge.js';

export const AdminSellerExemptionsPage: React.FC = () => {
  const [exemptions, setExemptions] = useState<SellerCommissionExemption[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sellerIdFilter, setSellerIdFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Grant Modal
  const [isGrantModalOpen, setIsGrantModalOpen] = useState<boolean>(false);
  const [grantSellerId, setGrantSellerId] = useState<string>('');
  const [grantReason, setGrantReason] = useState<string>('');
  const [isGranting, setIsGranting] = useState<boolean>(false);
  const [grantError, setGrantError] = useState<string | null>(null);

  // Revoke Modal
  const [revokingExemption, setRevokingExemption] = useState<SellerCommissionExemption | null>(
    null
  );
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [isRevoking, setIsRevoking] = useState<boolean>(false);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const fetchExemptions = async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminFinanceApi.getExemptions({
        page,
        limit: 20,
        status: statusFilter || undefined,
        sellerId: sellerIdFilter.trim() || undefined,
      });

      if (res.success && res.data) {
        setExemptions(res.data.exemptions || []);
        setPagination(
          res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch seller exemptions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExemptions(1);
  }, [statusFilter]);

  const handleGrantSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrantError(null);

    const cleanSellerId = grantSellerId.trim();
    if (!/^[0-9a-fA-F]{24}$/.test(cleanSellerId)) {
      setGrantError('Seller ID must be a valid 24-character hexadecimal ObjectId.');
      return;
    }

    if (!grantReason.trim() || grantReason.trim().length < 10) {
      setGrantError('Reason must be at least 10 characters explaining this commission exemption.');
      return;
    }

    setIsGranting(true);

    try {
      const res = await adminFinanceApi.grantExemption({
        sellerId: cleanSellerId,
        reason: grantReason.trim(),
      });

      if (res.success) {
        setIsGrantModalOpen(false);
        setGrantSellerId('');
        setGrantReason('');
        fetchExemptions(1);
      } else {
        setGrantError(res.message || 'Failed to grant commission exemption.');
      }
    } catch (err: any) {
      setGrantError(err?.message || 'An error occurred while granting exemption.');
    } finally {
      setIsGranting(false);
    }
  };

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingExemption) return;
    setRevokeError(null);

    if (!revokeReason.trim() || revokeReason.trim().length < 10) {
      setRevokeError('Revocation reason must be at least 10 characters.');
      return;
    }

    const sId =
      typeof revokingExemption.sellerId === 'object'
        ? revokingExemption.sellerId._id
        : revokingExemption.sellerId;

    setIsRevoking(true);

    try {
      const res = await adminFinanceApi.revokeExemption(sId, {
        reason: revokeReason.trim(),
      });

      if (res.success) {
        setRevokingExemption(null);
        setRevokeReason('');
        fetchExemptions(pagination.page);
      } else {
        setRevokeError(res.message || 'Failed to revoke exemption.');
      }
    } catch (err: any) {
      setRevokeError(err?.message || 'An error occurred while revoking exemption.');
    } finally {
      setIsRevoking(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Seller Commission Exemptions
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
              Merchant Policy
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Manage 0% commission exemptions granted to strategic merchant partners.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/admin/finance"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
          >
            <span>← Finance Overview</span>
          </Link>
          <button
            onClick={() => {
              setGrantError(null);
              setIsGrantModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Grant Seller Exemption</span>
          </button>
        </div>
      </div>

      {/* Governance Invariant Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-sm">Commission Exemption Invariant Rule</span>
          <p className="text-amber-800 leading-relaxed text-[11px]">
            Granting or revoking an exemption takes effect on <strong>future eligible completed suborders</strong>.
            Exemptions do not retroactively erase historical invoices or alter immutable ledger entries
            already recorded in the commission ledger.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-600">Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">All Exemptions</option>
              <option value="ACTIVE">Active (0% Exempt)</option>
              <option value="REVOKED">Revoked</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-semibold text-slate-600">Seller ID:</label>
            <input
              type="text"
              placeholder="Search 24-char ObjectId"
              value={sellerIdFilter}
              onChange={(e) => setSellerIdFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs w-48 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              onClick={() => fetchExemptions(1)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
            >
              Search
            </button>
          </div>
        </div>

        <span className="text-slate-400 text-[11px]">Total: {pagination.total} records</span>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchExemptions(pagination.page)}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Exemptions Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            <span>Loading exemptions...</span>
          </div>
        ) : exemptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No Commission Exemptions Found</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              Grant strategic commission exemptions to merchants for specific contractual promotions.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Seller ID / Store</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Exemption Reason</th>
                  <th className="px-5 py-3">Activated By</th>
                  <th className="px-5 py-3">Activated At</th>
                  <th className="px-5 py-3">Revocation Info</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exemptions.map((ex) => {
                  const sellerObj = typeof ex.sellerId === 'object' ? ex.sellerId : null;
                  const sellerIdStr = sellerObj?._id || (ex.sellerId as string);

                  return (
                    <tr key={ex._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block">
                          {sellerObj?.businessName || sellerObj?.storeName || 'Merchant'}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          {sellerIdStr}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <ExemptionStatusBadge status={ex.status} />
                      </td>
                      <td className="px-5 py-4 text-slate-700 max-w-xs">{ex.reason}</td>
                      <td className="px-5 py-4 text-slate-600">
                        {typeof ex.activatedBy === 'object' && ex.activatedBy
                          ? `${ex.activatedBy.firstName || ''} ${ex.activatedBy.lastName || ''}`
                          : 'Admin'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {new Date(ex.activatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-[11px] text-slate-500 max-w-xs">
                        {ex.status === 'REVOKED' ? (
                          <div className="space-y-0.5">
                            <span className="text-rose-700 font-semibold block">
                              {ex.revocationReason}
                            </span>
                            <span className="text-slate-400">
                              {ex.revokedAt ? new Date(ex.revokedAt).toLocaleDateString() : ''}
                            </span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        {ex.status === 'ACTIVE' && (
                          <button
                            onClick={() => {
                              setRevokingExemption(ex);
                              setRevokeError(null);
                              setRevokeReason('');
                            }}
                            className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold transition text-xs"
                          >
                            Revoke
                          </button>
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
                onClick={() => fetchExemptions(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => fetchExemptions(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Grant Exemption Modal */}
      {isGrantModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsGrantModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 z-10 animate-fadeIn text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Grant Commission Exemption</h3>
                  <p className="text-slate-500">Enable 0% commission for a specific seller</p>
                </div>
              </div>
              <button
                onClick={() => setIsGrantModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {grantError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{grantError}</span>
              </div>
            )}

            <form onSubmit={handleGrantSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Target Seller ID (24-Hex MongoDB ObjectId) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. 64b8f...24 chars"
                  value={grantSellerId}
                  onChange={(e) => setGrantSellerId(e.target.value.trim())}
                  required
                  maxLength={24}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Exemption Policy Reason (Min 10 characters) *
                </label>
                <textarea
                  placeholder="e.g. Strategic Tier-1 OEM distributor partnership contract agreement..."
                  value={grantReason}
                  onChange={(e) => setGrantReason(e.target.value)}
                  required
                  minLength={10}
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsGrantModalOpen(false)}
                  disabled={isGranting}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isGranting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {isGranting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Granting...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Grant Exemption</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Revoke Exemption Modal */}
      {revokingExemption && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setRevokingExemption(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 z-10 animate-fadeIn text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Revoke Commission Exemption</h3>
                  <p className="text-slate-500">Restore standard platform commission</p>
                </div>
              </div>
              <button
                onClick={() => setRevokingExemption(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {revokeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{revokeError}</span>
              </div>
            )}

            <form onSubmit={handleRevokeSubmit} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <span className="text-slate-500 block">Revoking Exemption For:</span>
                <strong className="text-slate-900 font-mono">
                  {typeof revokingExemption.sellerId === 'object'
                    ? revokingExemption.sellerId.businessName || revokingExemption.sellerId._id
                    : revokingExemption.sellerId}
                </strong>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Revocation Reason (Min 10 characters) *
                </label>
                <textarea
                  placeholder="e.g. Promotional partner period expired as agreed on annual review..."
                  value={revokeReason}
                  onChange={(e) => setRevokeReason(e.target.value)}
                  required
                  minLength={10}
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRevokingExemption(null)}
                  disabled={isRevoking}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRevoking}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs"
                >
                  {isRevoking ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Revoking...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Confirm Revocation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
