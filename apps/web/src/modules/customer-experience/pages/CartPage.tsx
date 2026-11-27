import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Store,
  ArrowRight,
  PackageOpen,
  ShieldCheck,
  Truck,
} from 'lucide-react';
import { CartData, cartApi } from '../api/customerExperienceApi.js';
import { formatLKR } from '../utils/formatters.js';
import { useAuth } from '../../identity/context/AuthContext.js';
import {
  Alert,
  Button,
  EmptyState,
  PageHeader,
} from '../../../shared/components/index.js';

export const CartPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const loadCart = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await cartApi.get();
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load your shopping cart.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const handleUpdateQty = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    setUpdatingItemId(itemId);
    try {
      const res = await cartApi.updateQuantity(itemId, newQty);
      if (res.success && res.data) setCart(res.data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to update quantity.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setUpdatingItemId(itemId);
    try {
      const res = await cartApi.removeItem(itemId);
      if (res.success && res.data) setCart(res.data);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to remove item.');
    } finally {
      setUpdatingItemId(null);
    }
  };

  const sellerGroups =
    cart?.sellerGroups && cart.sellerGroups.length > 0
      ? cart.sellerGroups
      : cart?.items?.length
        ? [
            {
              sellerId: 'default',
              storeName: 'AutoDock Verified Store',
              items: cart.items,
              subtotalInCents: cart.totalInCents,
            },
          ]
        : [];

  const grandTotalInCents = cart?.totalInCents || 0;
  const totalItemsCount =
    cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  if (!isAuthenticated) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12">
        <EmptyState
          icon={<ShoppingCart className="w-6 h-6" />}
          title="Sign in to view your cart"
          description="Sign in to save spare parts across sessions and proceed to LKR checkout."
          action={
            <Link to="/login">
              <Button variant="primary">Sign In</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title="Shopping Cart"
        subtitle={
          totalItemsCount > 0
            ? `${totalItemsCount} ${totalItemsCount === 1 ? 'item' : 'items'} across ${sellerGroups.length} ${sellerGroups.length === 1 ? 'store' : 'stores'}`
            : 'Review items and proceed to checkout'
        }
        actions={
          <Link to="/products">
            <Button variant="outline" size="sm">
              Continue Shopping
            </Button>
          </Link>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 h-64 bg-white border border-slate-200 rounded-lg" />
          <div className="lg:col-span-4 h-64 bg-white border border-slate-200 rounded-lg" />
        </div>
      ) : sellerGroups.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Seller Groups */}
          <div className="lg:col-span-8 space-y-5">
            {sellerGroups.map((group) => (
              <div
                key={group.sellerId}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    <Store className="w-4 h-4 text-slate-500" />
                    <span>{group.storeName || 'Merchant Store'}</span>
                  </div>
                  <span className="text-xs font-medium text-slate-600 tabular-nums">
                    Store subtotal: {formatLKR(group.subtotalInCents)}
                  </span>
                </div>

                <div className="divide-y divide-slate-200">
                  {group.items.map((item) => {
                    const product = item.productId;
                    const unitPrice = product.priceInCents ?? item.priceInCentsAtAdd;
                    const primaryImage = product.images?.find((img) => img.isPrimary)?.url || product.images?.[0]?.url;

                    return (
                      <div
                        key={item._id}
                        className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-4 min-w-0">
                          <div className="w-16 h-16 rounded-md bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                            {primaryImage ? (
                              <img
                                src={primaryImage}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <PackageOpen className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <Link
                              to={`/products/${product._id}`}
                              className="text-sm font-semibold text-slate-900 hover:text-[#E11D30] block truncate"
                            >
                              {product.name}
                            </Link>
                            <p className="text-xs text-slate-500 font-mono">
                              SKU: {product.sku}
                            </p>
                            <p className="text-sm font-semibold text-slate-900 tabular-nums">
                              {formatLKR(unitPrice)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          <div className="inline-flex items-center border border-slate-300 rounded-lg bg-white">
                            <button
                              type="button"
                              disabled={updatingItemId === item._id || item.quantity <= 1}
                              onClick={() => handleUpdateQty(item._id, item.quantity - 1)}
                              aria-label="Decrease quantity"
                              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 rounded-l-lg"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-9 text-center text-sm font-semibold text-slate-900 tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={
                                updatingItemId === item._id ||
                                item.quantity >= (product.stock || 99)
                              }
                              onClick={() => handleUpdateQty(item._id, item.quantity + 1)}
                              aria-label="Increase quantity"
                              className="w-8 h-8 flex items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40 rounded-r-lg"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="text-right min-w-[96px] text-sm font-bold text-slate-900 tabular-nums">
                            {formatLKR(unitPrice * item.quantity)}
                          </div>

                          <button
                            type="button"
                            disabled={updatingItemId === item._id}
                            onClick={() => handleRemoveItem(item._id)}
                            title="Remove item"
                            aria-label={`Remove ${product.name}`}
                            className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
            <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
              <h2 className="text-sm font-semibold text-slate-900 pb-3 border-b border-slate-200">
                Order Summary
              </h2>

              <div className="space-y-2.5 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Items Subtotal</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {formatLKR(grandTotalInCents)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Merchant Stores</span>
                  <span className="font-medium text-slate-900">
                    {sellerGroups.length}{' '}
                    {sellerGroups.length === 1 ? 'Seller' : 'Sellers'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Delivery</span>
                  <span className="text-slate-600">Calculated at checkout</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-sm font-medium text-slate-600">Estimated Total</span>
                <span className="text-xl font-bold text-slate-900 tabular-nums">
                  {formatLKR(grandTotalInCents)}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#E11D30] shrink-0 mt-0.5" />
                <span>
                  Prices, discounts, and stock availability are confirmed at checkout.
                </span>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </Button>
            </div>

            <div className="p-3.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-600 flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              <span>
                Parts from different suppliers ship separately with individual tracking.
              </span>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<PackageOpen className="w-6 h-6" />}
          title="Your Shopping Cart is Empty"
          description="Browse spare parts matched to your vehicle and add them to your cart when ready."
          action={
            <Link to="/products">
              <Button variant="primary">Browse Spare Parts</Button>
            </Link>
          }
        />
      )}
    </div>
  );
};
