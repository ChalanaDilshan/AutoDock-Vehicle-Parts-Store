import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Store, Truck } from 'lucide-react';
import {
  adminOrderApi,
  MasterOrderDetail,
  SuborderDetail,
} from '../../api/ordersDeliveryApi.js';
import { MasterOrderStatusBadge } from '../../components/MasterOrderStatusBadge.js';
import { SuborderStatusBadge } from '../../components/SuborderStatusBadge.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import { Alert, PageHeader } from '../../../../shared/components/index.js';

export const AdminOrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [order, setOrder] = useState<MasterOrderDetail | null>(null);
  const [suborders, setSuborders] = useState<SuborderDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);
    adminOrderApi
      .getAdminOrderById(id)
      .then((res) => {
        if (res.success && res.data) {
          setOrder(res.data.order);
          setSuborders(res.data.suborders || []);
        }
      })
      .catch((err: any) => {
        setErrorMessage(err?.message || 'Unable to inspect order.');
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return <div className="h-80 bg-white border border-slate-200 rounded-lg" />;
  }

  if (errorMessage || !order) {
    return <Alert variant="danger">{errorMessage || 'Order not found.'}</Alert>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={<span className="font-mono">{order.orderNumber}</span>}
        subtitle={`Placed on ${new Date(order.createdAt).toLocaleString()}`}
        backTo="/admin/orders"
        backLabel="Marketplace Orders"
        badge={<MasterOrderStatusBadge status={order.overallStatus} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-8 space-y-5">
          {suborders.map((sub) => (
            <section
              key={sub._id}
              className="bg-white border border-slate-200 rounded-lg overflow-hidden"
            >
              <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <Store className="w-4 h-4 text-slate-500" />
                  <span className="font-mono">{sub.suborderNumber}</span>
                </div>
                <div className="flex flex-wrap gap-2">
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

              <div className="divide-y divide-slate-200 text-sm">
                {sub.items.map((item) => (
                  <div
                    key={item.productId}
                    className="px-5 py-3 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        SKU: {item.sku} &middot; Qty: {item.quantity}
                      </div>
                    </div>
                    <div className="font-semibold text-slate-900 tabular-nums">
                      {formatLKR(item.lineTotalInCents)}
                    </div>
                  </div>
                ))}
              </div>

              {sub.courierDetails && (
                <div className="px-5 py-3 bg-red-50/50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700">
                  <span className="inline-flex items-center gap-1.5 font-medium">
                    <Truck className="w-3.5 h-3.5" />
                    <span>{sub.courierDetails.courierName}</span>
                  </span>
                  <span className="font-mono font-semibold">
                    {sub.courierDetails.trackingNumber}
                  </span>
                </div>
              )}

              <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-between text-xs text-slate-600">
                <span>
                  Seller ID: <span className="font-mono">{sub.sellerId}</span> · Method:{' '}
                  {sub.paymentMethod}
                </span>
                <span className="font-semibold text-slate-900 tabular-nums">
                  Total: {formatLKR(sub.totalAmountInCents)}
                </span>
              </div>
            </section>
          ))}
        </div>

        <div className="lg:col-span-4 space-y-5">
          <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-2.5 text-sm">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <MapPin className="w-4 h-4 text-slate-500" />
              <span>Recipient &amp; Address</span>
            </h2>
            <p className="font-semibold text-slate-900">{order.shippingAddress.fullName}</p>
            <p className="text-slate-600">{order.shippingAddress.street}</p>
            <p className="text-slate-600">
              {order.shippingAddress.city}, {order.shippingAddress.district}
            </p>
            <p className="text-xs text-slate-500">Phone: {order.shippingAddress.phone}</p>
          </section>

          <section className="bg-white border border-slate-200 rounded-lg p-5 space-y-2.5 text-sm">
            <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
              Order Financials
            </h2>
            <div className="flex justify-between text-slate-600">
              <span>Parts Total</span>
              <span className="tabular-nums">{formatLKR(order.totalProductAmountInCents)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery</span>
              <span className="tabular-nums">{formatLKR(order.totalDeliveryFeeInCents)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Grand Total</span>
              <span className="tabular-nums">{formatLKR(order.finalPayableAmountInCents)}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
