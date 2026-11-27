import React, { useState, useEffect } from 'react';
import { EyeOff, Eye, Trash2, Star, MessageSquare } from 'lucide-react';
import {
  ProductReview,
  ReviewModerationStatus,
  reviewApi,
} from '../../api/customerExperienceApi.js';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Modal,
  PageHeader,
} from '../../../../shared/components/index.js';

export const AdminReviewModerationPage: React.FC = () => {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [moderatingReview, setModeratingReview] = useState<ProductReview | null>(null);
  const [targetStatus, setTargetStatus] =
    useState<ReviewModerationStatus>('HIDDEN_BY_ADMIN');
  const [moderationReason, setModerationReason] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReviews = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await reviewApi.adminList({
        status: statusFilter || undefined,
        limit: 50,
      });
      if (res.success && res.data) {
        setReviews(res.data.items || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load customer reviews.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [statusFilter]);

  const openModerationModal = (
    review: ProductReview,
    status: ReviewModerationStatus
  ) => {
    setModeratingReview(review);
    setTargetStatus(status);
    setModerationReason('');
    setModalError(null);
  };

  const handleConfirmModeration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moderatingReview) return;

    if (
      (targetStatus === 'HIDDEN_BY_ADMIN' || targetStatus === 'REMOVED_BY_ADMIN') &&
      !moderationReason.trim()
    ) {
      setModalError(
        'A justification reason is mandatory when hiding a customer review.'
      );
      return;
    }

    setIsSubmitting(true);
    setModalError(null);
    try {
      await reviewApi.adminModerate(moderatingReview._id, {
        status: targetStatus,
        moderationReason: moderationReason.trim() || 'Restored to public listing',
      });
      setModeratingReview(null);
      await loadReviews();
    } catch (err: any) {
      setModalError(err?.message || 'Failed to update moderation status.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge = (status: ReviewModerationStatus) => {
    if (status === 'PUBLISHED') return <Badge variant="success">Published</Badge>;
    if (status === 'HIDDEN_BY_ADMIN') return <Badge variant="warning">Hidden</Badge>;
    return <Badge variant="danger">Removed</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Review Moderation"
        subtitle="Audit buyer reviews for spam, policy violations, and verified authenticity"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap gap-2">
        {[
          { value: '', label: 'All Reviews' },
          { value: 'PUBLISHED', label: 'Live Reviews' },
          { value: 'HIDDEN_BY_ADMIN', label: 'Hidden Reviews' },
          { value: 'REMOVED_BY_ADMIN', label: 'Removed Reviews' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : reviews.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="w-6 h-6" />}
          title="No reviews match this filter"
          description="Customer product reviews requiring moderation will appear here."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          {reviews.map((rev) => {
            const productName =
              typeof rev.productId === 'object' && rev.productId
                ? rev.productId.name
                : 'Spare Part';
            const reviewer =
              typeof rev.userId === 'object' && rev.userId
                ? `${rev.userId.firstName} ${rev.userId.lastName}`
                : 'Customer';

            return (
              <div
                key={rev._id}
                className="p-5 flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {productName}
                    </span>
                    {statusBadge(rev.moderationStatus)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{reviewer}</span>
                    <span>&middot;</span>
                    <span className="inline-flex items-center gap-0.5 text-amber-600 font-medium">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      {rev.rating}/5
                    </span>
                    <span>&middot;</span>
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{rev.comment}</p>
                  {rev.moderationReason && (
                    <p className="text-xs text-slate-500">
                      Reason: {rev.moderationReason}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {rev.moderationStatus === 'PUBLISHED' ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<EyeOff className="w-3.5 h-3.5" />}
                        onClick={() => openModerationModal(rev, 'HIDDEN_BY_ADMIN')}
                      >
                        Hide
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        leftIcon={<Trash2 className="w-3.5 h-3.5" />}
                        onClick={() => openModerationModal(rev, 'REMOVED_BY_ADMIN')}
                      >
                        Remove
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      leftIcon={<Eye className="w-3.5 h-3.5" />}
                      onClick={() => openModerationModal(rev, 'PUBLISHED')}
                    >
                      Restore
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={Boolean(moderatingReview)}
        onClose={() => setModeratingReview(null)}
        title={
          targetStatus === 'HIDDEN_BY_ADMIN'
            ? 'Hide Customer Review'
            : targetStatus === 'REMOVED_BY_ADMIN'
              ? 'Remove Customer Review'
              : 'Restore Customer Review'
        }
        size="sm"
      >
        <form onSubmit={handleConfirmModeration} className="space-y-4">
          {modalError && <Alert variant="danger">{modalError}</Alert>}

          <div>
            <label
              htmlFor="moderation-reason"
              className="block text-sm font-medium text-slate-700 mb-1.5"
            >
              Moderation Justification Reason *
            </label>
            <textarea
              id="moderation-reason"
              rows={3}
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
              placeholder="Explain why this review is being moderated..."
              className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-[#E11D30] focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModeratingReview(null)}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant={targetStatus === 'PUBLISHED' ? 'primary' : 'danger'}
              isLoading={isSubmitting}
            >
              {targetStatus === 'HIDDEN_BY_ADMIN'
                ? 'Confirm Hide'
                : targetStatus === 'REMOVED_BY_ADMIN'
                  ? 'Confirm Remove'
                  : 'Restore Review'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
