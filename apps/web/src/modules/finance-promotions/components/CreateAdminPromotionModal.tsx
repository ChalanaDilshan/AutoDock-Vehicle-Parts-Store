import React, { useState } from 'react';
import {
  PromotionDiscountType,
  adminPromotionApi,
} from '../api/financePromotionsApi.js';
import { rupeesToCents } from '../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  Input,
  Modal,
  Select,
} from '../../../shared/components/index.js';

interface CreateAdminPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAdminPromotionModal: React.FC<
  CreateAdminPromotionModalProps
> = ({ isOpen, onClose, onSuccess }) => {
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] =
    useState<PromotionDiscountType>('PERCENTAGE');
  const [percentageValue, setPercentageValue] = useState(10);
  const [fixedAmountRupees, setFixedAmountRupees] = useState(1000);
  const [minSpendRupees, setMinSpendRupees] = useState(0);
  const [maxDiscountRupees, setMaxDiscountRupees] = useState('');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [totalUsageLimit, setTotalUsageLimit] = useState('');
  const [perCustomerLimit, setPerCustomerLimit] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!code.trim() || !title.trim()) {
      setErrorMessage('Coupon code and campaign title are required.');
      return;
    }

    const discountValue =
      discountType === 'PERCENTAGE'
        ? Math.round(percentageValue * 100)
        : rupeesToCents(fixedAmountRupees);

    setIsSubmitting(true);
    try {
      await adminPromotionApi.createPromotion({
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim() || undefined,
        discountType,
        discountValue,
        minSpendInCents: minSpendRupees > 0 ? rupeesToCents(minSpendRupees) : 0,
        maxDiscountInCents: maxDiscountRupees
          ? rupeesToCents(Number(maxDiscountRupees))
          : undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalUsageLimit: totalUsageLimit ? Number(totalUsageLimit) : undefined,
        perCustomerLimit: Number(perCustomerLimit) || 1,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to create platform campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Platform Promotion"
      subtitle="Platform-funded discount reimbursed to participating merchants via subsidy ledger"
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Coupon Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. AUTODOCK15"
          />
          <Input
            label="Campaign Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Island-Wide Festival Offer"
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
              label="Percentage (%)"
              type="number"
              min={1}
              max={100}
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
            label="Minimum Spend (LKR)"
            type="number"
            min={0}
            value={minSpendRupees}
            onChange={(e) => setMinSpendRupees(Number(e.target.value))}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Max Discount Cap (LKR)"
            type="number"
            min={0}
            value={maxDiscountRupees}
            onChange={(e) => setMaxDiscountRupees(e.target.value)}
            placeholder="Optional cap"
          />
          <Input
            label="Total Redemptions Limit"
            type="number"
            min={1}
            value={totalUsageLimit}
            onChange={(e) => setTotalUsageLimit(e.target.value)}
            placeholder="Leave blank for unlimited"
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
            label="Per-Customer Limit"
            type="number"
            min={1}
            value={perCustomerLimit}
            onChange={(e) => setPerCustomerLimit(Number(e.target.value))}
          />
        </div>

        <Input
          label="Description (Optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Terms or campaign details"
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Launch Promotion
          </Button>
        </div>
      </form>
    </Modal>
  );
};
