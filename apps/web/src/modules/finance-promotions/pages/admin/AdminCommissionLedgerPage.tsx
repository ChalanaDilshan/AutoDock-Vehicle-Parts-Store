import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import {
  adminFinanceApi,
  CommissionLedgerEntry,
} from '../../api/financePromotionsApi.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Badge,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/index.js';

export const AdminCommissionLedgerPage: React.FC = () => {
  const [entries, setEntries] = useState<CommissionLedgerEntry[]>([]);
  const [summary, setSummary] = useState<{
    totalCommissionInCents: number;
    totalBaseInCents: number;
  }>({ totalCommissionInCents: 0, totalBaseInCents: 0 });
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    adminFinanceApi
      .getCommissionLedger({
        status: statusFilter || undefined,
        limit: 25,
      })
      .then((res) => {
        if (res.success && res.data) {
          setEntries(res.data.entries || []);
          if (res.data.summary) setSummary(res.data.summary);
        }
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Unable to load commission ledger.');
      })
      .finally(() => setIsLoading(false));
  }, [statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Ledger"
        subtitle="Audit order-by-order commission accruals across completed seller packages"
        backTo="/admin/finance"
        backLabel="Finance Overview"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500">Commissionable GMV Base</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
            {formatLKR(summary.totalBaseInCents)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500">Total Commission Accrued</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
            {formatLKR(summary.totalCommissionInCents)}
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap gap-2">
        {[
          { value: '', label: 'All Entries' },
          { value: 'ACCRUED', label: 'Accrued (Uninvoiced)' },
          { value: 'INVOICED', label: 'Invoiced' },
          { value: 'ADJUSTED', label: 'Adjusted' },
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

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="w-6 h-6" />}
          title="No commission ledger entries"
          description="Delivered seller packages will record commission accruals here."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Base (LKR)</th>
                  <th className="py-3 px-4">Rate</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {entries.map((entry) => {
                  const sellerName =
                    typeof entry.sellerId === 'object'
                      ? entry.sellerId.businessName || entry.sellerId.storeName || 'Seller'
                      : entry.sellerId;
                  return (
                    <tr key={entry._id}>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900">
                        {entry.ledgerReference}
                      </td>
                      <td className="py-3 px-4 text-slate-700">{sellerName}</td>
                      <td className="py-3 px-4 tabular-nums">
                        {formatLKR(entry.commissionableBaseInCents)}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {entry.isExempt
                          ? '0.00% (Exempt)'
                          : `${(entry.appliedRateBasisPoints / 100).toFixed(2)}%`}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">
                        {formatLKR(entry.commissionAmountInCents)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={entry.status === 'INVOICED' ? 'success' : 'default'}
                        >
                          {entry.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
