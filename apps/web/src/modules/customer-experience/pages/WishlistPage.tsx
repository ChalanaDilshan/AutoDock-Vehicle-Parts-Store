import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingCart,
  Trash2,
  PackageOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  WishlistData,
  WishlistItem,
  wishlistApi,
} from '../api/customerExperienceApi.js';
import { formatLKR } from '../utils/formatters.js';
import { useAuth } from '../../identity/context/AuthContext.js';

export const WishlistPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [wishlist, setWishlist] = useState<WishlistData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isActionPending, setIsActionPending] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchWishlist = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await wishlistApi.get();
      if (response.success && response.data) {
        setWishlist(response.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to retrieve your wishlist.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    fetchWishlist();
  }, [isAuthenticated]);

  const handleRemove = async (productId: string) => {
    setIsActionPending(productId);
    setErrorMessage(null);
    try {
      const response = await wishlistApi.removeItem(productId);
      if (response.success && response.data) {
        setWishlist(response.data);
        setSuccessMessage('Item removed from wishlist.');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to remove item from wishlist.');
    } finally {
      setIsActionPending(null);
    }
  };

  const handleMoveToCart = async (productId: string) => {
    setIsActionPending(productId);
    setErrorMessage(null);
    try {
      const response = await wishlistApi.moveToCart(productId, 1);
      if (response.success) {
        setSuccessMessage('Item moved to your shopping cart!');
        setTimeout(() => setSuccessMessage(null), 3000);
        fetchWishlist();
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to move item to cart.');
    } finally {
      setIsActionPending(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <Heart className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Sign In to View Your Wishlist</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Log in with your customer account to save spare parts, track stock changes, and move items to cart with 1 click.
        </p>
        <Link
          to="/login"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Sign In / Register
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <p className="text-xs font-medium">Loading saved wishlist items...</p>
      </div>
    );
  }

  const items: WishlistItem[] = wishlist?.items || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Saved Wishlist</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {items.length} {items.length === 1 ? 'saved spare part' : 'saved spare parts'}
          </p>
        </div>
        <Link to="/products" className="text-xs font-bold text-blue-600 hover:underline">
          Explore Catalogue →
        </Link>
      </div>

      {successMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const product = item.productId;
            if (!product) return null;

            const isPending = isActionPending === product._id;
            const isOutOfStock = product.stock <= 0 || product.status === 'OUT_OF_STOCK';

            const thumbUrl =
              product.images?.find((img) => img.isPrimary)?.url ||
              product.images?.[0]?.url ||
              'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=400&q=80';

            return (
              <div
                key={product._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div>
                  <Link
                    to={`/products/${product._id}`}
                    className="block aspect-video bg-slate-100 overflow-hidden relative"
                  >
                    <img
                      src={thumbUrl}
                      alt={product.name}
                      className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="text-[10px] font-bold text-white bg-rose-600 px-2 py-0.5 rounded">
                          Out of Stock
                        </span>
                      </div>
                    )}
                  </Link>

                  <div className="p-4 space-y-2">
                    <span className="text-[10px] font-mono text-slate-400 block">
                      SKU: {product.sku}
                    </span>
                    <Link
                      to={`/products/${product._id}`}
                      className="font-bold text-xs text-slate-900 hover:text-blue-600 transition line-clamp-2 block"
                    >
                      {product.name}
                    </Link>
                    <div className="text-base font-black text-slate-900">
                      {formatLKR(product.priceInCents)}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-100 flex items-center justify-between gap-2 mt-auto">
                  <button
                    type="button"
                    disabled={isOutOfStock || isPending}
                    onClick={() => handleMoveToCart(product._id)}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Move to Cart</span>
                  </button>

                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleRemove(product._id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="Remove from wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <PackageOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-bold text-slate-900 text-base mb-1">Your Wishlist is Empty</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bookmark replacement parts for your vehicle garage to monitor prices and purchase later.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Heart className="w-4 h-4" />
            <span>Discover Parts in Catalogue</span>
          </Link>
        </div>
      )}
    </div>
  );
};
