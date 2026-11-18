import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Truck,
  FileSearch,
  CheckCircle,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react';
import {
  sellerOrderApi,
  SuborderDetail,
  SuborderFulfillmentStatus,
} from '../../api/ordersDeliveryApi.js';
import { SuborderStatusBadge } from '../../components/SuborderStatusBadge.js';
import { ReceiptReviewModal } from '../../components/ReceiptReviewModal.js';
import { CourierDispatchModal } from '../../components/CourierDispatchModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const SellerSuborderDetailPage: React.FC = () => {
  const { suborderId } = useParams<{ suborderId: string }>();

  const [suborder, setSuborder] = useState<SuborderDetail[] | SuborderDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const fetchSuborder = async () => {
    if (!suborderId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await sellerOrderApi.getSellerSuborderById(suborderId);
      if (response.success && response.data) {
        setSuborder(response.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to retrieve suborder record.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuborder();
  }, [suborderId]);

  const currentSub = suborder as SuborderDetail | null;

  const handleStatusTransition = async (newStatus: SuborderFulfillmentStatus) => {
    if (!suborderId) return;
    setIsUpdating(true);
    try {
      const response = await sellerOrderApi.updateFulfillmentStatus(suborderId, {
        fulfillmentStatus: newStatus,
      });
      if (response.success) {
        fetchSuborder();
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3" data-testid="seller-suborder-loading">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-slate-500">Loading suborder details...</p>
      </div>
    );
  }

  if (errorMessage || !currentSub) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Suborder Unavailable</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{errorMessage}</p>
        <Link
          to="/seller/orders"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Return to Seller Workstation
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Header & Back Link */}
      <div className="space-y-3 pb-4 border-b border-slate-200">
        <Link
          to="/seller/orders"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Store Suborders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {currentSub.suborderNumber}
              </h1>
              <SuborderStatusBadge fulfillmentStatus={currentSub.fulfillmentStatus} type="fulfillment" />
              <SuborderStatusBadge paymentStatus={currentSub.paymentStatus} type="payment" />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Received on {new Date(currentSub.createdAt).toLocaleDateString()}</span>
              <span>•</span>
              <span>Destination: {currentSub.deliveryDistrict} District</span>
              <span>•</span>
              <span>Method: <strong>{currentSub.paymentMethod}</strong></span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-normal">Suborder Total</span>
            <span className="text-2xl font-black text-slate-900">
              {formatLKR(currentSub.totalAmountInCents)}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Financial & Fulfillment Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fulfillment Control Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Truck className="w-4 h-4 text-blue-600" />
            <span>Fulfillment Lifecycle Actions</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {currentSub.fulfillmentStatus === 'AWAITING_FULFILLMENT' && (
              <button
                type="button"
                onClick={() => handleStatusTransition('PROCESSING')}
                disabled={isUpdating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-sm"
              >
                Mark as Processing
              </button>
            )}

            {currentSub.fulfillmentStatus === 'PROCESSING' && (
              <button
                type="button"
                onClick={() => handleStatusTransition('READY_FOR_DISPATCH')}
                disabled={isUpdating}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-sm"
              >
                Mark Ready for Dispatch
              </button>
            )}

            {currentSub.fulfillmentStatus === 'READY_FOR_DISPATCH' && (
              <button
                type="button"
                onClick={() => setIsDispatchModalOpen(true)}
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <Truck className="w-4 h-4" />
                <span>Dispatch Package with Courier Details</span>
              </button>
            )}

            {currentSub.fulfillmentStatus === 'DISPATCHED' && (
              <button
                type="button"
                onClick={() => handleStatusTransition('DELIVERED')}
                disabled={isUpdating}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Confirm Delivery Receipt</span>
              </button>
            )}

            {['DELIVERED', 'CANCELLED'].includes(currentSub.fulfillmentStatus) && (
              <span className="text-slate-500 italic">
                Suborder lifecycle is in terminal state ({currentSub.fulfillmentStatus}).
              </span>
            )}
          </div>
        </div>

        {/* Financial Snapshot */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Package className="w-4 h-4 text-blue-600" />
            <span>Suborder Financial Account</span>
          </div>

          <div className="space-y-1.5 text-slate-600">
            <div className="flex justify-between">
              <span>Product Line Subtotal</span>
              <span className="font-semibold text-slate-900">
                {formatLKR(currentSub.productSubtotalInCents)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>District Delivery Charge</span>
              <span className="font-semibold text-slate-900">
                {formatLKR(currentSub.deliveryFeeInCents)}
              </span>
            </div>
            <div className="flex justify-between text-blue-600">
              <span>Commissionable Base (excl. delivery)</span>
              <span className="font-semibold font-mono">
                {formatLKR(currentSub.commissionableBaseInCents)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-slate-900">
              <span>Total Suborder Payable</span>
              <span className="text-sm font-black text-blue-600">
                {formatLKR(currentSub.totalAmountInCents)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Line Items Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
          Ordered Inventory Line Items
        </h2>

        <div className="divide-y divide-slate-100">
          {currentSub.items.map((item) => (
            <div key={item.productId} className="py-3 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {item.thumbnailUrl ? (
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="w-10 h-10 object-cover rounded-lg border border-slate-200"
                  />
                ) : (
                  <div className="w-10 h-10 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">
                    <Package className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-900 block">{item.name}</span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    SKU: {item.sku} • Qty: {item.quantity} × {formatLKR(item.unitPriceInCents)}
                  </span>
                </div>
              </div>
              <span className="font-bold text-slate-900">{formatLKR(item.lineTotalInCents)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Courier Dispatch Details (if exists) */}
      {currentSub.courierDetails?.trackingNumber && (
        <div className="bg-cyan-50/50 border border-cyan-200/60 rounded-2xl p-5 shadow-sm space-y-2 text-xs">
          <div className="font-bold text-cyan-900 flex items-center gap-1.5 pb-2 border-b border-cyan-200/50">
            <Truck className="w-4 h-4 text-cyan-700" />
            <span>Active Courier Consignment Details</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-cyan-800">
            <div>
              <span className="text-cyan-600 block text-[11px]">Courier Partner</span>
              <span className="font-semibold">{currentSub.courierDetails.courierName}</span>
            </div>
            <div>
              <span className="text-cyan-600 block text-[11px]">Waybill Tracking #</span>
              <span className="font-mono font-bold text-slate-900">
                {currentSub.courierDetails.trackingNumber}
              </span>
            </div>
            {currentSub.courierDetails.estimatedDeliveryDate && (
              <div>
                <span className="text-cyan-600 block text-[11px]">Estimated Delivery</span>
                <span>
                  {new Date(currentSub.courierDetails.estimatedDeliveryDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bank Receipt Review Drawer Trigger */}
      {currentSub.paymentMethod === 'DIRECT_BANK_TRANSFER' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-slate-900">
              <Building2 className="w-4 h-4 text-blue-600" />
              <span>Direct Bank Deposit Receipt Record</span>
            </div>
            <p className="text-slate-500">
              Review customer uploaded deposit slip and verify into merchant account.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsReceiptModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
          >
            <FileSearch className="w-4 h-4" />
            <span>Inspect & Verify Slip</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <ReceiptReviewModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        suborderId={currentSub._id}
        suborderNumber={currentSub.suborderNumber}
        onDecisionComplete={() => fetchSuborder()}
      />

      <CourierDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        suborderId={currentSub._id}
        suborderNumber={currentSub.suborderNumber}
        onDispatchSuccess={() => fetchSuborder()}
      />
    </div>
  );
};
