import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  MapPin,
  Store,
  CreditCard,
  Building2,
  Upload,
  Truck,
  XCircle,
} from 'lucide-react';
import {
  orderApi,
  MasterOrderDetail,
  SuborderDetail,
  BankTransferInstructions,
} from '../api/ordersDeliveryApi.js';
import { MasterOrderStatusBadge } from '../components/MasterOrderStatusBadge.js';
import { SuborderStatusBadge } from '../components/SuborderStatusBadge.js';
import { BankInstructionsModal } from '../components/BankInstructionsModal.js';
import { ReceiptUploadDrawer } from '../components/ReceiptUploadDrawer.js';
import { CardSandboxModal } from '../components/CardSandboxModal.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  PageHeader,
} from '../../../shared/components/index.js';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<MasterOrderDetail | null>(null);
  const [suborders, setSuborders] = useState<SuborderDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [bankInstructions, setBankInstructions] =
    useState<BankTransferInstructions | null>(null);
  const [bankModalSuborder, setBankModalSuborder] =
    useState<SuborderDetail | null>(null);
  const [uploadSuborder, setUploadSuborder] = useState<SuborderDetail | null>(null);
  const [cardSuborder, setCardSuborder] = useState<SuborderDetail | null>(null);

  const loadOrder = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await orderApi.getOrderById(id);
      if (response.success && response.data) {
        setOrder(response.data.order);
        setSuborders(response.data.suborders || []);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load order details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [id]);

  const handleOpenBankInstructions = async (sub: SuborderDetail) => {
    try {
      const res = await orderApi.getBankInstructions(sub._id);
      if (res.success && res.data) {
        setBankInstructions(res.data);
        setBankModalSuborder(sub);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load bank instructions.');
    }
  };

  const handleCancelSuborder = async (subId: string) => {
    const reason = window.prompt('Please specify a reason for cancelling this package:');
    if (!reason || reason.trim().length < 3) return;
    try {
      await orderApi.cancelSuborder(subId, reason.trim());
      await loadOrder();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to cancel shipment.');
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="h-80 bg-white border border-slate-200 rounded-lg" />
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Alert variant="danger">{errorMessage || 'Order not found.'}</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title={<span className="font-mono">{order.orderNumber}</span>}
        subtitle={`Placed on ${new Date(order.createdAt).toLocaleString()}`}
        backTo="/orders"
        backLabel="Back to My Orders"
        badge={<MasterOrderStatusBadge status={order.overallStatus} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Seller Suborders */}
        <div className="lg:col-span-8 space-y-5">
          {suborders.map((sub) => {
            const isBankPending =
              sub.paymentMethod === 'DIRECT_BANK_TRANSFER' &&
              sub.paymentStatus === 'PENDING';
            const isCardPending =
              sub.paymentMethod === 'CARD' && sub.paymentStatus === 'PENDING';
            const canCancel =
              sub.fulfillmentStatus === 'PENDING_PAYMENT' ||
              sub.fulfillmentStatus === 'AWAITING_FULFILLMENT';

            return (
              <section
                key={sub._id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-slate-500" />
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {sub.suborderNumber}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <SuborderStatusBadge
                      type="fulfillment"
                      fulfillmentStatus={sub.fulfillmentStatus}
                    />
                    <SuborderStatusBadge
                      type="payment"
                      paymentStatus={sub.paymentStatus}
                    />
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  {sub.items.map((item) => (
                    <div
                      key={item.productId}
                      className="px-5 py-3.5 flex items-center justify-between gap-4 text-sm"
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-slate-900">{item.name}</div>
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

                {sub.courierDetails && (
                  <div className="px-5 py-3 bg-red-50/60 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700">
                    <span className="inline-flex items-center gap-1.5 font-medium">
                      <Truck className="w-4 h-4 text-[#E11D30]" />
                      <span>Dispatched via {sub.courierDetails.courierName}</span>
                    </span>
                    <span className="font-mono font-semibold">
                      Tracking: {sub.courierDetails.trackingNumber}
                    </span>
                  </div>
                )}

                <div className="px-5 py-4 bg-slate-50/60 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm">
                    <span className="text-slate-500">Package Total: </span>
                    <span className="font-bold text-slate-900 tabular-nums">
                      {formatLKR(sub.totalAmountInCents)}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      ({sub.paymentMethod.replace(/_/g, ' ')})
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isBankPending && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Building2 className="w-3.5 h-3.5" />}
                          onClick={() => handleOpenBankInstructions(sub)}
                        >
                          Bank Details
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<Upload className="w-3.5 h-3.5" />}
                          onClick={() => setUploadSuborder(sub)}
                        >
                          Upload Deposit Slip
                        </Button>
                      </>
                    )}

                    {isCardPending && (
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<CreditCard className="w-3.5 h-3.5" />}
                        onClick={() => setCardSuborder(sub)}
                      >
                        Pay by Card
                      </Button>
                    )}

                    {canCancel && (
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        onClick={() => handleCancelSuborder(sub._id)}
                      >
                        Cancel Package
                      </Button>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* Right: Shipping & Financial Totals */}
        <div className="lg:col-span-4 space-y-5">
          <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2.5">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>Delivery Address</span>
            </h2>
            <div className="text-sm text-slate-700 space-y-0.5">
              <p className="font-semibold text-slate-900">
                {order.shippingAddress.fullName}
              </p>
              <p>{order.shippingAddress.street}</p>
              <p>
                {order.shippingAddress.city}, {order.shippingAddress.district}{' '}
                {order.shippingAddress.postalCode}
              </p>
              <p className="text-xs text-slate-500 pt-1">
                Phone: {order.shippingAddress.phone}
              </p>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2.5">
              Payment Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Parts Total</span>
                <span className="tabular-nums">
                  {formatLKR(order.totalProductAmountInCents)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Fees</span>
                <span className="tabular-nums">
                  {formatLKR(order.totalDeliveryFeeInCents)}
                </span>
              </div>
              {order.totalDiscountInCents > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discounts</span>
                  <span className="tabular-nums">
                    -{formatLKR(order.totalDiscountInCents)}
                  </span>
                </div>
              )}
              <div className="pt-2.5 border-t border-slate-200 flex justify-between font-bold text-slate-900 text-base">
                <span>Total Paid / Payable</span>
                <span className="tabular-nums">
                  {formatLKR(order.finalPayableAmountInCents)}
                </span>
              </div>
            </div>
          </section>
        </div>
      </div>

      <BankInstructionsModal
        isOpen={Boolean(bankModalSuborder)}
        onClose={() => setBankModalSuborder(null)}
        instructions={bankInstructions}
        onUploadReceiptClick={() => {
          if (bankModalSuborder) setUploadSuborder(bankModalSuborder);
        }}
      />

      {uploadSuborder && (
        <ReceiptUploadDrawer
          isOpen={Boolean(uploadSuborder)}
          onClose={() => setUploadSuborder(null)}
          suborderId={uploadSuborder._id}
          suborderNumber={uploadSuborder.suborderNumber}
          amountDueInCents={uploadSuborder.totalAmountInCents}
          onUploadSuccess={loadOrder}
        />
      )}

      {cardSuborder && (
        <CardSandboxModal
          isOpen={Boolean(cardSuborder)}
          onClose={() => setCardSuborder(null)}
          suborderId={cardSuborder._id}
          suborderNumber={cardSuborder.suborderNumber}
          onPaymentSimulated={loadOrder}
        />
      )}
    </div>
  );
};
