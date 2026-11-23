import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ShoppingBag,
  ShieldCheck,
  CreditCard,
  Building2,
  DollarSign,
  AlertCircle,
  ArrowRight,
  Loader2,
  PackageCheck,
  Store,
  ChevronRight,
  Info,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import {
  checkoutApi,
  CheckoutQuoteData,
  PaymentMethod,
  SRI_LANKAN_DISTRICTS,
  ShippingAddress,
} from '../api/ordersDeliveryApi.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';
import { useAuth } from '../../identity/context/AuthContext.js';

export const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Shipping Address State
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    fullName: user ? `${user.firstName} ${user.lastName}` : '',
    phone: user?.phone || '',
    street: '',
    city: '',
    district: 'Colombo',
    postalCode: '',
  });

  // Quote State
  const [quote, setQuote] = useState<CheckoutQuoteData | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState<boolean>(true);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  // Per-Seller Payment Method Selection
  const [sellerPaymentMethods, setSellerPaymentMethods] = useState<Record<string, PaymentMethod>>({});
  const [customerNotes, setCustomerNotes] = useState<string>('');

  // Order Placement State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Request Quote from Backend
  const fetchQuote = async (addressToUse: ShippingAddress) => {
    setIsQuoteLoading(true);
    setQuoteError(null);
    try {
      const response = await checkoutApi.getQuote({
        shippingAddress: {
          street: addressToUse.street || 'Default Street',
          city: addressToUse.city || 'Default City',
          district: addressToUse.district,
          postalCode: addressToUse.postalCode || '00100',
          phone: addressToUse.phone || '0771234567',
        },
      });

      if (response.success && response.data) {
        setQuote(response.data);

        // Initialize default payment methods to COD if not set
        const defaultMethods: Record<string, PaymentMethod> = {};
        response.data.sellerSuborders.forEach((sub) => {
          defaultMethods[sub.sellerId] = sellerPaymentMethods[sub.sellerId] || 'COD';
        });
        setSellerPaymentMethods(defaultMethods);
      }
    } catch (err: any) {
      setQuoteError(err?.message || 'Failed to calculate checkout quote. Please check cart.');
    } finally {
      setIsQuoteLoading(false);
    }
  };

  useEffect(() => {
    fetchQuote(shippingAddress);
  }, []);

  const handleDistrictChange = (district: string) => {
    const updated = { ...shippingAddress, district };
    setShippingAddress(updated);
    fetchQuote(updated);
  };

  const handlePaymentMethodChange = (sellerId: string, method: PaymentMethod) => {
    setSellerPaymentMethods((prev) => ({
      ...prev,
      [sellerId]: method,
    }));
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quote || quote.sellerSuborders.length === 0) {
      setSubmitError('Cannot place order: Cart is empty or quote is unavailable.');
      return;
    }

    if (
      !shippingAddress.fullName.trim() ||
      !shippingAddress.phone.trim() ||
      !shippingAddress.street.trim() ||
      !shippingAddress.city.trim() ||
      !shippingAddress.postalCode.trim()
    ) {
      setSubmitError('Please complete all required shipping address fields.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const methodsPayload = quote.sellerSuborders.map((sub) => ({
      sellerId: sub.sellerId,
      paymentMethod: sellerPaymentMethods[sub.sellerId] || 'COD',
    }));

    try {
      const response = await checkoutApi.placeOrder({
        shippingAddress,
        sellerPaymentMethods: methodsPayload,
        customerNotes: customerNotes.trim() || undefined,
        idempotencyKey: `idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      });

      if (response.success && response.data?.order?._id) {
        navigate(`/orders/${response.data.order._id}`, {
          state: { orderPlaced: true },
        });
      }
    } catch (err: any) {
      setSubmitError(
        err?.message || 'Failed to place order. A product price or stock change may have occurred.'
      );
      // Refresh quote to synchronize with latest inventory/pricing
      fetchQuote(shippingAddress);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isQuoteLoading && !quote) {
    return (
      <div className="py-24 text-center space-y-3" data-testid="checkout-loading">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">Calculating Multi-Vendor Checkout Quote...</h2>
        <p className="text-xs text-slate-500">
          Revalidating prices, available merchant inventory, and delivery fees...
        </p>
      </div>
    );
  }

  if (quoteError && (!quote || quote.sellerSuborders.length === 0)) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Checkout Unavailable</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{quoteError}</p>
        <Link
          to="/cart"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Return to Shopping Cart
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link to="/cart" className="hover:text-blue-600 transition">
          Cart
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-semibold text-slate-900">Checkout & Payment</span>
      </nav>

      {/* Checkout Progress Stepper */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="flex items-center justify-center gap-2 text-blue-600 font-bold border-r border-slate-100">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">1</span>
            <span className="hidden sm:inline">Delivery Address</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-blue-600 font-bold border-r border-slate-100">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">2</span>
            <span className="hidden sm:inline">Merchant Suborders</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-blue-600 font-bold">
            <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center">3</span>
            <span className="hidden sm:inline">Payment & Review</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Checkout & Order Confirmation
          </h1>
          <p className="text-xs text-slate-500">
            Authoritative multi-vendor quote partitioned across verified merchant stores
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 font-semibold self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Authoritative Backend Quote</span>
        </div>
      </div>

      {submitError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-xs text-rose-800">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Checkout Request Rejected</span>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Shipping Address & Merchant Suborders */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <MapPin className="w-5 h-5 text-blue-600" />
              <h2 className="text-sm font-bold text-slate-900">1. Delivery Address & District</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Recipient Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={shippingAddress.fullName}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, fullName: e.target.value })
                  }
                  required
                  placeholder="e.g. Kasun Perera"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Contact Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                  required
                  placeholder="e.g. 077 123 4567"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Street Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={shippingAddress.street}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, street: e.target.value })
                  }
                  required
                  placeholder="e.g. No. 45, Temple Road"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  City / Town <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, city: e.target.value })
                  }
                  required
                  placeholder="e.g. Nugegoda"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Administrative District <span className="text-rose-500">*</span>
                </label>
                <select
                  value={shippingAddress.district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold text-blue-700 bg-blue-50/50"
                >
                  {SRI_LANKAN_DISTRICTS.map((dist) => (
                    <option key={dist} value={dist}>
                      {dist} District
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Postal Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={shippingAddress.postalCode}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, postalCode: e.target.value })
                  }
                  required
                  placeholder="e.g. 10250"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Delivery Notes (Optional)
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Deliver between 9 AM - 2 PM or leave with security"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Seller Suborders Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                <span>
                  2. Review Seller Suborders ({quote?.sellerSuborders.length || 0} Merchant Stores)
                </span>
              </h2>
              <span className="text-xs text-slate-500">
                Independent payment & fulfillment per seller
              </span>
            </div>

            {quote?.sellerSuborders.map((sub, idx) => (
              <div
                key={sub.sellerId}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
              >
                {/* Seller Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900">{sub.sellerName}</h3>
                      <span className="text-[10px] text-slate-400">Verified Merchant Store</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 block">District Delivery Fee</span>
                    <span className="text-xs font-bold text-slate-900">
                      {formatLKR(sub.deliveryFeeInCents)}
                    </span>
                  </div>
                </div>

                {/* Line Items */}
                <div className="divide-y divide-slate-100">
                  {sub.items.map((item) => (
                    <div key={item.productId} className="py-3 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-xl border border-slate-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center text-slate-400">
                            <ShoppingBag className="w-5 h-5" />
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-[280px]">
                            {item.name}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            PN: {item.partNumber} • Qty: {item.quantity} × {formatLKR(item.unitPriceInCents)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-extrabold text-slate-900 block">
                          {formatLKR(item.lineTotalInCents)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Seller Payment Selection */}
                <div className="pt-3 border-t border-slate-100 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-2xl space-y-2">
                  <span className="text-xs font-bold text-slate-700 block">
                    Select Payment Method for {sub.sellerName}:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {/* COD */}
                    <label
                      className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center gap-2.5 transition ${
                        sellerPaymentMethods[sub.sellerId] === 'COD'
                          ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`payment-${sub.sellerId}`}
                        value="COD"
                        checked={sellerPaymentMethods[sub.sellerId] === 'COD'}
                        onChange={() => handlePaymentMethodChange(sub.sellerId, 'COD')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <DollarSign className="w-4 h-4 text-blue-600 shrink-0" />
                      <div>
                        <div className="leading-tight">Cash on Delivery</div>
                        <span className="text-[10px] text-slate-400 font-normal">Pay driver</span>
                      </div>
                    </label>

                    {/* Direct Bank Transfer */}
                    <label
                      className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center gap-2.5 transition ${
                        sellerPaymentMethods[sub.sellerId] === 'DIRECT_BANK_TRANSFER'
                          ? 'border-blue-600 bg-blue-50/60 text-blue-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`payment-${sub.sellerId}`}
                        value="DIRECT_BANK_TRANSFER"
                        checked={sellerPaymentMethods[sub.sellerId] === 'DIRECT_BANK_TRANSFER'}
                        onChange={() =>
                          handlePaymentMethodChange(sub.sellerId, 'DIRECT_BANK_TRANSFER')
                        }
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <div>
                        <div className="leading-tight">Direct Bank Deposit</div>
                        <span className="text-[10px] text-slate-400 font-normal">Upload slip</span>
                      </div>
                    </label>

                    {/* Card Sandbox */}
                    <label
                      className={`p-3 rounded-xl border cursor-pointer text-xs flex items-center gap-2.5 transition ${
                        sellerPaymentMethods[sub.sellerId] === 'CARD'
                          ? 'border-purple-600 bg-purple-50/60 text-purple-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`payment-${sub.sellerId}`}
                        value="CARD"
                        checked={sellerPaymentMethods[sub.sellerId] === 'CARD'}
                        onChange={() => handlePaymentMethodChange(sub.sellerId, 'CARD')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <CreditCard className="w-4 h-4 text-purple-600 shrink-0" />
                      <div>
                        <div className="leading-tight">Card (Sandbox)</div>
                        <span className="text-[10px] text-slate-400 font-normal">Test simulation</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Order Summary & Place Order Action */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5 sticky top-20">
            <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <PackageCheck className="w-5 h-5 text-blue-600" />
              <span>Final Order Financial Summary</span>
            </h2>

            <div className="space-y-2.5 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>Products Catalogue Subtotal</span>
                <span className="font-semibold text-slate-900">
                  {formatLKR(quote?.totalProductAmountInCents || 0)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span>Combined Delivery Charges ({shippingAddress.district})</span>
                <span className="font-semibold text-slate-900">
                  {formatLKR(quote?.totalDeliveryFeeInCents || 0)}
                </span>
              </div>

              {quote && quote.totalDiscountInCents > 0 && (
                <div className="flex items-center justify-between text-emerald-600 font-semibold">
                  <span>Discounts Applied</span>
                  <span>-{formatLKR(quote.totalDiscountInCents)}</span>
                </div>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-normal">
                    Authoritative Total Payable
                  </span>
                  <span className="text-2xl font-black text-slate-900">
                    {formatLKR(quote?.finalPayableAmountInCents || 0)}
                  </span>
                </div>
              </div>
            </div>

            {/* Invariant disclaimer */}
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-800">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                <span>Financial Invariant Guarantee</span>
              </div>
              <p className="leading-relaxed">
                Calculated strictly in integer Sri Lankan cents. Delivery charges are segregated per merchant and excluded from commission calculation.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={isSubmitting || isQuoteLoading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Confirming Order...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Place Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400 pt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>Safe & Secure Sri Lankan Checkout</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
