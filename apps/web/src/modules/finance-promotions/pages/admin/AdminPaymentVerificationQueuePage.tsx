import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  FileText,
  ExternalLink,
} from 'lucide-react';
import {
  adminFinanceApi,
  InvoicePaymentReceipt,
  Pagination,
} from '../../api/financePromotionsApi.js';
import { AdminReceiptVerificationModal } from '../../components/AdminReceiptVerificationModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const AdminPaymentVerificationQueuePage: React.FC = () => {
  const [receipts, setReceipts] = useState<InvoicePaymentReceipt[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review Modal State
  const [selectedReceipt, setSelectedReceipt] = useState<InvoicePaymentReceipt | null>(null);
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState<boolean>(false);

  const fetchQueue = async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminFinanceApi.getPaymentVerificationQueue({ page, limit: 20 });
      if (res.success && res.data) {
        setReceipts(res.data.pendingReceipts || []);
        setPagination(
          res.data.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 }
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load payment verification queue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue(1);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Payment Verification Queue
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
              Audit Required
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review merchant bank deposit slips, verify ledger balances, and credit approved payments.
          </p>
        </div>

        <Link
          to="/admin/finance"
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-blue-600 transition"
        >
          <span>← Back to Finance Overview</span>
        </Link>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => fetchQueue(pagination.page)}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between text-xs">
          <div>
            <h2 className="font-bold text-slate-900">
              Awaiting Verification ({pagination.total} Submissions)
            </h2>
            <p className="text-slate-500 text-[11px]">Sorted oldest first for FIFO SLA compliance</p>
          </div>
          <button
            onClick={() => fetchQueue(pagination.page)}
            className="px-3 py-1 border border-slate-200 hover:bg-slate-50 rounded-lg font-semibold text-slate-700 transition"
          >
            Refresh
          </button>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            <span>Loading verification queue...</span>
          </div>
        ) : receipts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs space-y-2">
            <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
            <p className="font-bold text-slate-700 text-sm">Queue is Clear</p>
            <p className="text-slate-400 max-w-sm mx-auto">
              There are no pending seller invoice payment slips awaiting review at this time.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Submitted</th>
                  <th className="px-5 py-3">Merchant / Store</th>
                  <th className="px-5 py-3">Invoice Number</th>
                  <th className="px-5 py-3">Period</th>
                  <th className="px-5 py-3">Claimed Deposit</th>
                  <th className="px-5 py-3">Current Balance</th>
                  <th className="px-5 py-3">Deposit Date</th>
                  <th className="px-5 py-3">Receipt Document</th>
                  <th className="px-5 py-3 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {receipts.map((rcpt) => {
                  const sObj = typeof rcpt.sellerId === 'object' ? rcpt.sellerId : null;
                  const invObj = typeof rcpt.invoiceId === 'object' ? rcpt.invoiceId : null;
                  const invoiceIdStr = invObj?._id || (rcpt.invoiceId as string);

                  return (
                    <tr key={rcpt._id} className="hover:bg-slate-50/60 transition">
                      <td className="px-5 py-4 text-slate-600">
                        {new Date(rcpt.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-bold text-slate-900 block">
                          {sObj?.businessName || sObj?.storeName || 'Merchant'}
                        </span>
                        {sObj?.contactPhone && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {sObj.contactPhone}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-blue-900">
                        <Link
                          to={`/admin/finance/invoices/${invoiceIdStr}`}
                          className="hover:underline"
                        >
                          {invObj?.invoiceNumber || invoiceIdStr}
                        </Link>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-700">
                        {invObj?.billingPeriod || '—'}
                      </td>
                      <td className="px-5 py-4 font-extrabold text-blue-950 font-mono text-sm">
                        {formatLKR(rcpt.claimedAmountInCents)}
                      </td>
                      <td className="px-5 py-4 font-bold text-rose-700 font-mono">
                        {invObj?.outstandingBalanceInCents !== undefined
                          ? formatLKR(invObj.outstandingBalanceInCents)
                          : '—'}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {new Date(rcpt.depositDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <a
                          href={`/api/v1/seller/finance/invoices/${invoiceIdStr}/receipts/${rcpt._id}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-bold hover:underline"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Slip</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedReceipt(rcpt);
                            setIsVerificationModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition text-xs shadow-2xs"
                        >
                          Verify & Settle
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchQueue(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Previous
              </button>
              <button
                onClick={() => fetchQueue(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-slate-200 rounded-lg hover:bg-slate-50 font-semibold disabled:opacity-40 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedReceipt && (
        <AdminReceiptVerificationModal
          isOpen={isVerificationModalOpen}
          onClose={() => {
            setIsVerificationModalOpen(false);
            setSelectedReceipt(null);
          }}
          receipt={selectedReceipt}
          onDecisionComplete={() => fetchQueue(pagination.page)}
        />
      )}
    </div>
  );
};
