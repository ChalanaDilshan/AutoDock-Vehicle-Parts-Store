import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, ShoppingCart } from 'lucide-react';
import {
  adminOrderApi,
  MasterOrderSummary,
} from '../../api/ordersDeliveryApi.js';
import { MasterOrderStatusBadge } from '../../components/MasterOrderStatusBadge.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/index.js';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<MasterOrderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadOrders = async (p = page, status = statusFilter, search = searchQuery) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await adminOrderApi.getAdminOrders({
        page: p,
        limit: 15,
        status: status || undefined,
        search: search || undefined,
      });
      if (response.success && response.data) {
        setOrders(response.data.orders || []);
        setTotal(response.data.pagination?.total ?? response.data.orders?.length ?? 0);
        setTotalPages(response.data.pagination?.totalPages ?? 1);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load marketplace orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(page, statusFilter, searchQuery);
  }, [page, statusFilter, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearchQuery(searchInput.trim());
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Marketplace Orders"
        subtitle={`Inspect customer orders, suborder fulfillment splits, and payment statuses (${total} total)`}
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <div className="bg-white border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search order # or customer..."
              className="w-full h-9 pl-9 pr-3 rounded-lg border border-slate-300 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex flex-wrap gap-1.5">
          {[
            { value: '', label: 'All' },
            { value: 'PENDING_PAYMENT', label: 'Pending Payment' },
            { value: 'AWAITING_FULFILLMENT', label: 'Awaiting Fulfillment' },
            { value: 'IN_PROGRESS', label: 'In Progress' },
            { value: 'COMPLETED', label: 'Completed' },
            { value: 'CANCELLED', label: 'Cancelled' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setPage(1);
                setStatusFilter(tab.value);
              }}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                statusFilter === tab.value
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : orders.length === 0 ? (
        <EmptyState
          icon={<ShoppingCart className="w-6 h-6" />}
          title="No marketplace orders found"
          description="Customer orders matching your filter criteria will appear here."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Order Number</th>
                  <th className="py-3 px-4">Customer / District</th>
                  <th className="py-3 px-4">Suborders</th>
                  <th className="py-3 px-4">Total (LKR)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/60">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-semibold text-slate-900">
                        {order.orderNumber}
                      </div>
                      <div className="text-xs text-slate-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">
                        {order.shippingAddress?.fullName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {order.shippingAddress?.district}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      {order.subordersCount ?? order.suborderIds?.length ?? 1} seller packages
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 tabular-nums">
                      {formatLKR(order.finalPayableAmountInCents)}
                    </td>
                    <td className="py-3.5 px-4">
                      <MasterOrderStatusBadge status={order.overallStatus} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link to={`/admin/orders/${order._id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Inspect
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>
                Page {page} of {totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
