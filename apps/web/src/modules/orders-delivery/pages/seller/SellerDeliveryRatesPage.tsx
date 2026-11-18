import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  ShieldAlert,
  Send,
} from 'lucide-react';
import {
  deliveryRateApi,
  DeliveryRateProposalRecord,
  DeliveryZoneRecord,
  DistrictRateProposalItem,
  SRI_LANKAN_DISTRICTS,
} from '../../api/ordersDeliveryApi.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const SellerDeliveryRatesPage: React.FC = () => {
  const [activeRates, setActiveRates] = useState<DeliveryZoneRecord[]>([]);
  const [proposals, setProposals] = useState<DeliveryRateProposalRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Proposal Form State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Default rates list for proposal form
  const [districtRates, setDistrictRates] = useState<DistrictRateProposalItem[]>([
    { district: 'Colombo', deliveryFeeInCents: 45000, estimatedDaysMin: 1, estimatedDaysMax: 2 },
    { district: 'Gampaha', deliveryFeeInCents: 50000, estimatedDaysMin: 2, estimatedDaysMax: 3 },
    { district: 'Kalutara', deliveryFeeInCents: 55000, estimatedDaysMin: 2, estimatedDaysMax: 3 },
    { district: 'Kandy', deliveryFeeInCents: 65000, estimatedDaysMin: 3, estimatedDaysMax: 5 },
  ]);

  const [newDistrict, setNewDistrict] = useState<string>('Galle');
  const [newFeeLkr, setNewFeeLkr] = useState<number>(600);
  const [newMinDays, setNewMinDays] = useState<number>(2);
  const [newMaxDays, setNewMaxDays] = useState<number>(4);

  const fetchRates = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await deliveryRateApi.getSellerRates();
      if (response.success && response.data) {
        setActiveRates(response.data.activeRates || []);
        setProposals(response.data.proposals || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch delivery rate configurations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleAddDistrictRate = () => {
    if (districtRates.some((r) => r.district === newDistrict)) {
      setFormError(`District ${newDistrict} is already included in your proposal list.`);
      return;
    }
    setFormError(null);
    setDistrictRates([
      ...districtRates,
      {
        district: newDistrict,
        deliveryFeeInCents: Math.round(newFeeLkr * 100),
        estimatedDaysMin: newMinDays,
        estimatedDaysMax: newMaxDays,
      },
    ]);
  };

  const handleRemoveDistrictRate = (district: string) => {
    setDistrictRates(districtRates.filter((r) => r.district !== district));
  };

  const handleRateFeeChange = (district: string, feeInLkr: number) => {
    setDistrictRates(
      districtRates.map((r) =>
        r.district === district
          ? { ...r, deliveryFeeInCents: Math.round(feeInLkr * 100) }
          : r
      )
    );
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (districtRates.length === 0) {
      setFormError('Please configure at least one district delivery rate.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setFormSuccess(null);

    try {
      const response = await deliveryRateApi.submitProposal({
        districtRates,
      });

      if (response.success) {
        setFormSuccess('Delivery rate proposal submitted to platform administrators for review.');
        fetchRates();
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Delivery Rate Proposals & Coverage
          </h1>
          <p className="text-xs text-slate-500">
            Propose district delivery fees for administrator approval. Rates become active only after platform verification.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200 font-semibold">
          <Truck className="w-4 h-4 text-blue-600" />
          <span>District-Level Pricing</span>
        </div>
      </div>

      {/* Governance Notice */}
      <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-1">
        <div className="font-bold flex items-center gap-1.5 text-amber-800">
          <ShieldAlert className="w-4 h-4" />
          <span>AutoDock Delivery Governance Policy</span>
        </div>
        <p className="leading-relaxed">
          Sellers propose flat delivery fees per Sri Lankan district. Platform administrators review and approve all proposals before they activate in checkout. Delivery charges are strictly excluded from AutoDock marketplace commission fees.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3" data-testid="rates-loading">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500">Loading delivery rates and proposals...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column: Submit New Proposal Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                <span>Submit New Rate Proposal</span>
              </h2>
              <p className="text-[11px] text-slate-500">
                Configure rates across Sri Lankan administrative districts
              </p>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            {/* Quick Add Row */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
              <span className="font-bold text-slate-700 block">Add District to Proposal</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">District</label>
                  <select
                    value={newDistrict}
                    onChange={(e) => setNewDistrict(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
                  >
                    {SRI_LANKAN_DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Fee (LKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={newFeeLkr}
                    onChange={(e) => setNewFeeLkr(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Min Days</label>
                  <input
                    type="number"
                    min="1"
                    max="14"
                    value={newMinDays}
                    onChange={(e) => setNewMinDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-500 block mb-0.5">Max Days</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={newMaxDays}
                    onChange={(e) => setNewMaxDays(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddDistrictRate}
                  className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add District</span>
                </button>
              </div>
            </div>

            {/* Configured Districts Table */}
            <form onSubmit={handleSubmitProposal} className="space-y-4">
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700 block">
                  Proposed Rates ({districtRates.length} Districts)
                </span>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl">
                  {districtRates.map((r) => (
                    <div
                      key={r.district}
                      className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-50"
                    >
                      <div>
                        <span className="font-bold text-slate-900 block">{r.district}</span>
                        <span className="text-[10px] text-slate-400">
                          {r.estimatedDaysMin}-{r.estimatedDaysMax} business days
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 text-xs">LKR</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={r.deliveryFeeInCents / 100}
                            onChange={(e) =>
                              handleRateFeeChange(r.district, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold text-right"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDistrictRate(r.district)}
                          className="text-slate-400 hover:text-red-600 transition"
                          title="Remove district"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || districtRates.length === 0}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting for Admin Approval...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Proposal to Admin</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Active Rates & Proposals History */}
          <div className="space-y-6">
            {/* Active Approved Rates */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Active Approved Delivery Rates</span>
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Currently active in customer checkout for your store
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {activeRates.length} Districts
                </span>
              </div>

              {activeRates.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No approved delivery rates yet. Submit a proposal to activate store rates.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto">
                  {activeRates.map((rate) => (
                    <div key={rate._id} className="py-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold text-slate-900">{rate.district} District</span>
                        <span className="text-[10px] text-slate-400 block">
                          Version {rate.version} • {rate.estimatedDaysMin}-{rate.estimatedDaysMax} days
                        </span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatLKR(rate.deliveryFeeInCents)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Historical Proposals */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Proposal Submissions Log</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Track review status and administrator feedback
                </p>
              </div>

              {proposals.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">
                  No proposal records found.
                </p>
              ) : (
                <div className="space-y-3">
                  {proposals.map((prop) => (
                    <div
                      key={prop._id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-slate-600 text-[11px]">
                          Submitted {new Date(prop.createdAt).toLocaleDateString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            prop.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : prop.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {prop.status}
                        </span>
                      </div>

                      <div className="text-slate-600 text-[11px]">
                        Coverage: <strong>{prop.districtRates?.length || 0} districts</strong>
                      </div>

                      {prop.reviewerNotes && (
                        <div className="pt-1 border-t border-slate-200 text-slate-500 text-[11px]">
                          <strong>Reviewer Feedback:</strong> {prop.reviewerNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
