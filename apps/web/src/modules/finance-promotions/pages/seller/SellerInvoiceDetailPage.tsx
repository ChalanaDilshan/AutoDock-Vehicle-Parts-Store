import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Building2, Upload } from 'lucide-react';
import {
  sellerFinanceApi,
  SellerInvoice,
  CommissionLedgerEntry,
  InvoicePaymentReceipt,
} from '../../api/financePromotionsApi.js';
import {
  InvoiceStatusBadge,
  ReceiptStatusBadge,
} from '../../components/FinanceStatusBadge.js';
import { InvoiceBankInstructionsModal } from '../../components/InvoiceBankInstructionsModal.js';
import { InvoiceReceiptUploadModal } from '../../components/InvoiceReceiptUploadModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [invoice, setInvoice] = useState<SellerInvoice | null>(null);
  const [lineItems, setLineItems] = useState<CommissionLedgerEntry[]>([]);
  const [receipts, setReceipts] = useState<InvoicePaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [bankModalOpen, setBankModalOpen] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

  const loadDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await sellerFinanceApi.getInvoiceById(id);
      if (response.success && response.data) {
        setInvoice(response.data.invoice);
        setLineItems(response.data.lineItems || []);
        setReceipts(response.data.receipts || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load invoice details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-80 bg-white border border-slate-200 rounded-lg" />
      </div>
    );
  }

  if (errorMessage || !invoice) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Alert variant="danger">{errorMessage || 'Invoice not found.'}</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title={<span className="font-mono">{invoice.invoiceNumber}</span>}
        subtitle={`Billing Period: ${invoice.billingPeriod} · Due ${new Date(invoice.dueDate).toLocaleDateString()}`}
        backTo="/seller/invoices"
        backLabel="All Invoices"
        badge={<InvoiceStatusBadge status={invoice.status} />}
        actions={
          invoice.outstandingBalanceInCents > 0 && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Building2 className="w-4 h-4" />}
                onClick={() => setBankModalOpen(true)}
              >
                Bank Transfer Info
              </Button>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Upload className="w-4 h-4" />}
                onClick={() => setUploadModalOpen(true)}
              >
                Upload Payment Slip
              </Button>
            </div>
          )
        }
      />

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Gross Commission</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums mt-1">
            {formatLKR(invoice.grossCommissionInCents)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Verified Paid</p>
          <p className="text-lg font-bold text-emerald-700 tabular-nums mt-1">
            {formatLKR(invoice.verifiedPaidInCents)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500">Outstanding Balance</p>
          <p className="text-lg font-bold text-slate-900 tabular-nums mt-1">
            {formatLKR(invoice.outstandingBalanceInCents)}
          </p>
        </div>
      </div>

      {/* Line Items */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            Included Order Commissions ({lineItems.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Ledger Ref</th>
                <th className="py-3 px-4">Completed</th>
                <th className="py-3 px-4">Base</th>
                <th className="py-3 px-4">Rate</th>
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
                  <td className="py-3 px-4 text-slate-600">
                    {(entry.appliedRateBasisPoints / 100).toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 text-right font-semibold text-slate-900 tabular-nums">
                    {formatLKR(entry.commissionAmountInCents)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Submitted Receipts */}
      {receipts.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">
              Submitted Deposit Slips ({receipts.length})
            </h2>
          </div>
          <div className="divide-y divide-slate-200 text-sm">
            {receipts.map((rec) => (
              <div
                key={rec._id}
                className="p-4 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {rec.originalFileName}
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    Claimed: {formatLKR(rec.claimedAmountInCents)}
                  </span>
                </div>
                <ReceiptStatusBadge status={rec.reviewStatus} />
              </div>
            ))}
          </div>
        </section>
      )}

      <InvoiceBankInstructionsModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        invoiceNumber={invoice.invoiceNumber}
        outstandingBalanceInCents={invoice.outstandingBalanceInCents}
        onOpenUpload={() => setUploadModalOpen(true)}
      />

      <InvoiceReceiptUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        invoiceId={invoice._id}
        invoiceNumber={invoice.invoiceNumber}
        outstandingBalanceInCents={invoice.outstandingBalanceInCents}
        onUploadSuccess={loadDetail}
      />
    </div>
  );
};
