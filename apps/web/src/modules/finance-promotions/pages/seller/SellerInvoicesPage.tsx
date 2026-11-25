import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Eye } from 'lucide-react';
import {
  sellerFinanceApi,
  SellerInvoice,
} from '../../api/financePromotionsApi.js';
import { InvoiceStatusBadge } from '../../components/FinanceStatusBadge.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [billingPeriod, setBillingPeriod] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadInvoices = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await sellerFinanceApi.getInvoices({
        status: statusFilter || undefined,
        billingPeriod: billingPeriod || undefined,
        limit: 20,
      });
      if (response.success && response.data) {
        setInvoices(response.data.invoices || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load commission invoices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter, billingPeriod]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Monthly Commission Invoices"
        subtitle="Review billing statements and upload bank deposit slips to settle open balances"
        backTo="/seller/finance"
        backLabel="Finance Overview"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { value: '', label: 'All Invoices' },
            { value: 'ISSUED', label: 'Issued' },
            { value: 'PAYMENT_PENDING_VERIFICATION', label: 'Pending Review' },
            { value: 'PAID', label: 'Paid' },
            { value: 'OVERDUE', label: 'Overdue' },
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

        <input
          type="month"
          aria-label="Filter by billing month"
          value={billingPeriod}
          onChange={(e) => setBillingPeriod(e.target.value)}
          className="h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-900"
        />
      </div>

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="No invoices found"
          description="Monthly commission invoices will appear here after completed orders are billed."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Invoice Number</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Gross Commission</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{inv.billingPeriod}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4 tabular-nums">
                      {formatLKR(inv.grossCommissionInCents)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums">
                      {formatLKR(inv.outstandingBalanceInCents)}
                    </td>
                    <td className="py-3.5 px-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/seller/invoices/${inv._id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Details
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
