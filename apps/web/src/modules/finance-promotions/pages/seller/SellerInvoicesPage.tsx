import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Filter,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  sellerFinanceApi,
  SellerInvoice,
  Pagination,
} from '../../api/financePromotionsApi.js';
import { InvoiceStatusBadge } from '../../components/FinanceStatusBadge.js';
import { InvoiceBankInstructionsModal } from '../../components/InvoiceBankInstructionsModal.js';
import { InvoiceReceiptUploadModal } from '../../components/InvoiceReceiptUploadModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const SellerInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [billingPeriodFilter, setBillingPeriodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals
  const [selectedInvoice, setSelectedInvoice] = useState<SellerInvoice | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  const fetchInvoices = async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await sellerFinanceApi.getInvoices({
        page,
        limit: 10,
        billingPeriod: billingPeriodFilter.trim() || undefined,
        status: statusFilter || undefined,
      });

      if (res.success && res.data) {
        setInvoices(res.data.invoices || []);
        setPagination(
          res.data.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 }
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch invoices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices(1);
  }, [statusFilter]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Monthly Commission Invoices
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-800 border border-blue-200">
              Settlements
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official monthly commission statements generated for your merchant account.
          </p>
        </div>

        <Link
          to="/seller/finance"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <span>← Back to Finance Overview</span>
        </Link>
      </div>

      {/* Filter Toolbar */}
      <form
        onSubmit={handleFilterSubmit}
        className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center gap-3 text-xs"
      >
        {/* Billing Period Input */}
        <div className="flex items-center gap-2">
          <label className="font-semibold text-slate-600 whitespace-nowrap">Billing Period:</label>
          <input
            type="text"
            placeholder="YYYY-MM (e.g. 2026-11)"
            value={billingPeriodFilter}
            onChange={(e) => setBillingPeriodFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl font-mono text-xs focus:ring-2 focus:ring-blue-500 outline-none w-36"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <label className="font-semibold text-slate-600">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">All Statuses</option>
            <option value="ISSUED">Issued (Unpaid)</option>
            <option value="PAYMENT_PENDING_VERIFICATION">Verification Pending</option>
            <option value="PARTIALLY_PAID">Partially Paid</option>
            <option value="PAID">Paid / Settled</option>
            <option value="OVERDUE">Overdue</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-2xs flex items-center gap-1"
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Apply Filter</span>
        </button>

        {(billingPeriodFilter || statusFilter) && (
          <button
            type="button"
            onClick={() => {
              setBillingPeriodFilter('');
              setStatusFilter('');
            }}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl font-semibold transition"
          >
            Reset
          </button>
        )}
      </form>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchInvoices(pagination.page)}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Invoices Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading invoice records...</span>
          </div>
        ) : invoices.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700 text-sm">No Invoices Found</p>
            <p className="text-slate-400">
              There are no commission invoices matching your current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Invoice #</th>
                  <th className="px-5 py-3">Billing Period</th>
                  <th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3">Due Date</th>
                  <th className="px-5 py-3">Invoiced Commission</th>
                  <th className="px-5 py-3">Verified Paid</th>
                  <th className="px-5 py-3">Outstanding Balance</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-4 font-mono font-bold text-blue-900">
                      <Link to={`/seller/invoices/${inv._id}`} className="hover:underline">
                        {inv.invoiceNumber}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {inv.billingPeriod}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(inv.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-900">
                      {formatLKR(inv.grossCommissionInCents)}
                    </td>
                    <td className="px-5 py-4 text-emerald-700 font-semibold">
                      {formatLKR(inv.verifiedPaidInCents)}
                    </td>
                    <td className="px-5 py-4 font-extrabold text-blue-950 font-mono">
                      {formatLKR(inv.outstandingBalanceInCents)}
                    </td>
                    <td className="px-5 py-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="px-5 py-4 text-right space-x-2">
                      <Link
                        to={`/seller/invoices/${inv._id}`}
                        className="px-2.5 py-1 text-slate-600 hover:text-blue-600 font-bold transition hover:underline"
                      >
                        View
                      </Link>
                      {inv.status !== 'PAID' && inv.status !== 'CANCELLED' && (
                        <button
                          onClick={() => {
                            setSelectedInvoice(inv);
                            setIsBankModalOpen(true);
                          }}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition shadow-2xs"
                        >
                          Pay
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} invoices)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchInvoices(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => fetchInvoices(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Modals */}
      {selectedInvoice && (
        <>
          <InvoiceBankInstructionsModal
            isOpen={isBankModalOpen}
            onClose={() => setIsBankModalOpen(false)}
            invoiceNumber={selectedInvoice.invoiceNumber}
            outstandingBalanceInCents={selectedInvoice.outstandingBalanceInCents}
            onOpenUpload={() => setIsUploadModalOpen(true)}
          />

          <InvoiceReceiptUploadModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            invoiceId={selectedInvoice._id}
            invoiceNumber={selectedInvoice.invoiceNumber}
            outstandingBalanceInCents={selectedInvoice.outstandingBalanceInCents}
            onUploadSuccess={() => fetchInvoices(pagination.page)}
          />
        </>
      )}
    </div>
  );
};
