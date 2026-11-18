import React from 'react';
import {
  SuborderFulfillmentStatus,
  SuborderPaymentStatus,
} from '../api/ordersDeliveryApi.js';

interface SuborderStatusBadgeProps {
  fulfillmentStatus?: SuborderFulfillmentStatus;
  paymentStatus?: SuborderPaymentStatus;
  type?: 'fulfillment' | 'payment';
}

export const SuborderStatusBadge: React.FC<SuborderStatusBadgeProps> = ({
  fulfillmentStatus,
  paymentStatus,
  type = 'fulfillment',
}) => {
  if (type === 'fulfillment' && fulfillmentStatus) {
    switch (fulfillmentStatus) {
      case 'PENDING_PAYMENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Awaiting Payment
          </span>
        );
      case 'AWAITING_FULFILLMENT':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
            Awaiting Fulfillment
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
            Processing
          </span>
        );
      case 'READY_FOR_DISPATCH':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-800 border border-purple-200">
            Ready for Dispatch
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-50 text-cyan-800 border border-cyan-200">
            Dispatched (In Transit)
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Delivered
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {fulfillmentStatus}
          </span>
        );
    }
  }

  if (type === 'payment' && paymentStatus) {
    switch (paymentStatus) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            Payment Pending
          </span>
        );
      case 'RECEIPT_UPLOADED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            Slip Under Review
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
            Paid
          </span>
        );
      case 'COLLECTED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200">
            COD Cash Collected
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
            Refunded
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {paymentStatus}
          </span>
        );
    }
  }

  return null;
};
