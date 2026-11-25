import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Eye, PlusCircle } from 'lucide-react';
import {
  adminFinanceApi,
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

export const AdminInvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<SellerInvoice[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [billingPeriod, setBillingPeriod] = useState(
    new Date().toISOString().slice(0, 7)
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadInvoices = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminFinanceApi.getInvoices({
        status: statusFilter || undefined,
        limit: 25,
      });
      if (res.success && res.data) {
        setInvoices(res.data.invoices || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load seller invoices.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const handleGenerate = async () => {
    if (!billingPeriod) return;
    setIsGenerating(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await adminFinanceApi.generateInvoices({ billingPeriod });
      if (res.success && res.data) {
        setSuccessMessage(
          `Generated ${res.data.generatedCount} invoices for ${res.data.billingPeriod} (${res.data.skippedCount} skipped).`
        );
        await loadInvoices();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to generate billing invoices.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Invoices"
        subtitle="Generate monthly billing statements and monitor seller invoice settlements"
        backTo="/admin/finance"
        backLabel="Finance Overview"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={billingPeriod}
              onChange={(e) => setBillingPeriod(e.target.value)}
              aria-label="Billing period to generate"
              className="h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-900"
            />
            <Button
              variant="primary"
              size="sm"
              isLoading={isGenerating}
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={handleGenerate}
            >
              Generate Billing Cycle
            </Button>
          </div>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap gap-2">
        {[
          { value: '', label: 'All' },
          { value: 'ISSUED', label: 'Issued' },
          { value: 'PAYMENT_PENDING_VERIFICATION', label: 'Pending Review' },
          { value: 'PARTIALLY_PAID', label: 'Partially Paid' },
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

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-6 h-6" />}
          title="No seller invoices found"
          description="Generate a monthly billing cycle to issue invoices from accrued seller commissions."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Invoice #</th>
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Period</th>
                  <th className="py-3 px-4">Commission</th>
                  <th className="py-3 px-4">Outstanding</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {invoices.map((inv) => {
                  const sellerName =
                    inv.sellerBillingSnapshot?.businessName ||
                    (typeof inv.sellerId === 'object'
                      ? inv.sellerId.businessName || inv.sellerId.storeName
                      : inv.sellerId);
                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-800 font-medium">
                        {sellerName}
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
                        <Link to={`/admin/finance/invoices/${inv._id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<Eye className="w-3.5 h-3.5" />}
                          >
                            Inspect
                          </Button>
                        </Link>
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
