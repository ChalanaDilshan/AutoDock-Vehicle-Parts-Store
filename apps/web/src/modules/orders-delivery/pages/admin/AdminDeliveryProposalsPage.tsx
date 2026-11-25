import React, { useState, useEffect } from 'react';
import { Truck, CheckCircle2, XCircle } from 'lucide-react';
import {
  deliveryRateApi,
  DeliveryRateProposalRecord,
} from '../../api/ordersDeliveryApi.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  Modal,
  PageHeader,
} from '../../../../shared/components/index.js';

export const AdminDeliveryProposalsPage: React.FC = () => {
  const [proposals, setProposals] = useState<DeliveryRateProposalRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedProposal, setSelectedProposal] =
    useState<DeliveryRateProposalRecord | null>(null);
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadProposals = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await deliveryRateApi.getAdminProposals(
        statusFilter || undefined
      );
      if (response.success && Array.isArray(response.data)) {
        setProposals(response.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load delivery rate proposals.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProposals();
  }, [statusFilter]);

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedProposal) return;
    if (decision === 'REJECT' && !rejectionReason.trim()) {
      setErrorMessage('Provide a rejection reason when declining a rate proposal.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await deliveryRateApi.decideProposal(selectedProposal._id, {
        decision,
        reviewerNotes: reviewerNotes.trim() || undefined,
        rejectionReason:
          decision === 'REJECT' ? rejectionReason.trim() : undefined,
      });
      setSelectedProposal(null);
      setReviewerNotes('');
      setRejectionReason('');
      await loadProposals();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to record decision.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery Rate Proposals Verification"
        subtitle="Approve or decline merchant district delivery fee schedules"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap gap-2">
        {[
          { value: '', label: 'All Proposals' },
          { value: 'PENDING_APPROVAL', label: 'Pending Approval' },
          { value: 'APPROVED', label: 'Approved' },
          { value: 'REJECTED', label: 'Rejected' },
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
      ) : proposals.length === 0 ? (
        <EmptyState
          icon={<Truck className="w-6 h-6" />}
          title="No delivery rate proposals pending"
          description="Submitted seller shipping zone proposals will appear here for approval."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          {proposals.map((prop) => (
            <div
              key={prop._id}
              className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-semibold text-slate-900">
                    Seller {prop.sellerId}
                  </span>
                  <Badge
                    variant={
                      prop.status === 'APPROVED'
                        ? 'success'
                        : prop.status === 'REJECTED'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {prop.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {prop.districtRates.length} district rates &middot; Submitted{' '}
                  {new Date(prop.createdAt).toLocaleDateString()}
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedProposal(prop);
                  setReviewerNotes('');
                  setRejectionReason('');
                }}
              >
                Inspect &amp; Decide
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedProposal)}
        onClose={() => setSelectedProposal(null)}
        title="Review Delivery Proposal"
        subtitle={selectedProposal ? `Seller ${selectedProposal.sellerId}` : ''}
        size="md"
      >
        {selectedProposal && (
          <div className="space-y-4">
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs text-slate-500 uppercase">
                    <th className="py-2 px-3">District</th>
                    <th className="py-2 px-3">Fee (LKR)</th>
                    <th className="py-2 px-3">Window</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedProposal.districtRates.map((rate) => (
                    <tr key={rate.district}>
                      <td className="py-2 px-3 font-medium text-slate-900">
                        {rate.district}
                      </td>
                      <td className="py-2 px-3 font-semibold text-slate-900 tabular-nums">
                        {formatLKR(rate.deliveryFeeInCents)}
                      </td>
                      <td className="py-2 px-3 text-slate-600">
                        {rate.estimatedDaysMin}–{rate.estimatedDaysMax} days
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Reviewer Notes (Optional)
              </label>
              <input
                type="text"
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Notes for approval audit"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rejection Reason (If Declining)
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Required only if declining this schedule"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedProposal(null)}
              >
                Close
              </Button>
              <Button
                variant="danger"
                isLoading={isSubmitting}
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={() => handleDecision('REJECT')}
              >
                Reject Proposal
              </Button>
              <Button
                variant="primary"
                isLoading={isSubmitting}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => handleDecision('APPROVE')}
              >
                Approve &amp; Activate Rates
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
