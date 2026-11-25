import React from 'react';
import {
  SellerInvoiceStatus,
  ReceiptReviewStatus,
  PromotionStatus,
  ExemptionStatus,
  SubsidyStatus,
} from '../api/financePromotionsApi.js';
import { Badge } from '../../../shared/components/index.js';

export const InvoiceStatusBadge: React.FC<{ status: SellerInvoiceStatus }> = ({
  status,
}) => {
  switch (status) {
    case 'ISSUED':
      return <Badge variant="primary">Issued (Unpaid)</Badge>;
    case 'PAYMENT_PENDING_VERIFICATION':
      return <Badge variant="warning">Pending Verification</Badge>;
    case 'PARTIALLY_PAID':
      return <Badge variant="info">Partially Paid</Badge>;
    case 'PAID':
      return <Badge variant="success">Paid &amp; Settled</Badge>;
    case 'OVERDUE':
      return <Badge variant="danger">Overdue</Badge>;
    case 'CANCELLED':
      return <Badge variant="default">Cancelled</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export const ReceiptStatusBadge: React.FC<{ status: ReceiptReviewStatus }> = ({
  status,
}) => {
  switch (status) {
    case 'PENDING':
      return <Badge variant="warning">Pending Review</Badge>;
    case 'APPROVED':
      return <Badge variant="success">Approved</Badge>;
    case 'REJECTED':
      return <Badge variant="danger">Rejected</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export const PromotionStatusBadge: React.FC<{ status: PromotionStatus }> = ({
  status,
}) => {
  return status === 'ACTIVE' ? (
    <Badge variant="success">Active</Badge>
  ) : (
    <Badge variant="default">Inactive</Badge>
  );
};

export const ExemptionStatusBadge: React.FC<{ status: ExemptionStatus }> = ({
  status,
}) => {
  return status === 'ACTIVE' ? (
    <Badge variant="primary">Exempt (0%)</Badge>
  ) : (
    <Badge variant="default">Revoked</Badge>
  );
};

export const SubsidyStatusBadge: React.FC<{ status: SubsidyStatus }> = ({
  status,
}) => {
  return status === 'SETTLED' ? (
    <Badge variant="success">Settled</Badge>
  ) : (
    <Badge variant="warning">Accrued (Payable by AutoDock)</Badge>
  );
};
