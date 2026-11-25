import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronRight, ShoppingBag } from 'lucide-react';
import { orderApi, MasterOrderSummary } from '../api/ordersDeliveryApi.js';
import { MasterOrderStatusBadge } from '../components/MasterOrderStatusBadge.js';
import { formatLKR } from '../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  EmptyState,
  PageHeader,
} from '../../../shared/components/index.js';

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<MasterOrderSummary[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = async (p: number) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await orderApi.getCustomerOrders({ page: p, limit: 10 });
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load your order history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(page);
  }, [page]);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <PageHeader
        title="My Orders"
        subtitle="Track shipments, upload bank deposit slips, and view invoices across your purchases"
        actions={
          <Link to="/products">
            <Button variant="outline" size="sm">
              Browse Parts Catalog
            </Button>
          </Link>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, idx) => (
            <div key={idx} className="h-28 bg-white border border-slate-200 rounded-lg" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="w-6 h-6" />}
          title="No orders placed yet"
          description="Once you order spare parts, each merchant shipment and payment receipt can be tracked here."
          action={
            <Link to="/products">
              <Button variant="primary">Shop Spare Parts</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const subCount =
              order.subordersCount ?? order.suborderIds?.length ?? 1;
            return (
              <div
                key={order._id}
                className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        {order.orderNumber}
                      </span>
                      <MasterOrderStatusBadge status={order.overallStatus} />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>
                        Placed {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                      <span>&middot;</span>
                      <span className="inline-flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        <span>
                          {subCount} Merchant {subCount === 1 ? 'Suborder' : 'Suborders'}
                        </span>
                      </span>
                      <span>&middot;</span>
                      <span>Ship to {order.shippingAddress?.district}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-left sm:text-right">
                      <span className="text-xs text-slate-500 block">Order Total</span>
                      <span className="text-base font-bold text-slate-900 tabular-nums">
                        {formatLKR(order.finalPayableAmountInCents)}
                      </span>
                    </div>
                    <Link to={`/orders/${order._id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        rightIcon={<ChevronRight className="w-3.5 h-3.5" />}
                      >
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-slate-600 px-3 py-1.5">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
