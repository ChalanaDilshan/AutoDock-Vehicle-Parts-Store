import React from 'react';
import {
  SuborderFulfillmentStatus,
  SuborderPaymentStatus,
} from '../api/ordersDeliveryApi.js';
import { Badge } from '../../../shared/components/index.js';

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
        return <Badge variant="warning">Awaiting Payment</Badge>;
      case 'AWAITING_FULFILLMENT':
        return <Badge variant="primary">Awaiting Fulfillment</Badge>;
      case 'PROCESSING':
        return <Badge variant="info">Processing</Badge>;
      case 'READY_FOR_DISPATCH':
        return <Badge variant="info">Ready to Dispatch</Badge>;
      case 'DISPATCHED':
        return <Badge variant="primary">Dispatched</Badge>;
      case 'DELIVERED':
        return <Badge variant="success">Delivered</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{fulfillmentStatus}</Badge>;
    }
  }

  if (type === 'payment' && paymentStatus) {
    switch (paymentStatus) {
      case 'PENDING':
        return <Badge variant="warning">Payment Pending</Badge>;
      case 'RECEIPT_UPLOADED':
        return <Badge variant="info">Receipt Submitted</Badge>;
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'COLLECTED':
        return <Badge variant="success">COD Collected</Badge>;
      case 'REFUNDED':
        return <Badge variant="default">Refunded</Badge>;
      default:
        return <Badge variant="default">{paymentStatus}</Badge>;
    }
  }

  return null;
};
