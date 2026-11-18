import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Store,
  ChevronRight,
  Loader2,
  AlertCircle,
  ShoppingBag,
} from 'lucide-react';
import {
  orderApi,
  MasterOrderSummary,
  Pagination,
} from '../api/ordersDeliveryApi.js';
import { MasterOrderStatusBadge } from '../components/MasterOrderStatusBadge.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<MasterOrderSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOrders = async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await orderApi.getCustomerOrders({ page, limit: 10 });
      if (response.success && response.data) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to retrieve your order history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1);
  }, []);

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Purchases & Orders</h1>
          <p className="text-xs text-slate-500">
            Track multi-vendor spare parts orders, merchant suborders, and bank transfer receipts
          </p>
        </div>
        <Link
          to="/products"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Shop More Parts</span>
        </Link>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3" data-testid="orders-loading">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500">Loading your purchase records...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-4 shadow-sm" data-testid="orders-empty">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-base font-bold text-slate-900 mb-1">No Orders Found</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              You have not placed any spare parts purchases yet. Browse AutoDock's catalogue of verified merchant parts.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <span>Explore Parts Catalogue</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4" data-testid="orders-list">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-blue-300 transition space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-slate-900">
                      {order.orderNumber}
                    </span>
                    <MasterOrderStatusBadge status={order.overallStatus} />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Store className="w-3.5 h-3.5" />
                      {order.suborderIds?.length || 1} Merchant Suborders
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 block">Total Payable</span>
                    <span className="text-base font-black text-slate-900">
                      {formatLKR(order.finalPayableAmountInCents)}
                    </span>
                  </div>
                  <Link
                    to={`/orders/${order._id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition"
                  >
                    <span>View Order</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Shipping Snapshot */}
              <div className="text-xs text-slate-600 flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                <span>
                  Delivering to: <strong className="text-slate-800">{order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.city}, {order.shippingAddress?.district} District)
                </span>
                <span className="text-slate-400 text-[11px]">
                  Phone: {order.shippingAddress?.phone}
                </span>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchOrders(pagination.page - 1)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchOrders(pagination.page + 1)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
