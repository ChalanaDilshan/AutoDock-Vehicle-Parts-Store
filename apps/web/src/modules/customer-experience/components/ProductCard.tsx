import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, CheckCircle2, AlertCircle, Package } from 'lucide-react';
import { ProductItem } from '../api/customerExperienceApi.js';
import { formatLKR } from '../utils/formatters.js';

interface ProductCardProps {
  product: ProductItem;
  fitmentBadge?: {
    status: 'EXACT_FIT' | 'DOES_NOT_FIT' | 'UNIVERSAL_FIT' | 'UNCERTAIN';
    label?: string;
  };
  onAddToCart?: (product: ProductItem) => void;
  onToggleWishlist?: (product: ProductItem) => void;
  isWishlisted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  fitmentBadge,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
}) => {
  const primaryImage =
    product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;

  const brandName =
    typeof product.brandId === 'object' && product.brandId !== null
      ? product.brandId.name
      : undefined;

  const conditionLabel =
    product.condition === 'NEW' || (product.condition as string) === 'BRAND_NEW'
      ? 'New'
      : product.condition === 'RECONDITIONED'
        ? 'Reconditioned'
        : 'Used';

  const outOfStock = product.stock <= 0;

  return (
    <article className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col hover:border-slate-300 hover:shadow-sm transition-[border-color,box-shadow] duration-150">
      {/* Image */}
      <Link
        to={`/products/${product._id}`}
        className="relative block aspect-[4/3] bg-slate-100 overflow-hidden border-b border-slate-100"
      >
        {primaryImage ? (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400">
            <Package className="w-10 h-10 stroke-[1.5]" aria-hidden="true" />
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
          <span className="px-2 py-0.5 text-xs font-medium rounded bg-white/95 text-slate-700 border border-slate-200">
            {conditionLabel}
          </span>
          {product.isUniversalFit && !fitmentBadge && (
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-blue-50 text-blue-700 border border-blue-200">
              Universal Fit
            </span>
          )}
        </div>

        {onToggleWishlist && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onToggleWishlist(product);
            }}
            aria-label={isWishlisted ? 'Remove from Wishlist' : 'Save to Wishlist'}
            className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-md border flex items-center justify-center transition-colors ${
              isWishlisted
                ? 'bg-rose-50 border-rose-200 text-rose-600'
                : 'bg-white/95 border-slate-200 text-slate-500 hover:text-rose-600'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`}
              aria-hidden="true"
            />
          </button>
        )}
      </Link>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate font-medium text-slate-600">
            {brandName || 'OEM / Aftermarket'}
          </span>
          <span className="font-mono shrink-0">{product.sku}</span>
        </div>

        <Link
          to={`/products/${product._id}`}
          className="text-sm font-semibold text-slate-900 hover:text-blue-700 transition-colors line-clamp-2 leading-snug"
        >
          {product.name}
        </Link>

        {/* Fitment indicator */}
        {fitmentBadge && (
          <div className="pt-0.5">
            {fitmentBadge.status === 'EXACT_FIT' && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{fitmentBadge.label || 'Fits your vehicle'}</span>
              </span>
            )}
            {fitmentBadge.status === 'DOES_NOT_FIT' && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{fitmentBadge.label || 'Does not fit'}</span>
              </span>
            )}
          </div>
        )}

        {/* Rating & Stock */}
        <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-2">
          <span className="inline-flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" aria-hidden="true" />
            <span className="font-medium text-slate-700">
              {product.averageRating ? product.averageRating.toFixed(1) : 'New'}
            </span>
            {product.reviewCount > 0 && <span>({product.reviewCount})</span>}
          </span>
          <span className={outOfStock ? 'text-rose-600 font-medium' : 'text-emerald-700 font-medium'}>
            {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
          </span>
        </div>

        {/* Price & Cart Button */}
        <div className="pt-3 mt-1 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="text-base font-bold text-slate-900 tabular-nums">
            {formatLKR(product.priceInCents)}
          </div>

          {onAddToCart && (
            <button
              type="button"
              disabled={outOfStock}
              onClick={() => onAddToCart(product)}
              aria-label="Add to Shopping Cart"
              title="Add to Shopping Cart"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-medium transition-colors shrink-0"
            >
              <ShoppingCart className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Add</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
};
