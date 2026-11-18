import React from 'react';
import { MasterOrderRollupStatus } from '../api/ordersDeliveryApi.js';

interface MasterOrderStatusBadgeProps {
  status: MasterOrderRollupStatus;
}

export const MasterOrderStatusBadge: React.FC<MasterOrderStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-300">
          Pending Payment
        </span>
      );
    case 'AWAITING_FULFILLMENT':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-900 border border-blue-300">
          Awaiting Fulfillment
        </span>
      );
    case 'IN_PROGRESS':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-900 border border-indigo-300">
          In Progress
        </span>
      );
    case 'COMPLETED':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
          Completed
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-900 border border-rose-300">
          Cancelled
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
          {status}
        </span>
      );
  }
};
