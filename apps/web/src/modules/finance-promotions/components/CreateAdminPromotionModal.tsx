import React, { useState } from 'react';
import { X, Tag, AlertCircle, Loader2, Check, ShieldCheck } from 'lucide-react';
import { adminPromotionApi, PromotionDiscountType } from '../api/financePromotionsApi.js';
import { rupeesToCents } from '../../customer-experience/utils/formatters.js';

interface CreateAdminPromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateAdminPromotionModal: React.FC<CreateAdminPromotionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [code, setCode] = useState<string>('');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [discountType, setDiscountType] = useState<PromotionDiscountType>('PERCENTAGE');
  const [percentageValue, setPercentageValue] = useState<number>(10);
  const [fixedAmountRupees, setFixedAmountRupees] = useState<number>(1000);
  const [minSpendRupees, setMinSpendRupees] = useState<number>(0);
  const [maxDiscountRupees, setMaxDiscountRupees] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [totalUsageLimit, setTotalUsageLimit] = useState<string>('');
  const [perCustomerLimit, setPerCustomerLimit] = useState<number>(1);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanCode = code.trim().toUpperCase();
    if (!/^[A-Z0-9_-]{4,20}$/.test(cleanCode)) {
      setErrorMessage(
        'Promo code must be 4 to 20 uppercase alphanumeric characters, dashes, or underscores.'
      );
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      setErrorMessage('End date must be after start date.');
      return;
    }

    let discountValue: number;
    if (discountType === 'PERCENTAGE') {
      if (percentageValue < 1 || percentageValue > 50) {
        setErrorMessage('Percentage discount must be between 1% and 50%.');
        return;
      }
      discountValue = Math.round(percentageValue * 100); // in basis points
    } else {
      if (fixedAmountRupees <= 0) {
        setErrorMessage('Fixed discount amount must be greater than Rs. 0.00.');
        return;
      }
      discountValue = rupeesToCents(fixedAmountRupees);
    }

    setIsSubmitting(true);

    try {
      const payload = {
        code: cleanCode,
        title: title.trim(),
        description: description.trim() || undefined,
        discountType,
        discountValue,
        minSpendInCents: rupeesToCents(minSpendRupees),
        maxDiscountInCents: maxDiscountRupees ? rupeesToCents(parseFloat(maxDiscountRupees)) : undefined,
        applicableCategoryIds: [],
        applicableProductIds: [],
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalUsageLimit: totalUsageLimit ? parseInt(totalUsageLimit, 10) : undefined,
        perCustomerLimit: perCustomerLimit || 1,
      };

      const res = await adminPromotionApi.createPromotion(payload);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMessage(res.message || 'Failed to create platform promotion.');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'An error occurred while creating platform promotion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-5 z-10 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Create AutoDock Marketplace Promotion
              </h3>
              <p className="text-xs text-slate-500">
                Platform-Wide Campaign Funded by AutoDock (Subsidy Accrual)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Funding Classification Notice */}
        <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2">
          <ShieldCheck className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
          <div className="space-y-0.5">
            <span className="font-bold">AutoDock Platform Funding Commitment</span>
            <p className="text-blue-800 leading-relaxed">
              This promotion is classified as <strong>AUTODOCK_FUNDED</strong>. When customers redeem
              this code at checkout, the merchant receives full suborder value, and the discount is
              automatically logged in the <strong>Platform Subsidy Ledger</strong> as an AutoDock obligation.
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Coupon Code */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Marketplace Code * (e.g. AUTODOCK15, LANKA2026)
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="4-20 chars (A-Z, 0-9, -)"
                required
                maxLength={20}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold tracking-wider uppercase focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Title */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Campaign Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. National Spare Parts Festival"
                required
                maxLength={100}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Terms and conditions for customer display..."
              rows={2}
              maxLength={500}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none resize-none"
            />
          </div>

          {/* Discount Configuration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Discount Type *
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as PromotionDiscountType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="PERCENTAGE">Percentage (%) Discount</option>
                <option value="FIXED_AMOUNT">Fixed Amount (LKR) Discount</option>
              </select>
            </div>

            {discountType === 'PERCENTAGE' ? (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Discount Percentage (1% - 50%) *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="50"
                    step="0.5"
                    value={percentageValue}
                    onChange={(e) => setPercentageValue(parseFloat(e.target.value) || 0)}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="font-bold text-slate-600">%</span>
                </div>
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Fixed Discount Amount (LKR) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={fixedAmountRupees}
                  onChange={(e) => setFixedAmountRupees(parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            )}
          </div>

          {/* Spend and Cap Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Minimum Cart Spend (LKR)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={minSpendRupees}
                onChange={(e) => setMinSpendRupees(parseFloat(e.target.value) || 0)}
                placeholder="0 for no minimum"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Maximum Discount Cap (LKR, optional)
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={maxDiscountRupees}
                onChange={(e) => setMaxDiscountRupees(e.target.value)}
                placeholder="Leave blank for uncapped"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Validity Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Start Date *</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">End Date *</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                min={startDate}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Usage Limits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Total Redemptions Limit (Optional)
              </label>
              <input
                type="number"
                min="1"
                value={totalUsageLimit}
                onChange={(e) => setTotalUsageLimit(e.target.value)}
                placeholder="Leave blank for unlimited"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Per Customer Usage Limit *
              </label>
              <input
                type="number"
                min="1"
                value={perCustomerLimit}
                onChange={(e) => setPerCustomerLimit(parseInt(e.target.value, 10) || 1)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Campaign...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Launch Marketplace Promotion</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
