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

  const brandName =
    typeof product.brandId === 'object' && product.brandId !== null
      ? product.brandId.name
      : 'Generic';

  const isOutOfStock = product.stock <= 0 || product.status === 'OUT_OF_STOCK';
  const isLowStock = !isOutOfStock && product.stock <= 5;

  return (
    <div
      className="group bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex flex-col overflow-hidden relative"
      data-testid={`product-card-${product._id}`}
    >
      {/* Top Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
        <span
          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs ${
            product.condition === 'NEW'
              ? 'bg-blue-600 text-white'
              : product.condition === 'RECONDITIONED'
              ? 'bg-amber-500 text-white'
              : 'bg-slate-700 text-white'
          }`}
        >
          {product.condition}
        </span>

        {fitmentBadge && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs flex items-center gap-1 ${
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
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md shadow-xs transition duration-150 ${
            isWishlisted
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'bg-white/90 text-slate-400 hover:text-rose-600 hover:bg-white'
          }`}
          title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
          aria-label="Toggle Wishlist"
        >
          <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
      )}

      {/* Thumbnail Image */}
      <Link
        to={`/products/${product._id}`}
        className="block relative aspect-video bg-slate-100 overflow-hidden"
      >
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80';
          }}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-white text-xs font-bold uppercase tracking-wider px-3 py-1 bg-rose-600 rounded-lg shadow-md">
              Out of Stock
            </span>
          </div>
        )}
      </Link>

      {/* Content Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span className="font-bold text-blue-700 uppercase tracking-wider text-[11px]">
              {brandName}
            </span>
            <span className="text-[11px] font-mono text-slate-400">SKU: {product.sku}</span>
          </div>

          <Link to={`/products/${product._id}`} className="block group-hover:text-blue-600 transition">
            <h3 className="font-bold text-sm text-slate-900 line-clamp-2 leading-snug mb-2">
              {product.name}
            </h3>
          </Link>

          {/* Rating Summary */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <div className="flex items-center text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="ml-1 text-slate-800">
                {product.averageRating > 0 ? product.averageRating.toFixed(1) : 'New'}
              </span>
            </div>
            {product.reviewCount > 0 && (
              <span className="text-slate-400 text-[11px]">({product.reviewCount} reviews)</span>
            )}
            {product.isUniversalFit && (
              <span className="ml-auto text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md">
                Universal
              </span>
            )}
          </div>

          {/* Low Stock Indicator */}
          {isLowStock && (
            <div className="text-[11px] text-amber-700 font-semibold mt-2 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Only {product.stock} units left in merchant stock</span>
            </div>
          )}
        </div>

        {/* Pricing & CTA */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Price
            </div>
            <div className="text-base sm:text-lg font-black text-slate-900">
              {formatLKR(product.priceInCents)}
            </div>
          </div>

          {onAddToCart && (
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => onAddToCart(product)}
              className={`p-2.5 rounded-xl transition-all duration-150 flex items-center justify-center ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-sm shadow-blue-500/20'
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
