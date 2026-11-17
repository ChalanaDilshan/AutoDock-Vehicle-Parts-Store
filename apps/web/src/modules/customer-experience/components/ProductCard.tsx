import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Star, CheckCircle2, AlertCircle } from 'lucide-react';
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
    product.images?.find((img) => img.isPrimary)?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80';

  const brandName = typeof product.brandId === 'object' && product.brandId !== null
    ? product.brandId.name
    : 'Generic';

  const isOutOfStock = product.stock <= 0 || product.status === 'OUT_OF_STOCK';

  return (
    <div
      className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition duration-200 flex flex-col overflow-hidden relative"
      data-testid={`product-card-${product._id}`}
    >
      {/* Top Badges */}
      <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 items-start">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow-sm ${
            product.condition === 'NEW'
              ? 'bg-blue-600 text-white'
              : product.condition === 'RECONDITIONED'
              ? 'bg-amber-500 text-white'
              : 'bg-slate-600 text-white'
          }`}
        >
          {product.condition}
        </span>

        {fitmentBadge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 ${
              fitmentBadge.status === 'EXACT_FIT'
                ? 'bg-emerald-600 text-white'
                : fitmentBadge.status === 'UNIVERSAL_FIT'
                ? 'bg-teal-600 text-white'
                : fitmentBadge.status === 'DOES_NOT_FIT'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-700 text-white'
            }`}
          >
            {fitmentBadge.status === 'EXACT_FIT' ? (
              <CheckCircle2 className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            <span>{fitmentBadge.label || fitmentBadge.status.replace('_', ' ')}</span>
          </span>
        )}
      </div>

      {/* Wishlist Button */}
      {onToggleWishlist && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full backdrop-blur-sm transition ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'bg-white/80 text-slate-500 hover:text-rose-600 hover:bg-white'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label="Toggle Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      )}

      {/* Thumbnail Image */}
      <Link to={`/products/${product._id}`} className="block relative aspect-video bg-slate-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80';
          }}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-white text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-red-600 rounded">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold text-blue-700">{brandName}</span>
            <span className="text-[11px] text-slate-400">SKU: {product.sku}</span>
          </div>

          <Link to={`/products/${product._id}`} className="block">
            <h3 className="font-bold text-sm text-slate-900 line-clamp-2 hover:text-blue-600 transition mb-1.5">
              {product.name}
            </h3>
          </Link>

          {/* Rating Summary */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-3">
            <div className="flex items-center text-amber-500">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="ml-1 font-bold text-slate-800">
                {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
              </span>
            </div>
            {product.reviewCount > 0 && (
              <span className="text-slate-400">({product.reviewCount})</span>
            )}
            {product.isUniversalFit && (
              <span className="ml-auto text-[10px] bg-slate-100 text-slate-600 font-semibold px-1.5 py-0.5 rounded">
                Universal
              </span>
            )}
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <div className="text-xs text-slate-400">Price</div>
            <div className="text-base font-extrabold text-slate-900">
              {formatLKR(product.priceInCents)}
            </div>
          </div>

          {onAddToCart && (
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product)}
              className={`p-2 rounded-lg transition flex items-center justify-center ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm'
              }`}
              title={isOutOfStock ? 'Currently out of stock' : 'Add to Shopping Cart'}
              aria-label="Add to Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
