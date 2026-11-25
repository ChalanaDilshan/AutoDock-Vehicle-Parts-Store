import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, PackageOpen } from 'lucide-react';
import { WishlistData, wishlistApi } from '../api/customerExperienceApi.js';
import { formatLKR } from '../utils/formatters.js';
import { useAuth } from '../../identity/context/AuthContext.js';
import {
  Alert,
  Button,
  EmptyState,
  PageHeader,
} from '../../../shared/components/index.js';

export const WishlistPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [wishlist, setWishlist] = useState<WishlistData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  const loadWishlist = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await wishlistApi.get();
      if (res.success && res.data) {
        setWishlist(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load your saved wishlist.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadWishlist();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleMoveToCart = async (productId: string) => {
    setBusyProductId(productId);
    try {
      await wishlistApi.moveToCart(productId, 1);
      await loadWishlist();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to move item to cart.');
    } finally {
      setBusyProductId(null);
    }
  };

  const handleRemove = async (productId: string) => {
    setBusyProductId(productId);
    try {
      await wishlistApi.removeItem(productId);
      await loadWishlist();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to remove item from wishlist.');
    } finally {
      setBusyProductId(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          icon={<Heart className="w-6 h-6" />}
          title="Sign in to view your wishlist"
          description="Save spare parts you plan to order later."
          action={
            <Link to="/login">
              <Button variant="primary">Sign In</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const items = wishlist?.items || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title="Saved Wishlist"
        subtitle="Keep track of spare parts you want to compare or buy later"
        actions={
          <Link to="/products">
            <Button variant="outline" size="sm">
              Browse Parts Catalog
            </Button>
          </Link>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-white border border-slate-200 rounded-lg" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Heart className="w-6 h-6" />}
          title="Your wishlist is empty"
          description="Save parts while browsing so you can quickly move them to your cart later."
          action={
            <Link to="/products">
              <Button variant="primary">Explore Parts</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {items.map((item) => {
            const p = item.productId;
            const img = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;
            const busy = busyProductId === p._id;
            return (
              <div
                key={p._id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden flex flex-col"
              >
                <Link
                  to={`/products/${p._id}`}
                  className="aspect-[4/3] bg-slate-100 border-b border-slate-100 flex items-center justify-center overflow-hidden"
                >
                  {img ? (
                    <img src={img} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <PackageOpen className="w-10 h-10 text-slate-400" />
                  )}
                </Link>
                <div className="p-4 flex-1 flex flex-col gap-2">
                  <Link
                    to={`/products/${p._id}`}
                    className="text-sm font-semibold text-slate-900 hover:text-blue-700 line-clamp-2"
                  >
                    {p.name}
                  </Link>
                  <p className="text-xs text-slate-500 font-mono">SKU: {p.sku}</p>
                  <p className="text-base font-bold text-slate-900 tabular-nums mt-auto">
                    {formatLKR(p.priceInCents)}
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      disabled={busy || p.stock <= 0}
                      leftIcon={<ShoppingCart className="w-3.5 h-3.5" />}
                      onClick={() => handleMoveToCart(p._id)}
                    >
                      Move to Cart
                    </Button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleRemove(p._id)}
                      aria-label={`Remove ${p.name}`}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
