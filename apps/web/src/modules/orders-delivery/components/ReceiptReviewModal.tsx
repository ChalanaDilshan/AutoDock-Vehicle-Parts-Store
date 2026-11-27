import React, { useState, useEffect } from 'react';
import { ExternalLink, FileCheck, CheckCircle2, XCircle } from 'lucide-react';
import {
  orderApi,
  sellerOrderApi,
  PaymentSlipRecord,
} from '../api/ordersDeliveryApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';
import { Alert, Button, Modal } from '../../../shared/components/index.js';

interface ReceiptReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  suborderId: string;
  suborderNumber: string;
  onDecisionComplete: () => void;
}

export const ReceiptReviewModal: React.FC<ReceiptReviewModalProps> = ({
  isOpen,
  onClose,
  suborderId,
  suborderNumber,
  onDecisionComplete,
}) => {
  const [slip, setSlip] = useState<PaymentSlipRecord | null>(null);
  const [downloadToken, setDownloadToken] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rejectionMode, setRejectionMode] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    if (!isOpen || !suborderId) return;
    setIsLoading(true);
    setErrorMessage(null);
    setRejectionMode(false);
    setRejectionReason('');

    sellerOrderApi
      .getSellerSuborderReceipt(suborderId)
      .then((res) => {
        if (res.success && res.data) {
          setSlip(res.data.slip);
          setDownloadToken(res.data.downloadToken);
        }
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Unable to load payment receipt.');
      })
      .finally(() => setIsLoading(false));
  }, [isOpen, suborderId]);

  const handleApprove = async () => {
    if (!window.confirm('Confirm that the bank transfer amount has cleared into your account?')) {
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await sellerOrderApi.verifyReceipt(suborderId, { action: 'APPROVE' });
      onDecisionComplete();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to approve payment receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rejectionReason.trim().length < 5) {
      setErrorMessage('Please explain why the deposit slip is being rejected.');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await sellerOrderApi.verifyReceipt(suborderId, {
        action: 'REJECT',
        rejectionReason: rejectionReason.trim(),
      });
      onDecisionComplete();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to reject payment receipt.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Review Bank Deposit Slip"
      subtitle={`Suborder ${suborderNumber}`}
      size="md"
    >
      <div className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        {isLoading ? (
          <div className="h-44 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center text-sm text-slate-500">
            Loading deposit receipt...
          </div>
        ) : slip ? (
          <>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 font-medium text-slate-900">
                  <FileCheck className="w-4 h-4 text-slate-500" />
                  <span>{slip.originalFilename}</span>
                </span>
                {downloadToken && (
                  <a
                    href={orderApi.getReceiptStreamUrl(downloadToken)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#E11D30] hover:underline"
                  >
                    <span>View Document</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Transfer Reference</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {slip.transferReference || 'Not stated'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Deposited Amount</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {slip.depositedAmountInCents
                      ? formatLKR(slip.depositedAmountInCents)
                      : '—'}
                  </span>
                </div>
              </div>
            </div>

            {rejectionMode ? (
              <form onSubmit={handleReject} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    State Reason for Rejection
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="e.g. Deposited amount does not match, receipt illegible, incorrect merchant account..."
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-rose-500 focus:outline-none"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setRejectionMode(false)}>
                    Back
                  </Button>
                  <Button type="submit" variant="danger" isLoading={isSubmitting}>
                    Confirm Rejection
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  leftIcon={<XCircle className="w-4 h-4 text-rose-600" />}
                  onClick={() => setRejectionMode(true)}
                >
                  Reject Slip
                </Button>
                <Button
                  variant="primary"
                  isLoading={isSubmitting}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={handleApprove}
                >
                  Approve Payment
                </Button>
              </div>
            )}
          </>
        ) : null}
      </div>
    </Modal>
  );
};
