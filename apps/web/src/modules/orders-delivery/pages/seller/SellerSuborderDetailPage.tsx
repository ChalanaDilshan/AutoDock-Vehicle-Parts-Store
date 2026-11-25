import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FileCheck, Truck, CheckCircle2 } from 'lucide-react';
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
  PageHeader,
} from '../../../../shared/components/index.js';

export const SellerSuborderDetailPage: React.FC = () => {
  const { suborderId } = useParams<{ suborderId: string }>();

  const [suborder, setSuborder] = useState<SuborderDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);

  const loadDetail = async () => {
    if (!suborderId) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const response = await sellerOrderApi.getSellerSuborderById(suborderId);
      if (response.success && response.data) {
        setSuborder(response.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load order details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [suborderId]);

  const handleStatusUpdate = async (status: SuborderFulfillmentStatus) => {
    if (!suborderId) return;
    setIsUpdating(true);
    setErrorMessage(null);
    try {
      await sellerOrderApi.updateFulfillmentStatus(suborderId, {
        fulfillmentStatus: status,
      });
      await loadDetail();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to update status.');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="h-72 bg-white border border-slate-200 rounded-lg" />
      </div>
    );
  }

  if (errorMessage || !suborder) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-10">
        <Alert variant="danger">{errorMessage || 'Suborder not found.'}</Alert>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title={<span className="font-mono">{suborder.suborderNumber}</span>}
        subtitle={`Delivery District: ${suborder.deliveryDistrict} · Payment: ${suborder.paymentMethod.replace(/_/g, ' ')}`}
        backTo="/seller/orders"
        backLabel="Back to Merchant Orders"
        badge={
          <div className="flex flex-wrap gap-2">
            <SuborderStatusBadge
              type="fulfillment"
              fulfillmentStatus={suborder.fulfillmentStatus}
            />
            <SuborderStatusBadge
              type="payment"
              paymentStatus={suborder.paymentStatus}
            />
          </div>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            {suborder.paymentStatus === 'RECEIPT_UPLOADED' && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<FileCheck className="w-4 h-4" />}
                onClick={() => setIsReceiptModalOpen(true)}
              >
                Verify Deposit Slip
              </Button>
            )}
            {suborder.fulfillmentStatus === 'AWAITING_FULFILLMENT' && (
              <Button
                variant="primary"
                size="sm"
                isLoading={isUpdating}
                onClick={() => handleStatusUpdate('PROCESSING')}
              >
                Start Processing
              </Button>
            )}
            {(suborder.fulfillmentStatus === 'PROCESSING' ||
              suborder.fulfillmentStatus === 'READY_FOR_DISPATCH') && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Truck className="w-4 h-4" />}
                onClick={() => setIsDispatchModalOpen(true)}
              >
                Dispatch Package
              </Button>
            )}
            {suborder.fulfillmentStatus === 'DISPATCHED' && (
              <Button
                variant="primary"
                size="sm"
                isLoading={isUpdating}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
                onClick={() => handleStatusUpdate('DELIVERED')}
              >
                Mark Delivered
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-900">Ordered Parts</h2>
          </div>
          <div className="divide-y divide-slate-200">
            {suborder.items.map((item) => (
              <div
                key={item.productId}
                className="p-4 flex items-center justify-between gap-4 text-sm"
              >
                <div>
                  <div className="font-medium text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-500 font-mono">
                    SKU: {item.sku} &middot; Unit: {formatLKR(item.unitPriceInCents)} ×{' '}
                    {item.quantity}
                  </div>
                </div>
                <div className="font-semibold text-slate-900 tabular-nums">
                  {formatLKR(item.lineTotalInCents)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="lg:col-span-4 bg-white border border-slate-200 rounded-lg p-5 space-y-3 h-fit">
          <h2 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2.5">
            Financial Summary
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Parts Subtotal</span>
              <span className="tabular-nums">
                {formatLKR(suborder.productSubtotalInCents)}
              </span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee</span>
              <span className="tabular-nums">
                {formatLKR(suborder.deliveryFeeInCents)}
              </span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-slate-900">
              <span>Order Total</span>
              <span className="tabular-nums">
                {formatLKR(suborder.totalAmountInCents)}
              </span>
            </div>
          </div>

          {suborder.courierDetails && (
            <div className="pt-3 border-t border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-900">Courier Tracking</div>
              <div className="text-slate-600">
                {suborder.courierDetails.courierName}
              </div>
              <div className="font-mono font-semibold text-slate-900">
                {suborder.courierDetails.trackingNumber}
              </div>
            </div>
          )}
        </section>
      </div>

      <ReceiptReviewModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        suborderId={suborder._id}
        suborderNumber={suborder.suborderNumber}
        onDecisionComplete={loadDetail}
      />

      <CourierDispatchModal
        isOpen={isDispatchModalOpen}
        onClose={() => setIsDispatchModalOpen(false)}
        suborderId={suborder._id}
        suborderNumber={suborder.suborderNumber}
        onDispatchSuccess={loadDetail}
      />
    </div>
  );
};
