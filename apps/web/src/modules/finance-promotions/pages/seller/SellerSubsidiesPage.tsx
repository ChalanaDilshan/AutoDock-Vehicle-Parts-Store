import React, { useState, useEffect } from 'react';
import { Gift } from 'lucide-react';
import {
  sellerFinanceApi,
  PlatformSubsidyRecord,
} from '../../api/financePromotionsApi.js';
import { SubsidyStatusBadge } from '../../components/FinanceStatusBadge.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerSubsidiesPage: React.FC = () => {
  const [subsidies, setSubsidies] = useState<PlatformSubsidyRecord[]>([]);
  const [totalAccrued, setTotalAccrued] = useState(0);
  const [totalSettled, setTotalSettled] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    sellerFinanceApi
      .getSubsidies({ limit: 25 })
      .then((res) => {
        if (res.success && res.data) {
          setSubsidies(res.data.subsidies || []);
          setTotalAccrued(res.data.totalAccruedInCents || 0);
          setTotalSettled(res.data.totalSettledInCents || 0);
        }
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Unable to load subsidy records.');
      })
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="AutoDock Subsidy Ledger"
        subtitle="Track promotional discounts funded by AutoDock and reimbursed to your store"
        backTo="/seller/finance"
        backLabel="Finance Overview"
      />

      <Alert variant="info" title="Subsidy Settlement & Invoicing Policy Notice">
        Platform-funded promo discounts are recorded separately from your monthly commission invoices and settled directly by AutoDock.
      </Alert>

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500">Accrued (Payable to You)</p>
          <p className="text-xl font-bold text-slate-900 tabular-nums mt-1">
            {formatLKR(totalAccrued)}
          </p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-5">
          <p className="text-xs text-slate-500">Settled to Date</p>
          <p className="text-xl font-bold text-emerald-700 tabular-nums mt-1">
            {formatLKR(totalSettled)}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="h-56 bg-white border border-slate-200 rounded-lg" />
      ) : subsidies.length === 0 ? (
        <EmptyState
          icon={<Gift className="w-6 h-6" />}
          title="No platform subsidy entries yet"
          description="Subsidy reimbursements from platform-wide promotional campaigns will appear here."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Campaign Code</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Reimbursement</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {subsidies.map((item) => (
                  <tr key={item._id}>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900">
                      {item.subsidyReference}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-blue-700 font-semibold">
                      {item.promotionCode}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {new Date(item.accrualTimestamp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">
                      {formatLKR(item.subsidyAmountInCents)}
                    </td>
                    <td className="py-3 px-4">
                      <SubsidyStatusBadge status={item.status} />
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
