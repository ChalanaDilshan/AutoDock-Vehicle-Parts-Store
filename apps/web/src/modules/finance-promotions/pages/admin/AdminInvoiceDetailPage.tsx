import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Loader2,
} from 'lucide-react';
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

export const AdminInvoiceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<SellerInvoice | null>(null);
  const [lineItems, setLineItems] = useState<CommissionLedgerEntry[]>([]);
  const [receipts, setReceipts] = useState<InvoicePaymentReceipt[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review modal
  const [selectedReceipt, setSelectedReceipt] = useState<InvoicePaymentReceipt | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);

  const fetchInvoice = async () => {
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
      setErrorMessage(err?.message || 'Failed to load invoice details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 text-center text-xs text-slate-500 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
        <p>Loading invoice audit records...</p>
      </div>
    );
  }

  if (errorMessage || !invoice) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 space-y-4">
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage || 'Invoice not found.'}</span>
          </div>
          <Link
            to="/admin/finance/invoices"
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/admin/finance" className="hover:text-blue-600 transition">
          Finance Overview
        </Link>
        <span>/</span>
        <Link to="/admin/finance/invoices" className="hover:text-blue-600 transition">
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

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              Merchant Store
            </span>
            <span className="font-bold text-slate-900 text-sm">
              {snapshot?.businessName || 'Merchant'}
            </span>
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
            <span className="text-blue-800 block font-semibold">Outstanding Balance</span>
            <strong className="text-blue-950 font-black text-base font-mono">
              {formatLKR(invoice.outstandingBalanceInCents)}
            </strong>
          </div>
        </div>
      </div>

      {/* Seller Billing Snapshot */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-2 text-xs">
        <h3 className="font-bold text-slate-800 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Seller Profile & Billing Snapshot</span>
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

      {/* Payment Receipts Audit Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Submitted Payment Receipts ({receipts.length})
            </h3>
            <p className="text-[11px] text-slate-500">
              Bank transfer slips uploaded by merchant for invoice payment verification.
            </p>
          </div>
        </div>

        {receipts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No payment slips submitted for this invoice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Deposit Date</th>
                  <th className="px-5 py-3">Claimed Amount</th>
                  <th className="px-5 py-3">Verified Deposit</th>
                  <th className="px-5 py-3">Bank Reference</th>
                  <th className="px-5 py-3">Review Status</th>
                  <th className="px-5 py-3">Receipt File</th>
                  <th className="px-5 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((rcpt) => (
                  <tr key={rcpt._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3.5 text-slate-600">
                      {new Date(rcpt.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">
                      {new Date(rcpt.depositDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900">
                      {formatLKR(rcpt.claimedAmountInCents)}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-emerald-800">
                      {rcpt.depositedAmountInCents
                        ? formatLKR(rcpt.depositedAmountInCents)
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-slate-700 text-[11px]">
                      {rcpt.bankTransactionReference || '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <ReceiptStatusBadge status={rcpt.reviewStatus} />
                    </td>
                    <td className="px-5 py-3.5">
                      <a
                        href={`/api/v1/seller/finance/invoices/${invoice._id}/receipts/${rcpt._id}/view`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                      >
                        <span>View File</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {rcpt.reviewStatus === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setSelectedReceipt({
                              ...rcpt,
                              invoiceId: invoice,
                              sellerId: {
                                _id: typeof invoice.sellerId === 'string' ? invoice.sellerId : invoice.sellerId._id,
                                businessName: snapshot?.businessName,
                                contactPhone: snapshot?.contactPhone,
                              },
                            });
                            setIsVerificationModalOpen(true);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition text-xs shadow-2xs"
                        >
                          Verify Receipt
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Commission Line Items Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">
              Aggregated Commission Lines ({lineItems.length} Suborders)
            </h3>
            <p className="text-[11px] text-slate-500">
              Immutable suborder completion ledger entries included in this billing batch.
            </p>
          </div>
        </div>

        {lineItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            No line items attached to this invoice.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Ledger Ref</th>
                  <th className="px-5 py-3">Completed</th>
                  <th className="px-5 py-3">Suborder ID</th>
                  <th className="px-5 py-3">Sales Subtotal</th>
                  <th className="px-5 py-3">Applied Rate</th>
                  <th className="px-5 py-3">Exempt?</th>
                  <th className="px-5 py-3 text-right">Commission Invoiced</th>
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
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Exempt (0%)
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No</span>
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

      {/* Review Modal */}
      {selectedReceipt && (
        <AdminReceiptVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => {
            setIsVerificationModalOpen(false);
            setSelectedReceipt(null);
          }}
          receipt={selectedReceipt}
          onDecisionComplete={fetchInvoice}
        />
      )}
    </div>
  );
};
