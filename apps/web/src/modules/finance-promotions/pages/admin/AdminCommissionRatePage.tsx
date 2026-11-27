import React, { useState, useEffect } from 'react';
import { Percent } from 'lucide-react';
import {
  adminFinanceApi,
  CommissionRateConfig,
} from '../../api/financePromotionsApi.js';
import {
  Alert,
  Badge,
  Button,
  Input,
  PageHeader,
} from '../../../../shared/components/index.js';

export const AdminCommissionRatePage: React.FC = () => {
  const [currentRate, setCurrentRate] = useState<CommissionRateConfig | null>(
    null
  );
  const [history, setHistory] = useState<CommissionRateConfig[]>([]);
  const [percentInput, setPercentInput] = useState('8.00');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadRates = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await adminFinanceApi.getCommissionRate();
      if (response.success && response.data) {
        setCurrentRate(response.data.currentRate);
        setHistory(response.data.history || []);
        if (response.data.currentRate) {
          setPercentInput(
            (response.data.currentRate.basisPoints / 100).toFixed(2)
          );
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load commission rate settings.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRates();
  }, []);

  const handleConfigure = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsed = Number(percentInput);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 50) {
      setErrorMessage('Enter a valid percentage between 0% and 50%.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Provide an audit description for the rate change.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminFinanceApi.configureCommissionRate({
        basisPoints: Math.round(parsed * 100),
        description: description.trim(),
      });
      setDescription('');
      setSuccessMessage('Platform commission rate updated.');
      await loadRates();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update commission rate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Commission Rate Configuration"
        subtitle="Configure the global percentage applied to delivered merchant suborders"
        backTo="/admin/finance"
        backLabel="Finance Overview"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Current Active Rate */}
        <section className="lg:col-span-5 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Percent className="w-4 h-4 text-[#E11D30]" />
              <span>Current Standard Rate</span>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          {isLoading ? (
            <div className="h-24 bg-slate-50 rounded-md" />
          ) : currentRate ? (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2.5">
                <span className="text-3xl font-bold text-slate-900 tabular-nums">
                  {(currentRate.basisPoints / 100).toFixed(2)}%
                </span>
                <span className="text-xs font-mono text-slate-500">
                  ({currentRate.basisPoints} bps)
                </span>
              </div>
              <p className="text-sm text-slate-600">{currentRate.description}</p>
              <p className="text-xs text-slate-400">
                Effective since{' '}
                {new Date(currentRate.effectiveFrom).toLocaleDateString()}
              </p>
            </div>
          ) : null}
        </section>

        {/* Update Form */}
        <section className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-6 space-y-4">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
            Configure New Rate
          </h2>
          <form onSubmit={handleConfigure} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Commission Rate (%)"
                type="number"
                step="0.01"
                min={0}
                max={50}
                required
                value={percentInput}
                onChange={(e) => setPercentInput(e.target.value)}
                helperText={`${Math.round((Number(percentInput) || 0) * 100)} basis points`}
              />
              <Input
                label="Reason / Policy Note"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Q4 standard marketplace adjustment"
              />
            </div>

            <div className="flex justify-end">
              <Button type="submit" variant="primary" isLoading={isSubmitting}>
                Publish New Rate
              </Button>
            </div>
          </form>
        </section>
      </div>

      {/* Rate History */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-900">
            Rate Change History
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase bg-slate-50/50">
                <th className="py-3 px-4">Rate</th>
                <th className="py-3 px-4">Basis Points</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Effective From</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {history.map((item) => (
                <tr key={item._id}>
                  <td className="py-3 px-4 font-semibold text-slate-900 tabular-nums">
                    {(item.basisPoints / 100).toFixed(2)}%
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-slate-600">
                    {item.basisPoints} bps
                  </td>
                  <td className="py-3 px-4 text-slate-700">{item.description}</td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(item.effectiveFrom).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
