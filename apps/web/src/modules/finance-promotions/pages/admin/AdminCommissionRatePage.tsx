import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  ShieldAlert,
  Plus,
} from 'lucide-react';
import {
  adminFinanceApi,
  CommissionRateConfig,
} from '../../api/financePromotionsApi.js';

export const AdminCommissionRatePage: React.FC = () => {
  const [currentRate, setCurrentRate] = useState<CommissionRateConfig | null>(null);
  const [history, setHistory] = useState<CommissionRateConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [basisPoints, setBasisPoints] = useState<number>(800); // 8.00%
  const [description, setDescription] = useState<string>('');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(
    new Date().toISOString().slice(0, 16)
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formSuccessMessage, setFormSuccessMessage] = useState<string | null>(null);
  const [formErrorMessage, setFormErrorMessage] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState<boolean>(false);

  const fetchRateData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminFinanceApi.getCommissionRate();
      if (res.success && res.data) {
        setCurrentRate(res.data.currentRate);
        setHistory(res.data.history || []);
        if (res.data.currentRate) {
          setBasisPoints(res.data.currentRate.basisPoints);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to load commission rate configuration.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRateData();
  }, []);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrorMessage(null);
    setFormSuccessMessage(null);

    if (basisPoints < 0 || basisPoints > 3500) {
      setFormErrorMessage('Commission rate must be between 0 (0%) and 3500 (35.00%) basis points.');
      return;
    }

    if (!description.trim() || description.trim().length < 3) {
      setFormErrorMessage('Description must be at least 3 characters explaining the reason for this rate change.');
      return;
    }

    setIsConfirmOpen(true);
  };

  const handleConfirmUpdate = async () => {
    setIsConfirmOpen(false);
    setIsSubmitting(true);
    setFormErrorMessage(null);

    try {
      const res = await adminFinanceApi.configureCommissionRate({
        basisPoints,
        description: description.trim(),
        effectiveFrom: effectiveFrom ? new Date(effectiveFrom).toISOString() : undefined,
      });

      if (res.success) {
        setFormSuccessMessage(
          `Platform commission rate successfully updated to ${(basisPoints / 100).toFixed(2)}% (${basisPoints} bps).`
        );
        setDescription('');
        fetchRateData();
      } else {
        setFormErrorMessage(res.message || 'Failed to update commission rate.');
      }
    } catch (err: any) {
      setFormErrorMessage(err?.message || 'An error occurred while updating the rate.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-slate-900">
              Commission Rate Configuration
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-300">
              Platform Policy
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative marketplace commission percentage applied to seller suborders.
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
            onClick={fetchRateData}
            className="px-3 py-1 bg-white hover:bg-rose-100 border border-rose-300 rounded-lg font-bold text-rose-900 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Current Active Rate Card */}
      {isLoading ? (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-32" />
      ) : currentRate ? (
        <div className="bg-gradient-to-tr from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-extrabold text-blue-200">
                Effective Platform Rate
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Active
              </span>
            </div>
            <div className="text-4xl font-black tracking-tight text-white flex items-baseline gap-2">
              <span>{currentRate.percentage.toFixed(2)}%</span>
              <span className="text-sm font-semibold text-blue-200">
                ({currentRate.basisPoints} bps)
              </span>
            </div>
            <p className="text-xs text-blue-100/80 pt-1">{currentRate.description}</p>
          </div>

          <div className="text-xs text-blue-100/90 sm:text-right space-y-1 border-t sm:border-t-0 sm:border-l border-blue-700/60 pt-3 sm:pt-0 sm:pl-6">
            <div>
              <span className="text-blue-300 block">Effective From</span>
              <span className="font-semibold text-white">
                {new Date(currentRate.effectiveFrom).toLocaleString()}
              </span>
            </div>
            <div className="pt-1">
              <span className="text-blue-300 block">Rate Formula</span>
              <span className="font-mono text-[11px] text-blue-200">
                (base * bps + 5000) / 10000
              </span>
            </div>
          </div>
        </div>
      ) : null}

      {/* Rate Change Form Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-5">
        <div>
          <h2 className="text-base font-bold text-slate-900">Configure New Commission Rate</h2>
          <p className="text-xs text-slate-500">
            Submit a new rate configuration. When effective, previous active rates will automatically
            transition to superseded status.
          </p>
        </div>

        {/* Form Alerts */}
        {formSuccessMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formSuccessMessage}</span>
          </div>
        )}

        {formErrorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formErrorMessage}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Basis Points */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Basis Points (0 - 3500) *
              </label>
              <input
                type="number"
                min="0"
                max="3500"
                step="1"
                value={basisPoints}
                onChange={(e) => setBasisPoints(parseInt(e.target.value, 10) || 0)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Equivalent to: <strong className="text-blue-900">{(basisPoints / 100).toFixed(2)}%</strong>
              </p>
            </div>

            {/* Effective From */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Effective Activation Date / Time *
              </label>
              <input
                type="datetime-local"
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Defaults to immediate platform activation
              </p>
            </div>

            {/* Description */}
            <div className="sm:col-span-1">
              <label className="block font-semibold text-slate-700 mb-1">
                Change Policy Justification *
              </label>
              <input
                type="text"
                placeholder="e.g. Q4 Executive Board Approval Rate Update"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                maxLength={200}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Apply Rate Configuration</span>
            </button>
          </div>
        </form>
      </div>

      {/* Rate History Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900">Commission Rate Audit History</h3>
            <p className="text-[11px] text-slate-500">
              Immutable log of past platform commission percentage adjustments.
            </p>
          </div>
          <span className="text-xs text-slate-400">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No historical rates recorded.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-500 font-bold border-b border-slate-200/80 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3">Rate ID</th>
                  <th className="px-5 py-3">Percentage</th>
                  <th className="px-5 py-3">Basis Points</th>
                  <th className="px-5 py-3">Effective From</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Audit Justification</th>
                  <th className="px-5 py-3 text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((rate) => (
                  <tr key={rate._id} className="hover:bg-slate-50/60 transition">
                    <td className="px-5 py-3 font-mono text-slate-500 text-[11px]">
                      {rate._id.slice(-8)}
                    </td>
                    <td className="px-5 py-3 font-bold text-slate-900">
                      {rate.percentage.toFixed(2)}%
                    </td>
                    <td className="px-5 py-3 font-mono text-slate-700">
                      {rate.basisPoints} bps
                    </td>
                    <td className="px-5 py-3 text-slate-700">
                      {new Date(rate.effectiveFrom).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      {rate.status === 'ACTIVE' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
                          Superseded
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-slate-600 max-w-sm truncate" title={rate.description}>
                      {rate.description}
                    </td>
                    <td className="px-5 py-3 text-right text-slate-500">
                      {new Date(rate.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIsConfirmOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 z-10 animate-fadeIn text-xs">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Confirm Platform Commission Rate Update
              </h3>
              <p className="text-slate-600 leading-relaxed">
                You are about to configure the platform commission rate to{' '}
                <strong className="text-slate-900 font-bold">
                  {(basisPoints / 100).toFixed(2)}% ({basisPoints} bps)
                </strong>
                . This rate will apply to all eligible completed suborders starting{' '}
                <strong className="text-slate-900">{new Date(effectiveFrom).toLocaleString()}</strong>.
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700">
              <span className="font-semibold block">Justification:</span>
              <p className="italic">{description}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsConfirmOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmUpdate}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-xs"
              >
                Confirm & Apply Rate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
