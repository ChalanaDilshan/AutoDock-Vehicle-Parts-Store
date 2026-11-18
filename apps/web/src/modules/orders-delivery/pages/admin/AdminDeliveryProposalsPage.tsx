import React, { useState, useEffect } from 'react';
import {
  Truck,
  ChevronRight,
  Loader2,
  AlertCircle,
  Check,
  X,
} from 'lucide-react';
import {
  deliveryRateApi,
  DeliveryRateProposalRecord,
} from '../../api/ordersDeliveryApi.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const AdminDeliveryProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<DeliveryRateProposalRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('PENDING_APPROVAL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review Modal State
  const [selectedProposal, setSelectedProposal] =
    useState<DeliveryRateProposalRecord | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState<boolean>(false);
  const [decisionNotes, setDecisionNotes] = useState<string>('');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isRejecting, setIsRejecting] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchProposals = async (status: string = statusFilter) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await deliveryRateApi.getAdminProposals(status || undefined);
      if (response.success && response.data) {
        setProposals(response.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch delivery rate proposals.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals(statusFilter);
  }, [statusFilter]);

  const handleOpenReview = (proposal: DeliveryRateProposalRecord) => {
    setSelectedProposal(proposal);
    setDecisionNotes('');
    setRejectionReason('');
    setIsRejecting(false);
    setIsReviewModalOpen(true);
  };

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedProposal) return;

    if (decision === 'REJECT' && !rejectionReason.trim()) {
      alert('Please state a reason for rejecting this delivery rate proposal.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await deliveryRateApi.decideProposal(selectedProposal._id, {
        decision,
        reviewerNotes: decisionNotes.trim() || undefined,
        rejectionReason: decision === 'REJECT' ? rejectionReason.trim() : undefined,
      });

      if (response.success) {
        setIsReviewModalOpen(false);
        fetchProposals(statusFilter);
      }
    } catch (err: any) {
      alert(err?.message || `Failed to ${decision.toLowerCase()} proposal.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Delivery Rate Proposals Verification
          </h1>
          <p className="text-xs text-slate-500">
            Platform administrator governance over merchant district delivery charges
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none bg-white"
          >
            <option value="">All Proposals</option>
            <option value="PENDING_APPROVAL">Pending Verification</option>
            <option value="APPROVED">Approved & Active</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3" data-testid="admin-proposals-loading">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500">Loading delivery rate proposals queue...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-4 shadow-sm" data-testid="admin-proposals-empty">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Truck className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">Queue is Clear</h2>
          <p className="text-xs text-slate-500">
            No delivery rate proposals currently match the selected status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="admin-proposals-grid">
          {proposals.map((prop) => (
            <div
              key={prop._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 flex flex-col justify-between hover:border-blue-300 transition"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    ID: {prop._id.slice(-8)}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      prop.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : prop.status === 'REJECTED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {prop.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1">
                  <p>
                    Seller Account ID: <strong className="text-slate-900">{prop.sellerId}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Submitted: {new Date(prop.createdAt).toLocaleDateString()}
                  </p>
                  <p className="font-semibold text-blue-600 pt-1">
                    Coverage: {prop.districtRates?.length || 0} Districts Proposed
                  </p>
                </div>

                {/* Preview sample rates */}
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                  {prop.districtRates?.slice(0, 3).map((r) => (
                    <div key={r.district} className="flex justify-between text-slate-600">
                      <span>{r.district}</span>
                      <span className="font-bold text-slate-900">{formatLKR(r.deliveryFeeInCents)}</span>
                    </div>
                  ))}
                  {prop.districtRates && prop.districtRates.length > 3 && (
                    <span className="text-[10px] text-slate-400 block pt-0.5">
                      + {prop.districtRates.length - 3} more districts...
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleOpenReview(prop)}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm mt-3"
              >
                <span>Inspect & Decide</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {isReviewModalOpen && selectedProposal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsReviewModalOpen(false)}
          />

          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Review Delivery Proposal</h3>
                <p className="text-xs text-slate-500">Merchant Store: {selectedProposal.sellerId}</p>
              </div>
              <button
                onClick={() => setIsReviewModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Rates Table */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Proposed District Delivery Rates ({selectedProposal.districtRates?.length} Districts)
              </span>
              <div className="max-h-56 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                {selectedProposal.districtRates?.map((r) => (
                  <div key={r.district} className="p-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900 block">{r.district} District</span>
                      <span className="text-[10px] text-slate-400">
                        Estimated: {r.estimatedDaysMin}-{r.estimatedDaysMax} business days
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 font-mono">
                      {formatLKR(r.deliveryFeeInCents)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Controls */}
            {isRejecting ? (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <label className="block text-xs font-bold text-red-700">
                  State Reason for Rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Rate exceeds platform maximum ceiling, unrealistic delivery timeline..."
                  rows={3}
                  className="w-full px-3 py-2 border border-red-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500 focus:outline-none"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(false)}
                    className="px-3 py-1.5 text-xs text-slate-600"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('REJECT')}
                    disabled={isSubmitting || !rejectionReason.trim()}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reviewer Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={decisionNotes}
                    onChange={(e) => setDecisionNotes(e.target.value)}
                    placeholder="e.g. Verified against standard courier tariffs"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setIsRejecting(true)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 rounded-xl text-xs font-bold transition"
                  >
                    Reject Proposal
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision('APPROVE')}
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Activate Rates</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
