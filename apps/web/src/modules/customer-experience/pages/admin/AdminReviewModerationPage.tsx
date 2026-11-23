import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  ShieldAlert,
  Star,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
} from 'lucide-react';
import {
  ProductReview,
  ReviewModerationStatus,
  reviewApi,
} from '../../api/customerExperienceApi.js';

export const AdminReviewModerationPage: React.FC = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Moderation action modal
  const [selectedReview, setSelectedReview] = useState<ProductReview | null>(null);
  const [moderationReason, setModerationReason] = useState<string>('');
  const [targetStatus, setTargetStatus] = useState<ReviewModerationStatus>('HIDDEN_BY_ADMIN');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadReviews = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await reviewApi.adminList({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        limit: 50,
      });
      if (response.success && response.data?.items) {
        setReviews(response.data.items);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load reviews for moderation.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const handleOpenModeration = (review: ProductReview, action: ReviewModerationStatus) => {
    setSelectedReview(review);
    setTargetStatus(action);
    setModerationReason('');
    setModalError(null);
  };

  const handleConfirmModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReview) return;

    if (targetStatus === 'HIDDEN_BY_ADMIN' && !moderationReason.trim()) {
      setModalError('A justification reason is mandatory when hiding a customer review.');
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      const response = await reviewApi.adminModerate(selectedReview._id, {
        status: targetStatus,
        moderationReason: moderationReason.trim() || 'Restored by administrator.',
      });

      if (response.success) {
        setActionSuccess(
          `Review has been ${targetStatus === 'HIDDEN_BY_ADMIN' ? 'hidden' : 'restored'}.`
        );
        setTimeout(() => setActionSuccess(null), 3000);
        setSelectedReview(null);
        loadReviews();
      }
    } catch (err: any) {
      setModalError(err?.message || 'Failed to update review moderation status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Admin Moderation Workstation
            </span>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
              Post-Publication Review Governance
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">Customer Review Moderation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit published customer feedback, inspect reported content, and hide abusive entries with mandatory audit logs.
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 border border-slate-300 rounded-xl bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="HIDDEN_BY_ADMIN">Hidden by Admin</option>
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Reviews Moderation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
            <p className="text-xs font-medium">Loading review records...</p>
          </div>
        ) : reviews.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="px-5 py-3.5">Spare Part / SKU</th>
                  <th className="px-4 py-3.5">Rating</th>
                  <th className="px-5 py-3.5">Comment</th>
                  <th className="px-4 py-3.5">Customer</th>
                  <th className="px-4 py-3.5">Moderation Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reviews.map((rev) => {
                  const prod =
                    typeof rev.productId === 'object' && rev.productId !== null
                      ? rev.productId
                      : { name: 'Part ID: ' + rev.productId, sku: '' };

                  const reviewer =
                    typeof rev.userId === 'object' && rev.userId !== null
                      ? `${(rev.userId as any).firstName} ${(rev.userId as any).lastName || ''}`
                      : 'Customer ' + rev.userId;

                  const isHidden = rev.moderationStatus === 'HIDDEN_BY_ADMIN';

                  return (
                    <tr key={rev._id} className="hover:bg-slate-50/70 transition">
                      <td className="px-5 py-3.5 font-bold text-slate-900 max-w-xs truncate">
                        {prod.name}
                        {prod.sku && (
                          <span className="block text-[11px] font-mono text-slate-400 font-normal">
                            SKU: {prod.sku}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= rev.rating ? 'fill-current text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 max-w-sm text-slate-700 leading-relaxed">
                        <p>{rev.comment}</p>
                        {rev.moderationReason && (
                          <span className="inline-block mt-1 text-[11px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            Reason: {rev.moderationReason}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-medium text-slate-700">{reviewer}</td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            isHidden
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isHidden ? 'Hidden by Admin' : 'Published'}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 text-right">
                        {isHidden ? (
                          <button
                            type="button"
                            onClick={() => handleOpenModeration(rev, 'PUBLISHED')}
                            className="px-2.5 py-1 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded text-xs font-bold transition inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Restore</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenModeration(rev, 'HIDDEN_BY_ADMIN')}
                            className="px-2.5 py-1 text-rose-700 bg-rose-50 hover:bg-rose-100 rounded text-xs font-bold transition inline-flex items-center gap-1"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Hide</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">No Reviews Found</h3>
            <p className="text-xs text-slate-500">
              There are no customer reviews matching the selected filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* Moderation Action Modal */}
      {selectedReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSelectedReview(null)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  {targetStatus === 'HIDDEN_BY_ADMIN' ? 'Hide Customer Review' : 'Restore Customer Review'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReview(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmModeration} className="p-6 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="text-slate-400 uppercase font-bold text-[10px]">Review Comment</div>
                <div className="text-slate-700 italic">"{selectedReview.comment}"</div>
              </div>

              {targetStatus === 'HIDDEN_BY_ADMIN' ? (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Moderation Justification Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={moderationReason}
                    onChange={(e) => setModerationReason(e.target.value)}
                    placeholder="Provide mandatory reason for audit logging (e.g. Hate speech, commercial spam, false claim)..."
                    className="w-full text-xs p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              ) : (
                <p className="text-xs text-slate-600">
                  Restoring this review will immediately re-publish it to the public product page and recompute the average product rating.
                </p>
              )}

              {modalError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  disabled={isSubmitting}
                  className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm text-white ${
                    targetStatus === 'HIDDEN_BY_ADMIN'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{targetStatus === 'HIDDEN_BY_ADMIN' ? 'Confirm Hide' : 'Confirm Restore'}</span>
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
