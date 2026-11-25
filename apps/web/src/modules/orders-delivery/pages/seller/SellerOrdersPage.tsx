import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, FileCheck, Eye } from 'lucide-react';
import {
  sellerOrderApi,
  SuborderDetail,
  SuborderFulfillmentStatus,
} from '../../api/ordersDeliveryApi.js';
import { SuborderStatusBadge } from '../../components/SuborderStatusBadge.js';
import { ReceiptReviewModal } from '../../components/ReceiptReviewModal.js';
import { CourierDispatchModal } from '../../components/CourierDispatchModal.js';
import { formatLKR } from '../../../customer-experience/utils/formatters.js';
import {
  Alert,
  Button,
  EmptyState,
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerOrdersPage: React.FC = () => {
  const [suborders, setSuborders] = useState<SuborderDetail[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [receiptModalSub, setReceiptModalSub] = useState<SuborderDetail | null>(null);
  const [dispatchModalSub, setDispatchModalSub] = useState<SuborderDetail | null>(null);

  const loadSuborders = async (p = page, status = statusFilter) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await sellerOrderApi.getSellerSuborders({
        page: p,
        limit: 10,
        fulfillmentStatus: status || undefined,
      });
      if (response.success && response.data) {
        setSuborders(response.data.suborders || []);
        setTotalPages(response.data.pagination?.totalPages || 1);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load store orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSuborders(page, statusFilter);
  }, [page, statusFilter]);

  const handleAdvanceStatus = async (
    suborderId: string,
    nextStatus: SuborderFulfillmentStatus
  ) => {
    setUpdatingId(suborderId);
    setErrorMessage(null);
    try {
      await sellerOrderApi.updateFulfillmentStatus(suborderId, {
        fulfillmentStatus: nextStatus,
      });
      await loadSuborders();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to update fulfillment status.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Merchant Orders & Fulfillment"
        subtitle="Verify bank transfer receipts, prepare spare parts, and record courier tracking"
        backTo="/seller/dashboard"
        backLabel="Seller Portal"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap gap-2">
        {[
          { value: '', label: 'All Orders' },
          { value: 'PENDING_PAYMENT', label: 'Awaiting Payment' },
          { value: 'AWAITING_FULFILLMENT', label: 'Awaiting Fulfillment' },
          { value: 'PROCESSING', label: 'Processing' },
          { value: 'READY_FOR_DISPATCH', label: 'Ready to Dispatch' },
          { value: 'DISPATCHED', label: 'Dispatched' },
          { value: 'DELIVERED', label: 'Delivered' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => {
              setPage(1);
              setStatusFilter(tab.value);
            }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : suborders.length === 0 ? (
        <EmptyState
          icon={<Package className="w-6 h-6" />}
          title="No merchant orders found"
          description="Incoming customer orders assigned to your store will appear here."
        />
      ) : (
        <div className="space-y-4">
          {suborders.map((sub) => (
            <div
              key={sub._id}
              className="bg-white border border-slate-200 rounded-lg p-5 space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-sm font-semibold text-slate-900">
                      {sub.suborderNumber}
                    </span>
                    <SuborderStatusBadge
                      type="fulfillment"
                      fulfillmentStatus={sub.fulfillmentStatus}
                    />
                    <SuborderStatusBadge
                      type="payment"
                      paymentStatus={sub.paymentStatus}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    District: {sub.deliveryDistrict} &middot; Method:{' '}
                    {sub.paymentMethod.replace(/_/g, ' ')} &middot;{' '}
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-xs text-slate-500 block">Receivable</span>
                  <span className="text-base font-bold text-slate-900 tabular-nums">
                    {formatLKR(sub.totalAmountInCents)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-sm">
                {sub.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between text-slate-700"
                  >
                    <span>
                      {item.name} <span className="text-slate-400">× {item.quantity}</span>
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatLKR(item.lineTotalInCents)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
                <Link to={`/seller/orders/${sub._id}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Eye className="w-3.5 h-3.5" />}
                  >
                    Order Details
                  </Button>
                </Link>

                <div className="flex flex-wrap items-center gap-2">
                  {sub.paymentStatus === 'RECEIPT_UPLOADED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<FileCheck className="w-3.5 h-3.5" />}
                      onClick={() => setReceiptModalSub(sub)}
                    >
                      Verify Deposit Slip
                    </Button>
                  )}

                  {sub.fulfillmentStatus === 'AWAITING_FULFILLMENT' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={updatingId === sub._id}
                      onClick={() => handleAdvanceStatus(sub._id, 'PROCESSING')}
                    >
                      Start Processing
                    </Button>
                  )}

                  {sub.fulfillmentStatus === 'PROCESSING' && (
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={updatingId === sub._id}
                      onClick={() =>
                        handleAdvanceStatus(sub._id, 'READY_FOR_DISPATCH')
                      }
                    >
                      Mark Ready for Dispatch
                    </Button>
                  )}

                  {(sub.fulfillmentStatus === 'PROCESSING' ||
                    sub.fulfillmentStatus === 'READY_FOR_DISPATCH') && (
                    <Button
                      variant="primary"
                      size="sm"
                      leftIcon={<Truck className="w-3.5 h-3.5" />}
                      onClick={() => setDispatchModalSub(sub)}
                    >
                      Dispatch Package
                    </Button>
                  )}

                  {sub.fulfillmentStatus === 'DISPATCHED' && (
                    <Button
                      variant="primary"
                      size="sm"
                      isLoading={updatingId === sub._id}
                      onClick={() => handleAdvanceStatus(sub._id, 'DELIVERED')}
                    >
                      Confirm Delivery
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}

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

      {receiptModalSub && (
        <ReceiptReviewModal
          isOpen={Boolean(receiptModalSub)}
          onClose={() => setReceiptModalSub(null)}
          suborderId={receiptModalSub._id}
          suborderNumber={receiptModalSub.suborderNumber}
          onDecisionComplete={() => loadSuborders()}
        />
      )}

      {dispatchModalSub && (
        <CourierDispatchModal
          isOpen={Boolean(dispatchModalSub)}
          onClose={() => setDispatchModalSub(null)}
          suborderId={dispatchModalSub._id}
          suborderNumber={dispatchModalSub.suborderNumber}
          onDispatchSuccess={() => loadSuborders()}
        />
      )}
    </div>
  );
};
