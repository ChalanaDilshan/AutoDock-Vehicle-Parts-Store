import React, { useState, useEffect } from 'react';
import {
  PromotionDiscountType,
  sellerPromotionApi,
} from '../api/financePromotionsApi.js';
import {
  sellerProductsApi,
  ProductItem,
} from '../../customer-experience/api/customerExperienceApi.js';
import { rupeesToCents } from '../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  Input,
  Modal,
  Select,
} from '../../../shared/components/index.js';

interface CreateSellerPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateSellerPromotionModal: React.FC<
  CreateSellerPromotionModalProps
> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] =
    useState<PromotionDiscountType>('PERCENTAGE');
  const [percentageValue, setPercentageValue] = useState(10);
  const [fixedAmountRupees, setFixedAmountRupees] = useState(500);
  const [minSpendRupees, setMinSpendRupees] = useState(0);
  const [totalUsageLimit, setTotalUsageLimit] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    sellerProductsApi
      .list({ limit: 100 })
      .then((res) => {
        if (res.success && res.data?.items) setProducts(res.data.items);
      })
      .catch(() => {});
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!code.trim() || !title.trim()) {
      setErrorMessage('Coupon code and title are required.');
      return;
    }

    const discountValue =
      discountType === 'PERCENTAGE'
        ? Math.round(percentageValue * 100)
        : rupeesToCents(fixedAmountRupees);

    setIsSubmitting(true);
    try {
      await sellerPromotionApi.createPromotion({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim() || undefined,
        discountType,
        discountValue,
        minSpendInCents: minSpendRupees > 0 ? rupeesToCents(minSpendRupees) : undefined,
        applicableProductIds:
          selectedProductIds.length > 0 ? selectedProductIds : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalUsageLimit: totalUsageLimit ? Number(totalUsageLimit) : undefined,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to create seller promotion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Seller Promotion Coupon"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Alert variant="info" title="Merchant Funding Responsibility">
          Discounts from this coupon are funded directly by your store and reduce your net item revenue before commission.
        </Alert>

        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Coupon Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="4-20 chars (e.g. BRAKE10)"
          />
          <Input
            label="Offer Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Weekend Brake Pad Special"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select
            label="Discount Type"
            value={discountType}
            onChange={(e) =>
              setDiscountType(e.target.value as PromotionDiscountType)
            }
            options={[
              { value: 'PERCENTAGE', label: 'Percentage (%)' },
              { value: 'FIXED_AMOUNT', label: 'Fixed Amount (LKR)' },
            ]}
          />
          {discountType === 'PERCENTAGE' ? (
            <Input
              label="Discount (%)"
              type="number"
              min={1}
              max={90}
              value={percentageValue}
              onChange={(e) => setPercentageValue(Number(e.target.value))}
            />
          ) : (
            <Input
              label="Amount (LKR)"
              type="number"
              min={10}
              value={fixedAmountRupees}
              onChange={(e) => setFixedAmountRupees(Number(e.target.value))}
            />
          )}
          <Input
            label="Min Spend (LKR)"
            type="number"
            min={0}
            value={minSpendRupees}
            onChange={(e) => setMinSpendRupees(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Start Date"
            type="date"
            required
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            label="End Date"
            type="date"
            required
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Input
            label="Total Usage Limit"
            type="number"
            min={1}
            value={totalUsageLimit}
            onChange={(e) => setTotalUsageLimit(e.target.value)}
            placeholder="Leave blank for unlimited"
          />
        </div>

        {products.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Limit to Specific Products (Optional)
            </label>
            <div className="max-h-32 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
              {products.map((p) => (
                <label
                  key={p._id}
                  className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer py-0.5"
                >
                  <input
                    type="checkbox"
                    checked={selectedProductIds.includes(p._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedProductIds((prev) => [...prev, p._id]);
                      } else {
                        setSelectedProductIds((prev) =>
                          prev.filter((id) => id !== p._id)
                        );
                      }
                    }}
                    className="rounded border-slate-300 text-[#E11D30]"
                  />
                  <span className="truncate">{p.name}</span>
                  <span className="font-mono text-slate-400">({p.sku})</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <Input
          label="Notes (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Publish Seller Promotion
          </Button>
        </div>
      </form>
    </Modal>
  );
};
