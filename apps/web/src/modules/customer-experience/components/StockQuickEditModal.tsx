import React, { useState } from 'react';
import { X, PackageCheck, AlertCircle, Loader2 } from 'lucide-react';
import { ProductItem, sellerProductsApi } from '../api/customerExperienceApi.js';

interface StockQuickEditModalProps {
  product: ProductItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const StockQuickEditModal: React.FC<StockQuickEditModalProps> = ({
  product,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [newStock, setNewStock] = useState<number>(product?.stock ?? 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newStock < 0) {
      setErrorMessage('Stock quantity cannot be negative.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await sellerProductsApi.adjustStock(product._id, {
        newQuantity: Number(newStock),
      });

      if (response.success) {
        onSuccess();
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update inventory stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10">
        <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Quick Stock Update</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <div className="text-xs text-slate-500 mb-0.5">Product SKU: {product.sku}</div>
            <div className="font-bold text-slate-900 text-sm truncate">{product.name}</div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
              Available Units in Inventory *
            </label>
            <input
              type="number"
              min={0}
              value={newStock}
              onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
              required
              className="w-full text-sm font-bold px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Currently registered stock: <strong>{product.stock} units</strong>
            </p>
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Update Stock</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
