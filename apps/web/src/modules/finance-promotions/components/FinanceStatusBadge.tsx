import React from 'react';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ShieldAlert,
  FileCheck,
  Tag,
} from 'lucide-react';
import {
  SellerInvoiceStatus,
  ReceiptReviewStatus,
  PromotionStatus,
  ExemptionStatus,
  SubsidyStatus,
} from '../api/financePromotionsApi.js';

interface InvoiceStatusBadgeProps {
  status: SellerInvoiceStatus;
}

export const InvoiceStatusBadge: React.FC<InvoiceStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ISSUED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3" />
          <span>Issued (Unpaid)</span>
        </span>
      );
    case 'PAYMENT_PENDING_VERIFICATION':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
          <AlertCircle className="w-3 h-3 text-amber-600" />
          <span>Verification Pending</span>
        </span>
      );
    case 'PARTIALLY_PAID':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          <FileCheck className="w-3 h-3 text-indigo-600" />
          <span>Partially Paid</span>
        </span>
      );
    case 'PAID':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Settled / Paid</span>
        </span>
      );
    case 'OVERDUE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
          <ShieldAlert className="w-3 h-3 text-rose-600" />
          <span>Overdue</span>
        </span>
      );
    case 'CANCELLED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
          <XCircle className="w-3 h-3" />
          <span>Cancelled</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          {status}
        </span>
      );
  }
};

interface ReceiptStatusBadgeProps {
  status: ReceiptReviewStatus;
}

export const ReceiptStatusBadge: React.FC<ReceiptStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'PENDING':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          <span>Awaiting Review</span>
        </span>
      );
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Approved & Credited</span>
        </span>
      );
    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle className="w-3 h-3 text-rose-600" />
          <span>Rejected</span>
        </span>
      );
    default:
      return <span className="text-xs text-slate-600">{status}</span>;
  }
};

interface PromotionStatusBadgeProps {
  status: PromotionStatus;
}

export const PromotionStatusBadge: React.FC<PromotionStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Tag className="w-3 h-3 text-emerald-600" />
          <span>Active</span>
        </span>
      );
    case 'INACTIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
          <XCircle className="w-3 h-3 text-slate-400" />
          <span>Inactive / Paused</span>
        </span>
      );
    default:
      return <span className="text-xs text-slate-600">{status}</span>;
  }
};

interface ExemptionStatusBadgeProps {
  status: ExemptionStatus;
}

export const ExemptionStatusBadge: React.FC<ExemptionStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>0% Commission Exempt</span>
        </span>
      );
    case 'REVOKED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
          <XCircle className="w-3 h-3 text-slate-400" />
          <span>Exemption Revoked</span>
        </span>
      );
    default:
      return <span className="text-xs text-slate-600">{status}</span>;
  }
};

interface SubsidyStatusBadgeProps {
  status: SubsidyStatus;
}

export const SubsidyStatusBadge: React.FC<SubsidyStatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'ACCRUED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="w-3 h-3 text-blue-600" />
          <span>Accrued (Payable by AutoDock)</span>
        </span>
      );
    case 'SETTLED':
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          <span>Settled to Seller</span>
        </span>
      );
    default:
      return <span className="text-xs text-slate-600">{status}</span>;
  }
};
