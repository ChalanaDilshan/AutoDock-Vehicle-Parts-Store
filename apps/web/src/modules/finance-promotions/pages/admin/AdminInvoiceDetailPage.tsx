import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  adminFinanceApi,
  SellerInvoice,
  CommissionLedgerEntry,
  InvoicePaymentReceipt,
} from '../../api/financePromotionsApi.js';
import {
  InvoiceStatusBadge,
  ReceiptStatusBadge,
} from '../../components/FinanceStatusBadge.js';
import { AdminReceiptVerificationModal } from '../../components/AdminReceiptVerificationModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  PageHeader,
} from '../../../../shared/components/index.js';

export const AdminInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [invoice, setInvoice] = useState<SellerInvoice | null>(null);
  const [lineItems, setLineItems] = useState<CommissionLedgerEntry[]>([]);
  const [receipts, setReceipts] = useState<InvoicePaymentReceipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] =
    useState<InvoicePaymentReceipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminFinanceApi.getInvoiceById(id);
      if (res.success && res.data) {
        setInvoice(res.data.invoice);
        setLineItems(res.data.lineItems || []);
        setReceipts(res.data.receipts || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load invoice detail.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (isLoading) {
    return <div className="h-80 bg-white border border-slate-200 rounded-lg" />;
  }

  if (errorMessage || !invoice) {
    return <Alert variant="danger">{errorMessage || 'Invoice not found.'}</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="font-mono">{invoice.invoiceNumber}</span>}
        subtitle={`${invoice.sellerBillingSnapshot?.businessName || 'Seller'} · Period ${invoice.billingPeriod}`}
        backTo="/admin/finance/invoices"
        backLabel="Commission Invoices"
        badge={<InvoiceStatusBadge status={invoice.status} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500">Gross Commission</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
            {formatLKR(invoice.grossCommissionInCents)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500">Verified Settled</p>
          <p className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
            {formatLKR(invoice.verifiedPaidInCents)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500">Outstanding</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
            {formatLKR(invoice.outstandingBalanceInCents)}
          </p>
        </div>
      </div>

      {/* Line Items */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            Invoice Ledger Line Items ({lineItems.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                <th className="py-3 px-4">Ledger Ref</th>
                <th className="py-3 px-4">Completed</th>
                <th className="py-3 px-4">Base</th>
                <th className="py-3 px-4 text-right">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {lineItems.map((entry) => (
                <tr key={entry._id}>
                  <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900">
                    {entry.ledgerReference}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {new Date(entry.completionTimestamp).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 tabular-nums">
                    {formatLKR(entry.commissionableBaseInCents)}
                  </td>
                  <td className="py-3 px-4 text-right font-semibold tabular-nums">
                    {formatLKR(entry.commissionAmountInCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Deposit Receipts */}
      {receipts.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              Payment Slips ({receipts.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-200 text-sm">
            {receipts.map((rec) => (
              <div
                key={rec._id}
                className="p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="font-medium text-slate-900">
                    {rec.originalFileName}
                  </div>
                  <div className="text-xs text-slate-500">
                    Claimed {formatLKR(rec.claimedAmountInCents)} · Deposit{' '}
                    {new Date(rec.depositDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ReceiptStatusBadge status={rec.reviewStatus} />
                  {rec.reviewStatus === 'PENDING' && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setSelectedReceipt(rec)}
                    >
                      Verify &amp; Settle
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <AdminReceiptVerificationModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        receipt={selectedReceipt}
        onDecisionComplete={loadDetail}
      />
    </div>
  );
};
