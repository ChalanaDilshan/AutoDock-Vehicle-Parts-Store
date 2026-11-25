import React, { useState, useEffect } from 'react';
import { Truck, Plus, Trash2, Send } from 'lucide-react';
import {
  deliveryRateApi,
  DeliveryZoneRecord,
  DeliveryRateProposalRecord,
  DistrictRateProposalItem,
  SRI_LANKAN_DISTRICTS,
} from '../../api/ordersDeliveryApi.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Badge,
  Button,
  Input,
  PageHeader,
  Select,
} from '../../../../shared/components/index.js';

export const SellerDeliveryRatesPage: React.FC = () => {
  const [activeRates, setActiveRates] = useState<DeliveryZoneRecord[]>([]);
  const [proposals, setProposals] = useState<DeliveryRateProposalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [districtRates, setDistrictRates] = useState<DistrictRateProposalItem[]>([
    {
      district: 'Colombo',
      deliveryFeeInCents: 45000,
      estimatedDaysMin: 1,
      estimatedDaysMax: 2,
    },
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
      setErrorMessage(err?.message || 'Unable to load your delivery rate schedule.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  const handleAddDistrictRow = () => {
    setFormError(null);
    if (districtRates.some((r) => r.district === newDistrict)) {
      setFormError(`${newDistrict} is already included in this draft proposal.`);
      return;
    }
    setDistrictRates((prev) => [
      ...prev,
      {
        district: newDistrict,
        deliveryFeeInCents: Math.max(0, Math.round(newFeeLkr * 100)),
        estimatedDaysMin: Math.max(1, newMinDays),
        estimatedDaysMax: Math.max(newMinDays, newMaxDays),
      },
    ]);
  };

  const handleSubmitProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (districtRates.length === 0) {
      setFormError('Add at least one district rate before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await deliveryRateApi.submitProposal({ districtRates });
      if (response.success) {
        setFormSuccess('Delivery rate proposal submitted to platform administrators for review.');
        await fetchRates();
      }
    } catch (err: any) {
      setFormError(err?.message || 'Failed to submit proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Delivery Rates & District Shipping"
        subtitle="Configure district delivery charges in LKR and submit rate changes for review"
        backTo="/seller/dashboard"
        backLabel="Seller Portal"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {/* Active Rates */}
      <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Truck className="w-4 h-4 text-slate-500" />
            <h2>Active Approved Delivery Rates</h2>
          </div>
          <span className="text-xs text-slate-500">
            {activeRates.length} active zones
          </span>
        </div>

        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading active rates...</div>
        ) : activeRates.length === 0 ? (
          <div className="p-6 text-sm text-slate-500">
            No custom district rates approved yet. Platform default shipping rates apply.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-5">
            {activeRates.map((rate) => (
              <div
                key={rate._id}
                className="border border-slate-200 rounded-lg p-3.5 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-semibold text-slate-900">
                    {rate.district} District
                  </div>
                  <div className="text-xs text-slate-500">
                    Est. {rate.estimatedDaysMin}–{rate.estimatedDaysMax} days
                  </div>
                </div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  {formatLKR(rate.deliveryFeeInCents)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Propose New Rates */}
      <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-5">
        <div className="border-b border-slate-200 pb-3">
          <h2 className="text-base font-semibold text-slate-900">
            Submit New Rate Proposal
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Add district rates below and submit them for approval
          </p>
        </div>

        {formError && <Alert variant="danger">{formError}</Alert>}
        {formSuccess && <Alert variant="success">{formSuccess}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end bg-slate-50 p-4 rounded-lg border border-slate-200">
          <Select
            label="District"
            value={newDistrict}
            onChange={(e) => setNewDistrict(e.target.value)}
            options={SRI_LANKAN_DISTRICTS.map((d) => ({ value: d, label: d }))}
          />
          <Input
            label="Fee (LKR)"
            type="number"
            min={0}
            value={newFeeLkr}
            onChange={(e) => setNewFeeLkr(Number(e.target.value))}
          />
          <Input
            label="Min Days"
            type="number"
            min={1}
            value={newMinDays}
            onChange={(e) => setNewMinDays(Number(e.target.value))}
          />
          <Input
            label="Max Days"
            type="number"
            min={1}
            value={newMaxDays}
            onChange={(e) => setNewMaxDays(Number(e.target.value))}
          />
          <Button
            type="button"
            variant="outline"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleAddDistrictRow}
          >
            Add District
          </Button>
        </div>

        <form onSubmit={handleSubmitProposal} className="space-y-4">
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-2.5 px-4">District</th>
                  <th className="py-2.5 px-4">Fee</th>
                  <th className="py-2.5 px-4">Estimated Window</th>
                  <th className="py-2.5 px-4 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {districtRates.map((item) => (
                  <tr key={item.district}>
                    <td className="py-2.5 px-4 font-medium text-slate-900">
                      {item.district}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900 tabular-nums">
                      {formatLKR(item.deliveryFeeInCents)}
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">
                      {item.estimatedDaysMin}–{item.estimatedDaysMax} days
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setDistrictRates((p) =>
                            p.filter((r) => r.district !== item.district)
                          )
                        }
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              leftIcon={<Send className="w-4 h-4" />}
            >
              Submit Proposal to Admin
            </Button>
          </div>
        </form>
      </section>

      {/* Proposal History */}
      {proposals.length > 0 && (
        <section className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Proposal History</h2>
          </div>
          <div className="divide-y divide-slate-200 text-sm">
            {proposals.map((prop) => (
              <div
                key={prop._id}
                className="p-4 flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <span className="font-medium text-slate-900">
                    {prop.districtRates.length} district rates submitted
                  </span>
                  <span className="text-xs text-slate-500 ml-2">
                    {new Date(prop.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <Badge
                  variant={
                    prop.status === 'APPROVED'
                      ? 'success'
                      : prop.status === 'REJECTED'
                        ? 'danger'
                        : 'warning'
                  }
                >
                  {prop.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
