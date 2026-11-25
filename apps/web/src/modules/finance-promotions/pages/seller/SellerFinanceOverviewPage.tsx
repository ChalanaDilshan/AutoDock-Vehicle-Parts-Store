import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Percent,
  Clock,
  Gift,
  ChevronRight,
  Tag,
} from 'lucide-react';
import {
  sellerFinanceApi,
  CommissionSummary,
  SellerInvoice,
} from '../../api/financePromotionsApi.js';
import { InvoiceStatusBadge } from '../../components/FinanceStatusBadge.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerFinanceOverviewPage: React.FC = () => {
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<SellerInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      sellerFinanceApi.getSummary(),
      sellerFinanceApi.getInvoices({ limit: 5 }),
    ])
      .then(([sumRes, invRes]) => {
        if (sumRes.success && sumRes.data) setSummary(sumRes.data);
        if (invRes.success && invRes.data)
          setRecentInvoices(invRes.data.invoices || []);
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Unable to load financial summary.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const kpis = [
    {
      label: 'Outstanding Invoices',
      value: summary ? formatLKR(summary.outstandingInvoiceBalanceInCents) : '—',
      icon: <FileText className="w-4 h-4 text-slate-500" />,
      hint: 'Due to AutoDock',
    },
    {
      label: 'Month Accrual',
      value: summary ? formatLKR(summary.currentMonthAccruedInCents) : '—',
      icon: <Percent className="w-4 h-4 text-slate-500" />,
      hint: 'Commission this month',
    },
    {
      label: 'Uninvoiced Accrued',
      value: summary ? formatLKR(summary.uninvoicedAccruedInCents) : '—',
      icon: <Clock className="w-4 h-4 text-slate-500" />,
      hint: 'Pending monthly statement',
    },
    {
      label: 'Platform Subsidies',
      value: summary ? formatLKR(summary.totalSubsidyAccruedInCents) : '—',
      icon: <Gift className="w-4 h-4 text-slate-500" />,
      hint: 'Reimbursable promo credits',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Finance & Settlements"
        subtitle="Track accrued commissions, monthly invoices, and AutoDock campaign reimbursements"
        backTo="/seller/dashboard"
        backLabel="Seller Portal"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/seller/invoices">
              <Button variant="outline" size="sm">
                All Invoices
              </Button>
            </Link>
            <Link to="/seller/subsidies">
              <Button variant="outline" size="sm">
                Subsidy Ledger
              </Button>
            </Link>
            <Link to="/seller/promotions">
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Tag className="w-3.5 h-3.5" />}
              >
                Promotions
              </Button>
            </Link>
          </div>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-white border border-slate-200 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((item) => (
            <div
              key={item.label}
              className="bg-white border border-slate-200 rounded-lg p-5 space-y-2"
            >
              <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                <span>{item.label}</span>
                {item.icon}
              </div>
              <div className="text-xl font-bold text-slate-900 tabular-nums">
                {item.value}
              </div>
              <p className="text-xs text-slate-500">{item.hint}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recent Invoices */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Recent Monthly Commission Invoices
          </h2>
          <Link
            to="/seller/invoices"
            className="text-xs font-medium text-blue-700 hover:underline inline-flex items-center gap-1"
          >
            <span>View all</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentInvoices.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            No monthly commission invoices generated yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-slate-50/50">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {recentInvoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{inv.billingPeriod}</td>
                    <td className="py-3 px-4 tabular-nums">
                      {formatLKR(inv.grossCommissionInCents)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">
                      {formatLKR(inv.outstandingBalanceInCents)}
                    </td>
                    <td className="py-3 px-4">
                      <InvoiceStatusBadge status={inv.status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link to={`/seller/invoices/${inv._id}`}>
                        <Button variant="outline" size="sm">
                          Open
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
