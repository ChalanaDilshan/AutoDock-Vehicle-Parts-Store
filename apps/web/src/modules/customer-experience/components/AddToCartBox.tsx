import React, { useState } from 'react';
import { ShoppingCart, Heart, Minus, Plus, ShieldCheck } from 'lucide-react';
import { ProductItem } from '../api/customerExperienceApi.js';
import { formatLKR } from '../utils/formatters.js';
import { Button } from '../../../shared/components/index.js';

interface AddToCartBoxProps {
  product: ProductItem;
  onAddToCart: (quantity: number) => Promise<void>;
  onToggleWishlist: () => void;
  isWishlisted: boolean;
  isLoading?: boolean;
}

export const AddToCartBox: React.FC<AddToCartBoxProps> = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  isLoading = false,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const isOutOfStock = product.stock <= 0 || product.status === 'OUT_OF_STOCK';
  const maxQty = Math.max(1, product.stock);

  const handleSubmit = async () => {
    if (isOutOfStock) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onAddToCart(quantity);
      setFeedback('Added to your shopping cart.');
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
      <div className="space-y-1">
        <p className="text-xs font-medium text-slate-500">Price</p>
        <div className="text-2xl font-bold text-slate-900 tabular-nums">
          {formatLKR(product.priceInCents)}
        </div>
        <p
          className={`text-sm font-medium ${
            isOutOfStock ? 'text-rose-600' : 'text-emerald-700'
          }`}
        >
          {isOutOfStock ? 'Out of stock' : `${product.stock} available`}
        </p>
      </div>

      {!isOutOfStock && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4">
          <span className="text-sm font-medium text-slate-700">Quantity</span>
          <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 rounded-l-lg"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="w-10 text-center text-sm font-semibold text-slate-900 tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              aria-label="Increase quantity"
              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 rounded-r-lg"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2.5 pt-1">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          disabled={isOutOfStock || isLoading}
          isLoading={isSubmitting}
          leftIcon={<ShoppingCart className="w-4 h-4" />}
          onClick={handleSubmit}
        >
          {isOutOfStock ? 'Currently Unavailable' : 'Add to Shopping Cart'}
        </Button>

        <Button
          variant="outline"
          size="md"
          fullWidth
          leftIcon={
            <Heart
              className={`w-4 h-4 ${isWishlisted ? 'fill-rose-600 text-rose-600' : ''}`}
            />
          }
          onClick={onToggleWishlist}
        >
          {isWishlisted ? 'Saved in Wishlist' : 'Save to Wishlist'}
        </Button>
      </div>

      {feedback && (
        <p role="status" className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
          {feedback}
        </p>
      )}

      <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
        <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
        <span>Dispatched directly by the verified seller store</span>
      </div>
    </div>
  );
};
