import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  AlertCircle,
  UploadCloud,
  ExternalLink,
  ShieldCheck,
  Loader2,
} from 'lucide-react';
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

export const SellerInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<SellerInvoice | null>(null);
  const [lineItems, setLineItems] = useState<CommissionLedgerEntry[]>([]);
  const [receipts, setReceipts] = useState<InvoicePaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const fetchInvoiceDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await sellerFinanceApi.getInvoiceById(id);
      if (res.success && res.data) {
        setInvoice(res.data.invoice);
        setLineItems(res.data.lineItems || []);
        setReceipts(res.data.receipts || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load invoice details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p>Loading authoritative invoice details from server...</p>
      </div>
    );
  }

  if (errorMessage || !invoice) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage || 'Invoice not found or access denied.'}</span>
          </div>
          <Link
            to="/seller/invoices"
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition text-xs"
          >
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  const snapshot = invoice.sellerBillingSnapshot;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/seller/finance" className="hover:text-blue-600 transition">
          Finance Overview
        </Link>
        <span>/</span>
        <Link to="/seller/invoices" className="hover:text-blue-600 transition">
          Monthly Invoices
        </Link>
        <span>/</span>
        <span className="font-mono font-bold text-slate-800">{invoice.invoiceNumber}</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black tracking-tight text-slate-900 font-mono">
                {invoice.invoiceNumber}
              </h1>
              <InvoiceStatusBadge status={invoice.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Billing Period: <strong className="text-slate-800">{invoice.billingPeriod}</strong> •
              Issued: {new Date(invoice.issueDate).toLocaleDateString()} • Due:{' '}
              <strong className="text-blue-900">{new Date(invoice.dueDate).toLocaleDateString()}</strong>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsBankModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition"
            >
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Bank Transfer Info</span>
            </button>

            {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload Payment Slip</span>
              </button>
            )}
          </div>
        </div>

        {/* Financial Balance Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">Gross Product Sales</span>
            <strong className="text-slate-900 font-bold text-sm">
              {formatLKR(invoice.grossProductTotalInCents)}
            </strong>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">Commission Invoiced</span>
            <strong className="text-slate-900 font-bold text-sm">
              {formatLKR(invoice.grossCommissionInCents)}
            </strong>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <span className="text-emerald-700 block">Verified Payments</span>
            <strong className="text-emerald-900 font-bold text-sm">
              {formatLKR(invoice.verifiedPaidInCents)}
            </strong>
          </div>

          <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200">
            <span className="text-blue-800 block font-semibold">Outstanding Amount Due</span>
            <strong className="text-blue-950 font-black text-base font-mono">
              {formatLKR(invoice.outstandingBalanceInCents)}
            </strong>
          </div>
        </div>
      </div>

      {/* Seller Billing Details Snapshot */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
        <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Seller Billing Snapshot (As Invoiced)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-slate-600">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Business Name</span>
            <span className="font-semibold text-slate-900">{snapshot?.businessName}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration #</span>
            <span className="font-semibold text-slate-900">{snapshot?.businessRegNumber || 'N/A'}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-bold">Billing Email / Phone</span>
            <span className="text-slate-900">
              {snapshot?.billingEmail} • {snapshot?.contactPhone}
            </span>
          </div>
        </div>
      </div>

      {/* Commission Line Items Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Commission Line Items ({lineItems.length} Completed Suborders)
            </h3>
            <p className="text-[11px] text-slate-500">
              Historical ledger snapshots for completed suborders in this billing period.
            </p>
          </div>
        </div>

        {lineItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No itemized ledger lines attached to this invoice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Ledger Reference</th>
                  <th className="px-5 py-3">Completed Date</th>
                  <th className="px-5 py-3">Suborder ID</th>
                  <th className="px-5 py-3">Product Subtotal</th>
                  <th className="px-5 py-3">Rate Snapshot</th>
                  <th className="px-5 py-3">Exemption</th>
                  <th className="px-5 py-3 text-right">Commission Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lineItems.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 font-mono font-bold text-blue-900">
                      {item.ledgerReference}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(item.completionTimestamp).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-600 text-[11px]">
                      {item.suborderId.slice(-8)}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {formatLKR(item.productSubtotalInCents)}
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-semibold">
                      {(item.appliedRateBasisPoints / 100).toFixed(2)}%
                    </td>
                    <td className="px-5 py-3">
                      {item.isExempt ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Exempt (0%)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-slate-900 font-mono">
                      {formatLKR(item.commissionAmountInCents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Submitted Payment Receipts History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Payment Receipts & Submissions ({receipts.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Bank transfer slips uploaded for administrative review and settlement.
            </p>
          </div>
        </div>

        {receipts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No payment slips uploaded for this invoice yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Uploaded Date</th>
                  <th className="px-5 py-3">Deposit Date</th>
                  <th className="px-5 py-3">Claimed Amount</th>
                  <th className="px-5 py-3">Verified Deposit</th>
                  <th className="px-5 py-3">Bank Ref</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Notes / Feedback</th>
                  <th className="px-5 py-3 text-right">Receipt File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((rcpt) => (
                  <tr key={rcpt._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(rcpt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-slate-600">
                      {new Date(rcpt.depositDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      {formatLKR(rcpt.claimedAmountInCents)}
                    </td>
                    <td className="px-5 py-3 font-bold text-emerald-800">
                      {rcpt.depositedAmountInCents
                        ? formatLKR(rcpt.depositedAmountInCents)
                        : '—'}
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-700 text-[11px]">
                      {rcpt.bankTransactionReference || '—'}
                    </td>
                    <td className="px-5 py-3">
                      <ReceiptStatusBadge status={rcpt.reviewStatus} />
                    </td>
                    <td className="px-5 py-3 text-[11px] text-slate-600 max-w-xs">
                      {rcpt.rejectionReason ? (
                        <span className="text-rose-700 font-medium">
                          Rejection: {rcpt.rejectionReason}
                        </span>
                      ) : rcpt.adminNotes ? (
                        <span>{rcpt.adminNotes}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <a
                        href={`/api/v1/seller/finance/invoices/${invoice._id}/receipts/${rcpt._id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <InvoiceBankInstructionsModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        invoiceNumber={invoice.invoiceNumber}
        outstandingBalanceInCents={invoice.outstandingBalanceInCents}
        onOpenUpload={() => setIsUploadModalOpen(true)}
      />

      <InvoiceReceiptUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        invoiceId={invoice._id}
        invoiceNumber={invoice.invoiceNumber}
        outstandingBalanceInCents={invoice.outstandingBalanceInCents}
        onUploadSuccess={fetchInvoiceDetail}
      />
    </div>
  );
};
