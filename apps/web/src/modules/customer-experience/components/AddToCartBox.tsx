import React, { useState } from 'react';
import { ShoppingCart, Heart, ShieldCheck, Truck, RefreshCw, AlertTriangle } from 'lucide-react';
import { ProductItem } from '../api/customerExperienceApi.js';
import { formatLKR } from '../utils/formatters.js';

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
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold || 5);

  const handleIncrement = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  const handleAddToCart = async () => {
    if (isOutOfStock || isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);
    try {
      await onAddToCart(quantity);
      setFeedback('Added to cart successfully!');
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setFeedback(err?.message || 'Failed to add item to cart');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      {/* Price & Stock Display */}
      <div>
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
          Marketplace Price
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl sm:text-3xl font-black text-slate-900">
            {formatLKR(product.priceInCents)}
          </span>
          <span className="text-xs text-slate-500 font-medium">incl. taxes</span>
        </div>

        {/* Stock Status Badge */}
        <div className="mt-3">
          {isOutOfStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="w-3.5 h-3.5" />
              Only {product.stock} units remaining in stock
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <ShieldCheck className="w-3.5 h-3.5" />
              In Stock ({product.stock} available)
            </span>
          )}
        </div>
      </div>

      {/* Quantity & Actions */}
      {!isOutOfStock && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Quantity:
            </span>
            <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
              <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1 || isSubmitting}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition font-bold text-sm"
              >
                -
              </button>
              <span className="w-10 text-center font-bold text-sm text-slate-900">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= product.stock || isSubmitting}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition font-bold text-sm"
              >
                +
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Buttons */}
      <div className="space-y-2.5">
        <button
          type="button"
          disabled={isOutOfStock || isSubmitting || isLoading}
          onClick={handleAddToCart}
          className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-sm ${
            isOutOfStock
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white'
          }`}
        >
          {isSubmitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ShoppingCart className="w-4 h-4" />
          )}
          <span>{isOutOfStock ? 'Currently Unavailable' : 'Add to Shopping Cart'}</span>
        </button>

        <button
          type="button"
          onClick={onToggleWishlist}
          className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs transition border flex items-center justify-center gap-2 ${
            isWishlisted
              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current text-rose-600' : ''}`} />
          <span>{isWishlisted ? 'Saved in Wishlist' : 'Add to Wishlist'}</span>
        </button>

        {feedback && (
          <div
            className={`p-2 rounded text-center text-xs font-semibold ${
              feedback.includes('success')
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-rose-50 text-rose-800'
            }`}
          >
            {feedback}
          </div>
        )}
      </div>

      {/* Trust Badges */}
      <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <Truck className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Island-wide courier delivery across all 25 districts</span>
        </div>
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Direct merchant warranty & spare-part authenticity</span>
        </div>
      </div>
    </div>
  );
};
