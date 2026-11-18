import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Store,
  ChevronLeft,
  Loader2,
  AlertCircle,
  Clock,
  User,
} from 'lucide-react';
import {
  adminOrderApi,
  MasterOrderDetail,
  SuborderDetail,
} from '../../api/ordersDeliveryApi.js';
import { MasterOrderStatusBadge } from '../../components/MasterOrderStatusBadge.js';
import { SuborderStatusBadge } from '../../components/SuborderStatusBadge.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<MasterOrderDetail | null>(null);
  const [suborders, setSuborders] = useState<SuborderDetail[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchOrder = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const response = await adminOrderApi.getAdminOrderById(id);
        if (response.success && response.data) {
          setOrder(response.data.order);
          setSuborders(response.data.suborders);
        }
      } catch (err: any) {
        setErrorMessage(err?.message || 'Failed to retrieve administrative order record.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  if (isLoading) {
    return (
      <div className="py-24 text-center space-y-3" data-testid="admin-order-detail-loading">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
        <p className="text-xs text-slate-500">Loading master order audit trail...</p>
      </div>
    );
  }

  if (errorMessage || !order) {
    return (
      <div className="max-w-md mx-auto my-16 bg-white p-8 rounded-2xl border border-slate-200 text-center shadow-sm space-y-4">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Order Not Found</h2>
        <p className="text-xs text-slate-600 leading-relaxed">{errorMessage}</p>
        <Link
          to="/admin/orders"
          className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          Return to Orders Oversight
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Back Link & Header */}
      <div className="space-y-3 pb-4 border-b border-slate-200">
        <Link
          to="/admin/orders"
          className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to Marketplace Orders</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight font-mono">
                {order.orderNumber}
              </h1>
              <MasterOrderStatusBadge status={order.overallStatus} />
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>Created {new Date(order.createdAt).toLocaleString()}</span>
              <span>•</span>
              <span>Customer ID: {order.customerId}</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block font-normal">Total Order Value</span>
            <span className="text-2xl font-black text-slate-900">
              {formatLKR(order.finalPayableAmountInCents)}
            </span>
          </div>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer & Destination */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
            <User className="w-4 h-4 text-blue-600" />
            <span>Customer & Delivery Details</span>
          </div>
          <div className="space-y-1 text-slate-600">
            <p className="font-semibold text-slate-900">{order.shippingAddress?.fullName}</p>
            <p>{order.shippingAddress?.street}</p>
            <p>
              {order.shippingAddress?.city}, {order.shippingAddress?.district} District (
              {order.shippingAddress?.postalCode})
            </p>
            <p className="pt-1 text-slate-500">Phone: {order.shippingAddress?.phone}</p>
            {order.customerNotes && (
              <p className="text-[11px] text-slate-500 italic">
                Notes: &ldquo;{order.customerNotes}&rdquo;
              </p>
            )}
          </div>
        </div>

        {/* Financial Accounting */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-900 pb-2 border-b border-slate-100">
            <Package className="w-4 h-4 text-blue-600" />
            <span>Platform Financial Audit</span>
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
              <span>Final Grand Total</span>
              <span className="text-sm font-black text-blue-600">
                {formatLKR(order.finalPayableAmountInCents)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Constituent Suborders List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Store className="w-4 h-4 text-blue-600" />
          <span>Constituent Seller Suborders ({suborders.length})</span>
        </h2>

        {suborders.map((sub) => (
          <div
            key={sub._id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-slate-900">{sub.suborderNumber}</span>
                <SuborderStatusBadge fulfillmentStatus={sub.fulfillmentStatus} type="fulfillment" />
                <SuborderStatusBadge paymentStatus={sub.paymentStatus} type="payment" />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">Suborder Total</span>
                <span className="font-bold text-slate-900">{formatLKR(sub.totalAmountInCents)}</span>
              </div>
            </div>

            <div className="text-slate-500 text-[11px] flex items-center gap-4">
              <span>Seller Store ID: <strong className="text-slate-700">{sub.sellerId}</strong></span>
              <span>Method: <strong className="text-slate-700">{sub.paymentMethod}</strong></span>
              <span>Commission Base: <strong className="text-blue-600 font-mono">{formatLKR(sub.commissionableBaseInCents)}</strong></span>
            </div>

            {/* Line items */}
            <div className="divide-y divide-slate-100 pt-1">
              {sub.items.map((item) => (
                <div key={item.productId} className="py-2 flex justify-between">
                  <span>
                    <strong>{item.quantity}x</strong> {item.name}{' '}
                    <span className="text-slate-400 font-mono text-[10px]">({item.sku})</span>
                  </span>
                  <span className="font-semibold text-slate-900">{formatLKR(item.lineTotalInCents)}</span>
                </div>
              ))}
            </div>

            {/* Tracking if dispatched */}
            {sub.courierDetails?.trackingNumber && (
              <div className="p-2.5 bg-cyan-50/50 rounded-lg text-cyan-900 flex items-center justify-between text-[11px]">
                <span>
                  Courier: <strong>{sub.courierDetails.courierName}</strong>
                </span>
                <span className="font-mono">Tracking: <strong>{sub.courierDetails.trackingNumber}</strong></span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Status History Audit Log */}
      {order.statusHistory && order.statusHistory.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3 text-xs">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Clock className="w-4 h-4 text-blue-600" />
            <span>Master Order Lifecycle History</span>
          </h3>
          <div className="space-y-2">
            {order.statusHistory.map((hist, i) => (
              <div key={i} className="flex items-center justify-between text-slate-600 text-[11px]">
                <span className="font-bold text-slate-800">{hist.status}</span>
                <span>{new Date(hist.changedAt).toLocaleString()}</span>
                {hist.reason && <span className="text-slate-400">({hist.reason})</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
