import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Search,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  adminOrderApi,
  MasterOrderSummary,
  Pagination,
} from '../../api/ordersDeliveryApi.js';
import { MasterOrderStatusBadge } from '../../components/MasterOrderStatusBadge.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<MasterOrderSummary[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchOrders = async (
    page: number = 1,
    search: string = searchTerm,
    status: string = statusFilter
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await adminOrderApi.getAdminOrders({
        page,
        limit: 10,
        search: search || undefined,
        status: status || undefined,
      });

      if (response.success && response.data) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to retrieve marketplace orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(1, searchTerm, statusFilter);
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchOrders(1, searchTerm, statusFilter);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Marketplace Orders Oversight
          </h1>
          <p className="text-xs text-slate-500">
            Platform-wide transaction surveillance across all multi-vendor customers and merchants
          </p>
        </div>

        {/* Search & Filter */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by order #..."
              className="pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_PAYMENT">Pending Payment</option>
            <option value="AWAITING_FULFILLMENT">Awaiting Fulfillment</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Filter
          </button>
        </form>
      </div>

      {/* KPI Metric Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Orders</div>
            <div className="text-xl font-black text-slate-900">{pagination.total}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Loader2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Current View Status</div>
            <div className="text-sm font-bold text-slate-800">{statusFilter || 'All Statuses'}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Records on Page</div>
            <div className="text-xl font-black text-slate-900">{orders.length}</div>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-xs text-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3" data-testid="admin-orders-loading">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500">Loading marketplace orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-4 shadow-sm" data-testid="admin-orders-empty">
          <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-base font-bold text-slate-900 mb-1">No Orders Found</h2>
          <p className="text-xs text-slate-500">
            No marketplace purchases match the current search or status filter.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" data-testid="admin-orders-table">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Order Reference</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">District</th>
                <th className="py-3 px-4">Suborders</th>
                <th className="py-3 px-4">Total Payable</th>
                <th className="py-3 px-4">Rollup Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((ord) => (
                <tr key={ord._id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">
                    {ord.orderNumber}
                  </td>
                  <td className="py-3 px-4 text-slate-700">
                    <span className="font-semibold block">{ord.shippingAddress?.fullName}</span>
                    <span className="text-[10px] text-slate-400">{ord.shippingAddress?.phone}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {ord.shippingAddress?.district}
                  </td>
                  <td className="py-3 px-4 text-slate-600 font-semibold">
                    {ord.suborderIds?.length || 1} Vendors
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900">
                    {formatLKR(ord.finalPayableAmountInCents)}
                  </td>
                  <td className="py-3 px-4">
                    <MasterOrderStatusBadge status={ord.overallStatus} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      to={`/admin/orders/${ord._id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                    >
                      <span>Inspect</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
              <span className="text-xs text-slate-500">
                Showing {orders.length} of {pagination.total} orders
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={pagination.page <= 1}
                  onClick={() => fetchOrders(pagination.page - 1)}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-xs font-semibold disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-600 font-medium">
                  Page {pagination.page} / {pagination.totalPages}
                </span>
                <button
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => fetchOrders(pagination.page + 1)}
                  className="px-3 py-1 border border-slate-300 rounded-lg text-xs font-semibold disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
