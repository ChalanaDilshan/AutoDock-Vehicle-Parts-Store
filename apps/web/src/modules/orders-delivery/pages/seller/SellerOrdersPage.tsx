import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Calendar,
  Truck,
  FileSearch,
  CheckCircle,
  ChevronRight,
  Loader2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {
  sellerOrderApi,
  SuborderDetail,
  Pagination,
  SuborderFulfillmentStatus,
} from '../../api/ordersDeliveryApi.js';
import { SuborderStatusBadge } from '../../components/SuborderStatusBadge.js';
import { ReceiptReviewModal } from '../../components/ReceiptReviewModal.js';
import { CourierDispatchModal } from '../../components/CourierDispatchModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';

export const SellerOrdersPage: React.FC = () => {
  const [suborders, setSuborders] = useState<SuborderDetail[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal States
  const [activeReceiptSuborder, setActiveReceiptSuborder] = useState<SuborderDetail | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  const [activeDispatchSuborder, setActiveDispatchSuborder] = useState<SuborderDetail | null>(null);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState<boolean>(false);

  // Status Action Spinner State
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchSuborders = async (page: number = 1, status: string = statusFilter) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await sellerOrderApi.getSellerSuborders({
        page,
        limit: 10,
        fulfillmentStatus: status || undefined,
      });

      if (response.success && response.data) {
        setSuborders(response.data.suborders);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch seller suborders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuborders(1, statusFilter);
  }, [statusFilter]);

  const handleQuickStatusTransition = async (
    suborderId: string,
    newStatus: SuborderFulfillmentStatus
  ) => {
    setUpdatingId(suborderId);
    try {
      const response = await sellerOrderApi.updateFulfillmentStatus(suborderId, {
        fulfillmentStatus: newStatus,
      });
      if (response.success) {
        fetchSuborders(pagination.page, statusFilter);
      }
    } catch (err: any) {
      alert(err?.message || 'Failed to update suborder fulfillment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Seller Order Fulfillment Workstation
          </h1>
          <p className="text-xs text-slate-500">
            Manage your store's assigned suborders, review bank receipts, and dispatch consignments
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none bg-white"
          >
            <option value="">All Fulfillment Statuses</option>
            <option value="AWAITING_FULFILLMENT">Awaiting Fulfillment</option>
            <option value="PROCESSING">Processing</option>
            <option value="READY_FOR_DISPATCH">Ready for Dispatch</option>
            <option value="DISPATCHED">Dispatched</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Seller Fulfillment KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Suborders</div>
            <div className="text-lg font-black text-slate-900">{pagination.total}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Loader2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Awaiting Action</div>
            <div className="text-lg font-black text-amber-600">
              {suborders.filter((s) => s.fulfillmentStatus === 'AWAITING_FULFILLMENT').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
            <CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Processing</div>
            <div className="text-lg font-black text-indigo-600">
              {suborders.filter((s) => s.fulfillmentStatus === 'PROCESSING').length}
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dispatched</div>
            <div className="text-lg font-black text-emerald-600">
              {suborders.filter((s) => s.fulfillmentStatus === 'DISPATCHED').length}
            </div>
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
        <div className="py-20 flex flex-col items-center justify-center space-y-3" data-testid="seller-orders-loading">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-xs text-slate-500">Loading assigned store suborders...</p>
        </div>
      ) : suborders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-4 shadow-sm" data-testid="seller-orders-empty">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Package className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h2 className="text-base font-bold text-slate-900 mb-1">No Store Suborders Found</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              When customers purchase parts from your store during checkout, your store-specific suborders will appear here.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4" data-testid="seller-orders-list">
          {suborders.map((sub) => (
            <div
              key={sub._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-blue-300 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {sub.suborderNumber}
                    </span>
                    <SuborderStatusBadge fulfillmentStatus={sub.fulfillmentStatus} type="fulfillment" />
                    <SuborderStatusBadge paymentStatus={sub.paymentStatus} type="payment" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(sub.createdAt).toLocaleDateString()}
                    </span>
                    <span>•</span>
                    <span>Destination: {sub.deliveryDistrict} District</span>
                    <span>•</span>
                    <span>Payment Method: <strong>{sub.paymentMethod}</strong></span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Subtotal + Delivery</span>
                    <span className="text-base font-black text-slate-900">
                      {formatLKR(sub.totalAmountInCents)}
                    </span>
                  </div>
                  <Link
                    to={`/seller/orders/${sub._id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    <span>Detail</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-1 text-xs">
                {sub.items.map((item) => (
                  <div key={item.productId} className="flex justify-between py-1 text-slate-600">
                    <span>
                      <strong className="text-slate-800">{item.quantity}x</strong> {item.name}{' '}
                      <span className="font-mono text-[10px] text-slate-400">({item.sku})</span>
                    </span>
                    <span className="font-medium text-slate-900">
                      {formatLKR(item.lineTotalInCents)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Seller Action Toolbar */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 -mx-5 -mb-5 p-4 rounded-b-2xl">
                {/* Bank Slip Review Alert */}
                {sub.paymentMethod === 'DIRECT_BANK_TRANSFER' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveReceiptSuborder(sub);
                        setIsReceiptModalOpen(true);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                        sub.paymentStatus === 'RECEIPT_UPLOADED'
                          ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <FileSearch className="w-3.5 h-3.5" />
                      <span>
                        {sub.paymentStatus === 'RECEIPT_UPLOADED'
                          ? 'Review Pending Slip'
                          : 'View Receipt Record'}
                      </span>
                    </button>
                  </div>
                )}

                {/* Fulfillment Status Progression Buttons */}
                <div className="flex items-center gap-2 ml-auto">
                  {sub.fulfillmentStatus === 'AWAITING_FULFILLMENT' && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatusTransition(sub._id, 'PROCESSING')}
                      disabled={updatingId === sub._id}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
                    >
                      Start Processing
                    </button>
                  )}

                  {sub.fulfillmentStatus === 'PROCESSING' && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatusTransition(sub._id, 'READY_FOR_DISPATCH')}
                      disabled={updatingId === sub._id}
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition"
                    >
                      Mark Ready for Dispatch
                    </button>
                  )}

                  {sub.fulfillmentStatus === 'READY_FOR_DISPATCH' && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDispatchSuborder(sub);
                        setIsDispatchModalOpen(true);
                      }}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Dispatch Package</span>
                    </button>
                  )}

                  {sub.fulfillmentStatus === 'DISPATCHED' && (
                    <button
                      type="button"
                      onClick={() => handleQuickStatusTransition(sub._id, 'DELIVERED')}
                      disabled={updatingId === sub._id}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Confirm Delivered</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                disabled={pagination.page <= 1}
                onClick={() => fetchSuborders(pagination.page - 1, statusFilter)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => fetchSuborders(pagination.page + 1, statusFilter)}
                className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Seller Receipt Review Modal */}
      {activeReceiptSuborder && (
        <ReceiptReviewModal
          isOpen={isReceiptModalOpen}
          onClose={() => setIsReceiptModalOpen(false)}
          suborderId={activeReceiptSuborder._id}
          suborderNumber={activeReceiptSuborder.suborderNumber}
          onDecisionComplete={() => fetchSuborders(pagination.page, statusFilter)}
        />
      )}

      {/* Courier Dispatch Modal */}
      {activeDispatchSuborder && (
        <CourierDispatchModal
          isOpen={isDispatchModalOpen}
          onClose={() => setIsDispatchModalOpen(false)}
          suborderId={activeDispatchSuborder._id}
          suborderNumber={activeDispatchSuborder.suborderNumber}
          onDispatchSuccess={() => fetchSuborders(pagination.page, statusFilter)}
        />
      )}
    </div>
  );
};
