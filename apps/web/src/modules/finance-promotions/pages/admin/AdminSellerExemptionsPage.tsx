import React, { useState, useEffect } from 'react';
import { Plus, ShieldOff, ShieldCheck } from 'lucide-react';
import {
  adminFinanceApi,
  SellerCommissionExemption,
} from '../../api/financePromotionsApi.js';
import { ExemptionStatusBadge } from '../../components/FinanceStatusBadge.js';
import {
  Alert,
  Button,
  EmptyState,
  Input,
  Modal,
  PageHeader,
} from '../../../../shared/components/index.js';

const OBJECT_ID_REGEX = /^[0-9a-fA-F]{24}$/;

export const AdminSellerExemptionsPage: React.FC = () => {
  const [exemptions, setExemptions] = useState<SellerCommissionExemption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [grantModalOpen, setGrantModalOpen] = useState(false);
  const [sellerIdInput, setSellerIdInput] = useState('');
  const [reasonInput, setReasonInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadExemptions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await adminFinanceApi.getExemptions({ limit: 20 });
      if (response.success && response.data) {
        setExemptions(response.data.exemptions || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load seller exemptions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExemptions();
  }, []);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!OBJECT_ID_REGEX.test(sellerIdInput.trim())) {
      setFormError('Seller ID must be a valid 24-character hexadecimal ObjectId.');
      return;
    }
    if (reasonInput.trim().length < 5) {
      setFormError('Provide a reason explaining this exemption.');
      return;
    }

    setIsSubmitting(true);
    try {
      await adminFinanceApi.grantExemption({
        sellerId: sellerIdInput.trim(),
        reason: reasonInput.trim(),
      });
      setGrantModalOpen(false);
      setSellerIdInput('');
      setReasonInput('');
      await loadExemptions();
    } catch (err: any) {
      setFormError(err?.message || 'Unable to grant seller exemption.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevoke = async (sellerId: string) => {
    const reason = window.prompt('State reason for revoking 0% exemption:');
    if (!reason || reason.trim().length < 3) return;
    try {
      await adminFinanceApi.revokeExemption(sellerId, { reason: reason.trim() });
      await loadExemptions();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to revoke exemption.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Seller Commission Exemptions"
        subtitle="Manage partner merchants granted a 0% commission rate waiver"
        backTo="/admin/finance"
        backLabel="Finance Overview"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => {
              setFormError(null);
              setGrantModalOpen(true);
            }}
          >
            Grant Seller Exemption
          </Button>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="h-56 bg-white border border-slate-200 rounded-lg" />
      ) : exemptions.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="w-6 h-6" />}
          title="No active seller exemptions"
          description="All sellers are currently billed at the standard platform commission rate."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Seller</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Activated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {exemptions.map((ex) => {
                  const sId =
                    typeof ex.sellerId === 'object' ? ex.sellerId._id : ex.sellerId;
                  const sName =
                    typeof ex.sellerId === 'object'
                      ? ex.sellerId.businessName || ex.sellerId.storeName || sId
                      : sId;
                  return (
                    <tr key={ex._id}>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        {sName}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{ex.reason}</td>
                      <td className="py-3 px-4">
                        <ExemptionStatusBadge status={ex.status} />
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(ex.activatedAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {ex.status === 'ACTIVE' && (
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<ShieldOff className="w-3.5 h-3.5 text-rose-600" />}
                            onClick={() => handleRevoke(sId)}
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={grantModalOpen}
        onClose={() => setGrantModalOpen(false)}
        title="Enable 0% commission for a specific seller"
        size="md"
      >
        <form onSubmit={handleGrant} className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Input
            label="Seller ID (24-hex ObjectId)"
            required
            value={sellerIdInput}
            onChange={(e) => setSellerIdInput(e.target.value)}
            placeholder="e.g. 64b8f...24 chars"
          />

          <Input
            label="Justification Reason"
            required
            value={reasonInput}
            onChange={(e) => setReasonInput(e.target.value)}
            placeholder="e.g. Strategic Tier-1 OEM distributor"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setGrantModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Grant Exemption
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
