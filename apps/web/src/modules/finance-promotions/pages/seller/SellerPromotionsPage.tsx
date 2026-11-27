import React, { useState, useEffect } from 'react';
import { Plus, BarChart3, Pause, Play, Tag } from 'lucide-react';
import {
  sellerPromotionApi,
  PromotionRecord,
} from '../../api/financePromotionsApi.js';
import { PromotionStatusBadge } from '../../components/FinanceStatusBadge.js';
import { CreateSellerPromotionModal } from '../../components/CreateSellerPromotionModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  EmptyState,
  Modal,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerPromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<PromotionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const [analytics, setAnalytics] = useState<{
    promotion: PromotionRecord;
    redemptionCount: number;
    totalDiscountFundedInCents: number;
  } | null>(null);

  const loadPromotions = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await sellerPromotionApi.getPromotions({ limit: 25 });
      if (response.success && response.data) {
        setPromotions(response.data.promotions || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load your promotions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPromotions();
  }, []);

  const handleToggleStatus = async (promo: PromotionRecord) => {
    const nextStatus = promo.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await sellerPromotionApi.updateStatus(promo._id, nextStatus);
      await loadPromotions();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to update promotion status.');
    }
  };

  const handleViewAnalytics = async (id: string) => {
    try {
      const res = await sellerPromotionApi.getPromotionById(id);
      if (res.success && res.data) {
        setAnalytics(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load promotion analytics.');
    }
  };

  const formatDiscount = (promo: PromotionRecord) =>
    promo.discountType === 'PERCENTAGE'
      ? `${promo.discountValue / 100}% Off`
      : `${formatLKR(promo.discountValue)} Off`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Seller Promotions"
        subtitle="Create seller-funded coupon codes to boost sales on specific parts or orders"
        backTo="/seller/dashboard"
        backLabel="Seller Portal"
        actions={
          <Button
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setCreateOpen(true)}
          >
            Create Coupon
          </Button>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : promotions.length === 0 ? (
        <EmptyState
          icon={<Tag className="w-6 h-6" />}
          title="No store coupons created"
          description="Create a discount code funded by your store margin for customers at checkout."
          action={
            <Button
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setCreateOpen(true)}
            >
              Create First Coupon
            </Button>
          }
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Campaign Title</th>
                  <th className="py-3 px-4">Discount</th>
                  <th className="py-3 px-4">Usage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {promotions.map((promo) => (
                  <tr key={promo._id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {promo.code}
                    </td>
                    <td className="py-3.5 px-4 text-slate-900 font-medium">
                      {promo.title}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-[#E11D30]">
                      {formatDiscount(promo)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {promo.currentUsageCount}
                      {promo.totalUsageLimit ? ` / ${promo.totalUsageLimit}` : ''}
                    </td>
                    <td className="py-3.5 px-4">
                      <PromotionStatusBadge status={promo.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<BarChart3 className="w-3.5 h-3.5" />}
                          onClick={() => handleViewAnalytics(promo._id)}
                        >
                          Analytics
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={
                            promo.status === 'ACTIVE' ? (
                              <Pause className="w-3.5 h-3.5" />
                            ) : (
                              <Play className="w-3.5 h-3.5" />
                            )
                          }
                          onClick={() => handleToggleStatus(promo)}
                        >
                          {promo.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateSellerPromotionModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={loadPromotions}
      />

      <Modal
        isOpen={Boolean(analytics)}
        onClose={() => setAnalytics(null)}
        title="Promotion Analytics"
        subtitle={analytics ? `${analytics.promotion.code} · ${analytics.promotion.title}` : ''}
        size="sm"
      >
        {analytics && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <span className="text-xs text-slate-500 block">Redemptions</span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {analytics.redemptionCount}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <span className="text-xs text-slate-500 block">
                Total Discount Funded
              </span>
              <span className="text-xl font-bold text-slate-900 tabular-nums">
                {formatLKR(analytics.totalDiscountFundedInCents)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
