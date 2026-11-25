import React from 'react';
import { MasterOrderRollupStatus } from '../api/ordersDeliveryApi.js';
import { Badge } from '../../../shared/components/index.js';

interface MasterOrderStatusBadgeProps {
  status: MasterOrderRollupStatus;
}

export const MasterOrderStatusBadge: React.FC<MasterOrderStatusBadgeProps> = ({
  status,
}) => {
  switch (status) {
    case 'PENDING_PAYMENT':
      return <Badge variant="warning">Pending Payment</Badge>;
    case 'AWAITING_FULFILLMENT':
      return <Badge variant="primary">Awaiting Fulfillment</Badge>;
    case 'IN_PROGRESS':
      return <Badge variant="info">In Progress</Badge>;
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger">Cancelled</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};
