import React, { useState, useEffect } from 'react';
import { Plus, Pause, Play, Tag } from 'lucide-react';
import {
  adminPromotionApi,
  PromotionRecord,
} from '../../api/financePromotionsApi.js';
import { PromotionStatusBadge } from '../../components/FinanceStatusBadge.js';
import { CreateAdminPromotionModal } from '../../components/CreateAdminPromotionModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/index.js';

export const AdminPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadPromotions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminPromotionApi.getPromotions({ limit: 25 });
      if (res.success && res.data) {
        setPromotions(res.data.promotions || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load platform promotions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleToggle = async (promo: PromotionRecord) => {
    const next = promo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await adminPromotionApi.updateStatus(promo._id, next);
      await loadPromotions();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to update promotion.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Promotional Campaigns"
        subtitle="Manage AutoDock-funded discount codes across all marketplace stores"
        backTo="/admin/finance"
        backLabel="Finance Overview"
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Create Campaign
          </Button>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : promotions.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-6 h-6" />}
          title="No platform campaigns created"
          description="Create platform-wide promotional coupons reimbursed via the subsidy ledger."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Title</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {promotions.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {p.code}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">{p.title}</td>
                    <td className="py-3.5 px-4 text-blue-700 font-medium">
                      {p.discountType === 'PERCENTAGE'
                        ? `${p.discountValue / 100}% Off`
                        : `${formatLKR(p.discountValue)} Off`}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.currentUsageCount}
                      {p.totalUsageLimit ? ` / ${p.totalUsageLimit}` : ''}
                    </td>
                    <td className="py-3.5 px-4">
                      <PromotionStatusBadge status={p.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={
                          p.status === 'ACTIVE' ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )
                        }
                        onClick={() => handleToggle(p)}
                      >
                        {p.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateAdminPromotionModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={loadPromotions}
      />
    </div>
  );
};
