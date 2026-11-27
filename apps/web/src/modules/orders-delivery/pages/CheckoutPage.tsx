import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Store, Truck, ShieldCheck, ArrowLeft, CheckCircle2 } from 'lucide-react';
import {
  checkoutApi,
  CheckoutQuoteData,
  PaymentMethod,
  SRI_LANKAN_DISTRICTS,
  ShippingAddress,
} from '../api/ordersDeliveryApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';
import { useAuth } from '../../identity/context/AuthContext.js';
import {
  Alert,
  Button,
  Input,
  PageHeader,
  Select,
} from '../../../shared/components/index.js';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Customer',
    phone: user?.phone || '',
    street: '',
    city: '',
    district: 'Colombo',
    postalCode: '',
  });
  const [customerNotes, setCustomerNotes] = useState('');
  const [sellerPaymentMethods, setSellerPaymentMethods] = useState<
    Record<string, PaymentMethod>
  >({});

  const [quote, setQuote] = useState<CheckoutQuoteData | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  const fetchQuote = async (districtOverride?: string) => {
    setIsLoadingQuote(true);
    setQuoteError(null);
    try {
      const response = await checkoutApi.getQuote({
        shippingAddress: {
          street: shippingAddress.street || 'Pending Address',
          city: shippingAddress.city || 'Colombo',
          district: districtOverride || shippingAddress.district || 'Colombo',
          postalCode: shippingAddress.postalCode || '00100',
          phone: shippingAddress.phone || '0770000000',
        },
      });
      if (response.success && response.data) {
        setQuote(response.data);
        setSellerPaymentMethods((prev) => {
          const next = { ...prev };
          response.data.sellerSuborders.forEach((sub) => {
            if (!next[sub.sellerId]) next[sub.sellerId] = 'COD';
          });
          return next;
        });
      }
    } catch (err: any) {
      setQuoteError(err?.message || 'Unable to calculate delivery quote for your cart.');
    } finally {
      setIsLoadingQuote(false);
    }
  };

  useEffect(() => {
    fetchQuote(shippingAddress.district);
  }, [shippingAddress.district]);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setOrderError(null);

    if (
      !shippingAddress.fullName.trim() ||
      !shippingAddress.phone.trim() ||
      !shippingAddress.street.trim() ||
      !shippingAddress.city.trim() ||
      !shippingAddress.district.trim()
    ) {
      setOrderError('Please complete all required delivery address fields.');
      return;
    }

    if (!quote || quote.sellerSuborders.length === 0) {
      setOrderError('Your cart is empty or quote is unavailable.');
      return;
    }

    setIsPlacingOrder(true);
    try {
      const methodsPayload = quote.sellerSuborders.map((sub) => ({
        sellerId: sub.sellerId,
        paymentMethod: sellerPaymentMethods[sub.sellerId] || 'COD',
      }));

      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      const response = await checkoutApi.placeOrder({
        shippingAddress: {
          fullName: shippingAddress.fullName.trim(),
          phone: shippingAddress.phone.trim(),
          street: shippingAddress.street.trim(),
          city: shippingAddress.city.trim(),
          district: shippingAddress.district,
          postalCode: shippingAddress.postalCode.trim() || '00100',
        },
        sellerPaymentMethods: methodsPayload,
        customerNotes: customerNotes.trim() || undefined,
        idempotencyKey,
      });

      if (response.success && response.data?.order?._id) {
        navigate(`/orders/${response.data.order._id}`, { replace: true });
      }
    } catch (err: any) {
      setOrderError(err?.message || 'Unable to place order. Please review your details.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title="Checkout"
        subtitle="Confirm your Sri Lanka delivery address and choose payment methods per seller"
        backTo="/cart"
        backLabel="Back to Cart"
      />

      {quoteError && <Alert variant="danger">{quoteError}</Alert>}
      {orderError && <Alert variant="danger">{orderError}</Alert>}

      <form
        onSubmit={handlePlaceOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start"
      >
        {/* Left: Delivery Details + Seller Shipments */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white border border-slate-200 rounded-lg p-5 sm:p-6 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3">
              Delivery Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Recipient Full Name"
                required
                value={shippingAddress.fullName}
                onChange={(e) =>
                  setShippingAddress((p) => ({ ...p, fullName: e.target.value }))
                }
              />
              <Input
                label="Contact Phone"
                type="tel"
                required
                value={shippingAddress.phone}
                onChange={(e) =>
                  setShippingAddress((p) => ({ ...p, phone: e.target.value }))
                }
                placeholder="0771234567"
              />
            </div>

            <Input
              label="Street Address"
              required
              value={shippingAddress.street}
              onChange={(e) =>
                setShippingAddress((p) => ({ ...p, street: e.target.value }))
              }
              placeholder="e.g. No. 45, Temple Road"
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="City / Suburb"
                required
                value={shippingAddress.city}
                onChange={(e) =>
                  setShippingAddress((p) => ({ ...p, city: e.target.value }))
                }
                placeholder="e.g. Nugegoda"
              />
              <Select
                label="Delivery District"
                required
                value={shippingAddress.district}
                onChange={(e) =>
                  setShippingAddress((p) => ({ ...p, district: e.target.value }))
                }
                options={SRI_LANKAN_DISTRICTS.map((d) => ({ value: d, label: d }))}
              />
              <Input
                label="Postal Code"
                value={shippingAddress.postalCode}
                onChange={(e) =>
                  setShippingAddress((p) => ({ ...p, postalCode: e.target.value }))
                }
                placeholder="e.g. 10250"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Delivery Instructions (Optional)
              </label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Gate code, preferred delivery hours, or landmark notes"
                className="w-full rounded-lg border border-slate-300 p-2.5 text-sm text-slate-900 focus:border-[#E11D30] focus:outline-none"
              />
            </div>
          </section>

          {/* Per-Seller Shipment Breakdown */}
          {isLoadingQuote ? (
            <div className="h-56 bg-white border border-slate-200 rounded-lg" />
          ) : quote?.sellerSuborders?.length ? (
            <div className="space-y-4">
              {quote.sellerSuborders.map((sub) => {
                const selectedMethod = sellerPaymentMethods[sub.sellerId] || 'COD';
                return (
                  <section
                    key={sub.sellerId}
                    className="bg-white border border-slate-200 rounded-lg overflow-hidden"
                  >
                    <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                        <Store className="w-4 h-4 text-slate-500" />
                        <span>{sub.sellerName}</span>
                      </div>
                      <span className="text-xs text-slate-600">
                        Delivery to {quote.shippingDistrict}:{' '}
                        <strong className="text-slate-900 tabular-nums">
                          {formatLKR(sub.deliveryFeeInCents)}
                        </strong>
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {sub.items.map((item) => (
                        <div
                          key={item.productId}
                          className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm"
                        >
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900">
                              {item.name}
                            </div>
                            <div className="text-xs text-slate-500 font-mono">
                              SKU: {item.sku} &middot; Qty: {item.quantity}
                            </div>
                          </div>
                          <div className="font-semibold text-slate-900 tabular-nums shrink-0">
                            {formatLKR(item.lineTotalInCents)}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="px-5 py-4 bg-slate-50/60 border-t border-slate-200 space-y-2.5">
                      <p className="text-xs font-semibold text-slate-700">
                        Payment Method for {sub.sellerName}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          { value: 'COD' as PaymentMethod, label: 'Cash on Delivery' },
                          {
                            value: 'DIRECT_BANK_TRANSFER' as PaymentMethod,
                            label: 'Direct Bank Transfer',
                          },
                          { value: 'CARD' as PaymentMethod, label: 'Card Payment' },
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() =>
                              setSellerPaymentMethods((p) => ({
                                ...p,
                                [sub.sellerId]: opt.value,
                              }))
                            }
                            className={`px-3 py-2 rounded-lg border text-xs font-medium text-left transition-colors ${
                              selectedMethod === opt.value
                                ? 'border-[#E11D30] bg-red-50 text-[#BE123C]'
                                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <Alert variant="warning">
              No items found in cart.{' '}
              <Link to="/products" className="font-semibold underline">
                Browse parts catalog
              </Link>
            </Alert>
          )}
        </div>

        {/* Right: Final Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-24">
          <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
            <h2 className="text-base font-semibold text-slate-900 pb-3 border-b border-slate-200">
              Final Order Financial Summary
            </h2>

            {quote ? (
              <>
                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between text-slate-600">
                    <span>Parts Subtotal</span>
                    <span className="font-medium text-slate-900 tabular-nums">
                      {formatLKR(quote.totalProductAmountInCents)}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Total Delivery</span>
                    <span className="font-medium text-slate-900 tabular-nums">
                      {formatLKR(quote.totalDeliveryFeeInCents)}
                    </span>
                  </div>
                  {quote.totalDiscountInCents > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Discounts</span>
                      <span className="font-medium tabular-nums">
                        -{formatLKR(quote.totalDiscountInCents)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Total Payable</span>
                  <span className="text-xl font-bold text-slate-900 tabular-nums">
                    {formatLKR(quote.finalPayableAmountInCents)}
                  </span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isPlacingOrder}
                  leftIcon={<CheckCircle2 className="w-4 h-4" />}
                >
                  Confirm &amp; Place Order
                </Button>

                <div className="pt-2 border-t border-slate-100 space-y-2 text-xs text-slate-500">
                  <div className="flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>All seller prices and delivery rates are verified before confirmation.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Truck className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Track each seller package individually from My Orders.</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-500 flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Calculating order totals...</span>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
