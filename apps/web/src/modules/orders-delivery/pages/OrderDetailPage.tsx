import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Truck,
  Store,
  CreditCard,
  Building2,
  ChevronLeft,
  Loader2,
  AlertCircle,
  UploadCloud,
  Ban,
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

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<MasterOrderDetail | null>(null);
  const [suborders, setSuborders] = useState<SuborderDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bank Instructions Modal State
  const [selectedBankInstructions, setSelectedBankInstructions] =
    useState<BankTransferInstructions | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState<boolean>(false);

  // Receipt Upload State
  const [activeUploadSuborder, setActiveUploadSuborder] = useState<SuborderDetail | null>(null);
  const [isUploadDrawerOpen, setIsUploadDrawerOpen] = useState<boolean>(false);

  // Card Sandbox Modal State
  const [activeCardSuborder, setActiveCardSuborder] = useState<SuborderDetail | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState<boolean>(false);

  // Cancellation State
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const fetchOrderDetail = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await orderApi.getOrderById(id);
      if (response.success && response.data) {
        setOrder(response.data.order);
        setSuborders(response.data.suborders);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to retrieve order details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const handleOpenBankInstructions = async (suborder: SuborderDetail) => {
    try {
      const response = await orderApi.getBankInstructions(suborder._id);
      if (response.success && response.data) {
        setSelectedBankInstructions(response.data);
        setIsBankModalOpen(true);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to fetch bank instructions for this seller.');
    }
  };

  const handleCancelSuborder = async (suborderId: string) => {
    const reason = prompt('Please enter a cancellation reason:');
    if (!reason || !reason.trim()) return;

    setIsCancelling(suborderId);
    try {
      const response = await orderApi.cancelSuborder(suborderId, reason.trim());
      if (response.success) {
        fetchOrderDetail();
      }
    } catch (err: any) {
      alert(err?.message || 'Unable to cancel suborder.');
    } finally {
      setIsCancelling(null);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3" data-testid="order-detail-loading">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-slate-500">Loading purchase record details...</p>
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Order Record Unavailable</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{errorMessage}</p>
        <Link
          to="/orders"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Return to My Purchases
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back Link & Header */}
      <div className="space-y-3 pb-4 border-b border-slate-200">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {order.orderNumber}
              </h1>
              <MasterOrderStatusBadge status={order.overallStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Placed on {new Date(order.createdAt).toLocaleDateString()} at{' '}
                {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span>•</span>
              <span>{suborders.length} Merchant Suborder(s)</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-normal">Final Order Amount</span>
            <span className="text-2xl font-black text-slate-900">
              {formatLKR(order.finalPayableAmountInCents)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Delivery Info & Financial Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shipping Address */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Delivery Destination</span>
          </div>
          <div className="space-y-1 text-slate-600">
            <p className="font-semibold text-slate-900">{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.street}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.district} District (
              {order.shippingAddress?.postalCode})
            </p>
            <p className="pt-1 text-slate-500">Contact: {order.shippingAddress?.phone}</p>
          </div>
        </div>

        {/* Master Financial Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Package className="w-4 h-4 text-blue-600" />
            <span>Master Financial Breakdown</span>
          </div>
          <div className="space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Products Subtotal</span>
              <span className="font-semibold text-slate-900">
                {formatLKR(order.totalProductAmountInCents)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Segregated Delivery Charges</span>
              <span className="font-semibold text-slate-900">
                {formatLKR(order.totalDeliveryFeeInCents)}
              </span>
            </div>
            {order.totalDiscountInCents > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>Discounts Applied</span>
                <span>-{formatLKR(order.totalDiscountInCents)}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
              <span>Total Payable</span>
              <span className="text-sm font-black text-blue-600">
                {formatLKR(order.finalPayableAmountInCents)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Seller Suborders Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Store className="w-4 h-4 text-blue-600" />
          <span>Independent Merchant Suborders ({suborders.length})</span>
        </h2>

        {suborders.map((sub) => (
          <div
            key={sub._id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4"
          >
            {/* Suborder Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-800">
                    {sub.suborderNumber}
                  </span>
                  <SuborderStatusBadge fulfillmentStatus={sub.fulfillmentStatus} type="fulfillment" />
                  <SuborderStatusBadge paymentStatus={sub.paymentStatus} type="payment" />
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-2">
                  <span>Merchant ID: {sub.sellerId}</span>
                  <span>•</span>
                  <span>Payment Method: <strong>{sub.paymentMethod}</strong></span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Suborder Total</span>
                  <span className="text-sm font-bold text-slate-900">
                    {formatLKR(sub.totalAmountInCents)}
                  </span>
                </div>

                {/* Cancel Action if eligible */}
                {['PENDING_PAYMENT', 'AWAITING_FULFILLMENT', 'PROCESSING'].includes(
                  sub.fulfillmentStatus
                ) && (
                  <button
                    type="button"
                    onClick={() => handleCancelSuborder(sub._id)}
                    disabled={isCancelling === sub._id}
                    className="p-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold transition"
                    title="Cancel this suborder"
                  >
                    {isCancelling === sub._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Ban className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Suborder Line Items */}
            <div className="divide-y divide-slate-100">
              {sub.items.map((item) => (
                <div key={item.productId} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.name}
                        className="w-9 h-9 object-cover rounded-lg border border-slate-200"
                      />
                    ) : (
                      <div className="w-9 h-9 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                        <Package className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <span className="font-semibold text-slate-900 block truncate max-w-[280px]">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        SKU: {item.sku} • Qty: {item.quantity} × {formatLKR(item.unitPriceInCents)}
                      </span>
                    </div>
                  </div>
                  <span className="font-bold text-slate-900">
                    {formatLKR(item.lineTotalInCents)}
                  </span>
                </div>
              ))}
            </div>

            {/* Courier Dispatch Tracking Info (if dispatched) */}
            {sub.courierDetails?.trackingNumber && (
              <div className="p-3 bg-cyan-50/60 border border-cyan-200/60 rounded-xl text-xs space-y-1">
                <div className="font-bold text-cyan-900 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Courier Consignment Dispatched</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-cyan-800">
                  <div>
                    <span className="text-cyan-600 block">Courier Partner</span>
                    <span className="font-semibold">{sub.courierDetails.courierName}</span>
                  </div>
                  <div>
                    <span className="text-cyan-600 block">Waybill / Tracking #</span>
                    <span className="font-mono font-bold">{sub.courierDetails.trackingNumber}</span>
                  </div>
                  {sub.courierDetails.estimatedDeliveryDate && (
                    <div>
                      <span className="text-cyan-600 block">Estimated Delivery</span>
                      <span>
                        {new Date(sub.courierDetails.estimatedDeliveryDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {sub.courierDetails.courierContactPhone && (
                    <div>
                      <span className="text-cyan-600 block">Courier Contact</span>
                      <span>{sub.courierDetails.courierContactPhone}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bank Transfer Interaction Section */}
            {sub.paymentMethod === 'DIRECT_BANK_TRANSFER' && (
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-2xl">
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <Building2 className="w-4 h-4 text-blue-600" />
                    <span>Direct Merchant Bank Deposit</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {sub.paymentStatus === 'PAID'
                      ? 'Payment receipt verified and approved by merchant.'
                      : sub.paymentStatus === 'RECEIPT_UPLOADED'
                      ? 'Deposit slip uploaded. Awaiting merchant verification.'
                      : 'Please deposit into merchant bank account and upload receipt.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenBankInstructions(sub)}
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition shadow-sm"
                  >
                    View Bank Details
                  </button>

                  {sub.paymentStatus !== 'PAID' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveUploadSuborder(sub);
                        setIsUploadDrawerOpen(true);
                      }}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{sub.paymentStatus === 'RECEIPT_UPLOADED' ? 'Re-upload Slip' : 'Upload Deposit Slip'}</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Card Sandbox Simulator Trigger */}
            {sub.paymentMethod === 'CARD' && sub.paymentStatus !== 'PAID' && (
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between bg-purple-50/50 -mx-5 -mb-5 p-4 rounded-b-2xl">
                <div className="space-y-0.5 text-xs text-purple-900">
                  <span className="font-bold flex items-center gap-1">
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    <span>Card Payment Gateway (Sandbox Mode)</span>
                  </span>
                  <p className="text-[11px] text-purple-700">
                    Demonstration gateway session with signed HMAC webhook simulator.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveCardSuborder(sub);
                    setIsCardModalOpen(true);
                  }}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Simulate Gateway Flow
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bank Instructions Modal */}
      <BankInstructionsModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        instructions={selectedBankInstructions}
        onUploadReceiptClick={() => {
          if (suborders.length > 0) {
            setActiveUploadSuborder(suborders[0]);
            setIsUploadDrawerOpen(true);
          }
        }}
      />

      {/* Receipt Upload Drawer */}
      {activeUploadSuborder && (
        <ReceiptUploadDrawer
          isOpen={isUploadDrawerOpen}
          onClose={() => setIsUploadDrawerOpen(false)}
          suborderId={activeUploadSuborder._id}
          suborderNumber={activeUploadSuborder.suborderNumber}
          amountDueInCents={activeUploadSuborder.totalAmountInCents}
          onUploadSuccess={() => fetchOrderDetail()}
        />
      )}

      {/* Card Sandbox Modal */}
      {activeCardSuborder && (
        <CardSandboxModal
          isOpen={isCardModalOpen}
          onClose={() => setIsCardModalOpen(false)}
          suborderId={activeCardSuborder._id}
          suborderNumber={activeCardSuborder.suborderNumber}
          onPaymentSimulated={() => fetchOrderDetail()}
        />
      )}
    </div>
  );
};
