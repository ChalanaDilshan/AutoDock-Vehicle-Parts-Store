import React, { useState, useEffect } from 'react';
import { CreditCard } from 'lucide-react';
import {
  adminFinanceApi,
  InvoicePaymentReceipt,
} from '../../api/financePromotionsApi.js';
import { ReceiptStatusBadge } from '../../components/FinanceStatusBadge.js';
import { AdminReceiptVerificationModal } from '../../components/AdminReceiptVerificationModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/index.js';

export const AdminPaymentVerificationQueuePage: React.FC = () => {
  const [receipts, setReceipts] = useState<InvoicePaymentReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] =
    useState<InvoicePaymentReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadQueue = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminFinanceApi.getPaymentVerificationQueue({ limit: 25 });
      if (res.success && res.data) {
        setReceipts(res.data.pendingReceipts || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load payment verification queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payment Verification Queue"
        subtitle="Audit merchant bank deposit receipts against platform commission invoices"
        backTo="/admin/finance"
        backLabel="Finance Overview"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : receipts.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="w-6 h-6" />}
          title="No pending payment slips"
          description="All submitted merchant invoice deposit slips have been verified."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Invoice</th>
                  <th className="py-3 px-4">Claimed Amount</th>
                  <th className="py-3 px-4">Deposit Date</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {receipts.map((rec) => {
                  const sellerName =
                    typeof rec.sellerId === 'object'
                      ? rec.sellerId.businessName || rec.sellerId.storeName || 'Seller'
                      : rec.sellerId;
                  const invNumber =
                    typeof rec.invoiceId === 'object'
                      ? rec.invoiceId.invoiceNumber
                      : rec.invoiceId;
                  return (
                    <tr key={rec._id} className="hover:bg-slate-50/60">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {sellerName}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                        {invNumber}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums">
                        {formatLKR(rec.claimedAmountInCents)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {new Date(rec.depositDate).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <ReceiptStatusBadge status={rec.reviewStatus} />
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelectedReceipt(rec)}
                        >
                          Verify &amp; Settle
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AdminReceiptVerificationModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
        onDecisionComplete={loadQueue}
      />
    </div>
  );
};
