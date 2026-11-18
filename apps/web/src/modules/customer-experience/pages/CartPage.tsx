import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Store,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Truck,
  Loader2,
  PackageOpen,
} from 'lucide-react';
import {
  CartData,
  CartItem,
  CartSellerGroup,
  cartApi,
} from '../api/customerExperienceApi.js';
import { formatLKR } from '../utils/formatters.js';
import { useAuth } from '../../identity/context/AuthContext.js';

export const CartPage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  const [cart, setCart] = useState<CartData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState<boolean>(false);

  const fetchCart = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await cartApi.get();
      if (response.success && response.data) {
        setCart(response.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to retrieve shopping cart.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    fetchCart();
  }, [isAuthenticated]);

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating(itemId);
    setErrorMessage(null);
    try {
      const response = await cartApi.updateQuantity(itemId, newQuantity);
      if (response.success && response.data) {
        setCart(response.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update item quantity.');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setIsUpdating(itemId);
    setErrorMessage(null);
    try {
      const response = await cartApi.removeItem(itemId);
      if (response.success && response.data) {
        setCart(response.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to remove item from cart.');
    } finally {
      setIsUpdating(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <ShoppingCart className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Sign in to Access Your Cart</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          Log in with your customer account to view your multi-vendor spare parts cart and save items across sessions.
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
        <p className="text-xs font-medium">Loading your shopping cart...</p>
      </div>
    );
  }

  // Calculate seller groups if not computed by backend
  const sellerGroups: CartSellerGroup[] =
    cart?.sellerGroups && cart.sellerGroups.some((g) => g.items && g.items.length > 0)
      ? cart.sellerGroups
      : (cart?.items
      ? Object.values(
          cart.items.reduce((acc, item) => {
            const sId = item.sellerId || 'general';
            if (!acc[sId]) {
              acc[sId] = {
                sellerId: sId,
                storeName: (item.productId as any)?.storeName || 'Verified AutoDock Merchant',
                items: [],
                subtotalInCents: 0,
              };
            }
            acc[sId].items.push(item);
            acc[sId].subtotalInCents +=
              (item.priceInCentsAtAdd || (item.productId as any)?.priceInCents || 0) * item.quantity;
            return acc;
          }, {} as Record<string, CartSellerGroup>)
        )
      : []);

  const totalItemsCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const grandTotalInCents =
    cart?.totalInCents || sellerGroups.reduce((sum, g) => sum + g.subtotalInCents, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Shopping Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {totalItemsCount} {totalItemsCount === 1 ? 'spare part' : 'spare parts'} across{' '}
            {sellerGroups.length} merchant {sellerGroups.length === 1 ? 'store' : 'stores'}
          </p>
        </div>
        <Link to="/products" className="text-xs font-bold text-blue-600 hover:underline">
          Continue Shopping →
        </Link>
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {cart && cart.items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Multi-Vendor Cart Item Groups */}
          <div className="lg:col-span-8 space-y-6">
            {sellerGroups.map((group) => (
              <div
                key={group.sellerId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                {/* Seller Group Header */}
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-xs text-slate-900">
                      Merchant Store: {group.storeName || 'Verified Merchant'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-500">
                    Subtotal: <strong className="text-slate-900">{formatLKR(group.subtotalInCents)}</strong>
                  </span>
                </div>

                {/* Items in this Seller Group */}
                <div className="divide-y divide-slate-100 p-5 space-y-4">
                  {group.items.map((item: CartItem) => {
                    const product = item.productId;
                    const itemPrice = item.priceInCentsAtAdd || product.priceInCents || 0;
                    const lineTotal = itemPrice * item.quantity;
                    const isItemUpdating = isUpdating === item._id;

                    const thumbUrl =
                      product.images?.find((img) => img.isPrimary)?.url ||
                      product.images?.[0]?.url ||
                      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=200&q=80';

                    return (
                      <div
                        key={item._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-4 first:pt-0"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <img
                            src={thumbUrl}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-xl border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono text-slate-400 block">
                              SKU: {product.sku}
                            </span>
                            <Link
                              to={`/products/${product._id}`}
                              className="font-bold text-xs text-slate-900 hover:text-blue-600 transition truncate block"
                            >
                              {product.name}
                            </Link>
                            <span className="text-xs font-semibold text-slate-700">
                              {formatLKR(itemPrice)}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Stepper & Subtotal */}
                        <div className="flex items-center gap-4 self-end sm:self-auto">
                          <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                            <button
                              type="button"
                              disabled={item.quantity <= 1 || isItemUpdating}
                              onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="w-8 text-center text-xs font-bold text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isItemUpdating}
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                              className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition font-bold text-xs"
                            >
                              +
                            </button>
                          </div>

                          <div className="text-right min-w-[80px]">
                            <div className="text-xs font-black text-slate-900">{formatLKR(lineTotal)}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item._id)}
                            disabled={isItemUpdating}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Remove item"
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

          {/* Right Column: Order Summary Card & Checkout Transition */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-slate-900 uppercase tracking-wider pb-3 border-b border-slate-100">
                Order Summary
              </h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Catalogue Subtotal</span>
                  <span className="font-semibold text-slate-900">{formatLKR(grandTotalInCents)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Merchant Stores</span>
                  <span className="font-semibold text-slate-900">{sellerGroups.length} Vendors</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Estimated Delivery</span>
                  <span className="text-blue-600 font-medium">Calculated per seller</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block">Total Cart Value</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatLKR(grandTotalInCents)}
                  </span>
                </div>
              </div>

              {/* Notice that prices are revalidated at checkout */}
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/70 text-[11px] text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
                  <span>Price & Stock Protection</span>
                </div>
                <p>
                  Prices and merchant stock availability are authoritative and revalidated dynamically during checkout handoff.
                </p>
              </div>

              {/* Checkout Handoff Button */}
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(true)}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-800">
                <Truck className="w-4 h-4 text-blue-600" />
                <span>Multi-Seller Order Architecture</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                When purchasing from multiple sellers, AutoDock creates independent seller suborders so you can track dispatch, courier fees, and direct bank transfers per merchant store.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <PackageOpen className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="font-bold text-slate-900 text-base mb-1">Your Shopping Cart is Empty</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Find guaranteed matching parts for your car make, model, and year with transparent pricing.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Browse Spare Parts Catalogue</span>
          </Link>
        </div>
      )}

      {/* Checkout Transition Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setCheckoutModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 z-10 text-center">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              Module 03 Checkout Boundary Handoff
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Cart verification complete ({totalItemsCount} items, {formatLKR(grandTotalInCents)}). Delivery fee calculation, COD / Bank transfer selection, and seller suborders creation will unlock upon integration of <strong>Module 03 (Orders, Payments & Delivery)</strong>.
            </p>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-600 text-left">
              Handoff Contract: ProductModulePublicService.getCartForCheckout()
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCheckoutModalOpen(false)}
                className="w-1/2 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl"
              >
                Back to Cart
              </button>
              <Link
                to="/checkout"
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 shadow-sm"
              >
                <span>Continue to Checkout</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
