import { apiClient } from '../../../shared/api/apiClient.js';

// ============================================================================
// Enums & Domain Constants
// ============================================================================

export type SuborderFulfillmentStatus =
  | 'PENDING_PAYMENT'
  | 'AWAITING_FULFILLMENT'
  | 'PROCESSING'
  | 'READY_FOR_DISPATCH'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export type SuborderPaymentStatus =
  | 'PENDING'
  | 'RECEIPT_UPLOADED'
  | 'PAID'
  | 'REFUNDED'
  | 'COLLECTED';

export type MasterOrderRollupStatus =
  | 'PENDING_PAYMENT'
  | 'AWAITING_FULFILLMENT'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentMethod = 'COD' | 'DIRECT_BANK_TRANSFER' | 'CARD';

export type ProposalStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export type SlipVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export const SRI_LANKAN_DISTRICTS = [
  'Ampara',
  'Anuradhapura',
  'Badulla',
  'Batticaloa',
  'Colombo',
  'Galle',
  'Gampaha',
  'Hambantota',
  'Jaffna',
  'Kalutara',
  'Kandy',
  'Kegalle',
  'Kilinochchi',
  'Kurunegala',
  'Mannar',
  'Matale',
  'Matara',
  'Monaragala',
  'Mullaitivu',
  'Nuwara Eliya',
  'Polonnaruwa',
  'Puttalam',
  'Ratnapura',
  'Trincomalee',
  'Vavuniya',
] as const;

// ============================================================================
// Data Interfaces
// ============================================================================

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  district: string;
  postalCode: string;
}

export interface QuoteLineItem {
  productId: string;
  name: string;
  partNumber: string;
  sku: string;
  thumbnailUrl?: string;
  quantity: number;
  unitPriceInCents: number;
  lineTotalInCents: number;
  discountInCents: number;
}

export interface QuoteSellerSuborder {
  sellerId: string;
  sellerName: string;
  items: QuoteLineItem[];
  productSubtotalInCents: number;
  deliveryFeeInCents: number;
  totalInCents: number;
  deliveryRateId?: string;
  isDefaultRate: boolean;
}

export interface CheckoutQuoteData {
  sellerSuborders: QuoteSellerSuborder[];
  totalProductAmountInCents: number;
  totalDeliveryFeeInCents: number;
  totalDiscountInCents: number;
  finalPayableAmountInCents: number;
  shippingDistrict: string;
}

export interface CheckoutQuotePayload {
  shippingAddress: {
    street: string;
    city: string;
    district: string;
    postalCode: string;
    phone: string;
  };
  items?: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface SellerPaymentMethodSelection {
  sellerId: string;
  paymentMethod: PaymentMethod;
}

export interface PlaceOrderPayload {
  shippingAddress: ShippingAddress;
  sellerPaymentMethods: SellerPaymentMethodSelection[];
  customerNotes?: string;
  idempotencyKey?: string;
}

export interface SuborderItem {
  productId: string;
  name: string;
  sku: string;
  partNumber: string;
  quantity: number;
  unitPriceInCents: number;
  lineTotalInCents: number;
  sellerDiscountInCents: number;
  platformDiscountInCents: number;
  thumbnailUrl?: string;
}

export interface CourierTrackingDetails {
  courierName: string;
  trackingNumber: string;
  dispatchedAt?: string;
  estimatedDeliveryDate?: string;
  courierContactPhone?: string;
}

export interface SuborderDetail {
  _id: string;
  suborderNumber: string;
  orderId: string;
  sellerId: string;
  items: SuborderItem[];
  productSubtotalInCents: number;
  sellerDiscountInCents: number;
  platformDiscountInCents: number;
  commissionableBaseInCents: number;
  deliveryFeeInCents: number;
  totalAmountInCents: number;
  deliveryDistrict: string;
  paymentMethod: PaymentMethod;
  paymentStatus: SuborderPaymentStatus;
  fulfillmentStatus: SuborderFulfillmentStatus;
  courierDetails?: CourierTrackingDetails;
  cancellationReason?: string;
  cancelledAt?: string;
  deliveredAt?: string;
  rejectedReceiptCount?: number;
  latestReceiptId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterOrderSummary {
  _id: string;
  orderNumber: string;
  customerId: string;
  suborderIds: string[];
  totalProductAmountInCents: number;
  totalDeliveryFeeInCents: number;
  totalDiscountInCents: number;
  finalPayableAmountInCents: number;
  overallStatus: MasterOrderRollupStatus;
  shippingAddress: ShippingAddress;
  subordersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MasterOrderDetail extends MasterOrderSummary {
  customerNotes?: string;
  statusHistory: Array<{
    status: MasterOrderRollupStatus;
    changedAt: string;
    reason?: string;
  }>;
}

export interface PlaceOrderResult {
  order: MasterOrderDetail;
  suborders: SuborderDetail[];
}

export interface BankTransferInstructions {
  bankName: string;
  branchName: string;
  accountHolderName: string;
  accountNumber: string;
  maskedAccountNumber: string;
  sellerBusinessName: string;
  suborderNumber: string;
  amountDueInCents: number;
}

export interface PaymentSlipRecord {
  _id: string;
  suborderId: string;
  sellerId: string;
  customerId: string;
  receiptUrl: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  transferReference?: string;
  depositedAmountInCents?: number;
  depositDate?: string;
  verificationStatus: SlipVerificationStatus;
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  submittedAt: string;
}

export interface DistrictRateProposalItem {
  district: string;
  deliveryFeeInCents: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
}

export interface DeliveryRateProposalRecord {
  _id: string;
  sellerId: string;
  districtRates: DistrictRateProposalItem[];
  status: ProposalStatus;
  reviewerNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryZoneRecord {
  _id: string;
  sellerId: string;
  district: string;
  deliveryFeeInCents: number;
  estimatedDaysMin: number;
  estimatedDaysMax: number;
  isActive: boolean;
  version: number;
  approvedProposalId: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

// ============================================================================
// API Service Methods
// ============================================================================

export const checkoutApi = {
  getQuote: async (payload: CheckoutQuotePayload): Promise<ApiResponse<CheckoutQuoteData>> => {
    return (await apiClient.post('/checkout/quote', payload)) as unknown as ApiResponse<CheckoutQuoteData>;
  },

  placeOrder: async (payload: PlaceOrderPayload): Promise<ApiResponse<PlaceOrderResult>> => {
    return (await apiClient.post('/checkout/orders', payload)) as unknown as ApiResponse<PlaceOrderResult>;
  },
};

function normalizePaginationMeta(meta: any, itemCount: number): Pagination {
  const page = Number(meta?.pagination?.page ?? meta?.page ?? 1);
  const limit = Number(meta?.pagination?.limit ?? meta?.limit ?? 10) || 10;
  const total = Number(meta?.pagination?.total ?? meta?.total ?? itemCount);
  const totalPages = Number(
    meta?.pagination?.totalPages ?? Math.max(1, Math.ceil(total / Math.max(1, limit)))
  );
  return { page, limit, total, totalPages };
}

export const orderApi = {
  getCustomerOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<ApiResponse<{ orders: MasterOrderSummary[]; pagination: Pagination }>> => {
    const raw = (await apiClient.get('/orders', { params })) as any;
    if (Array.isArray(raw?.data)) {
      return {
        ...raw,
        data: {
          orders: raw.data,
          pagination: normalizePaginationMeta(raw.meta, raw.data.length),
        },
      };
    }
    return raw;
  },

  getOrderById: async (
    orderId: string
  ): Promise<ApiResponse<{ order: MasterOrderDetail; suborders: SuborderDetail[] }>> => {
    return (await apiClient.get(`/orders/${orderId}`)) as unknown as ApiResponse<{
      order: MasterOrderDetail;
      suborders: SuborderDetail[];
    }>;
  },

  getSuborderById: async (suborderId: string): Promise<ApiResponse<SuborderDetail>> => {
    return (await apiClient.get(`/orders/suborders/${suborderId}`)) as unknown as ApiResponse<SuborderDetail>;
  },

  getBankInstructions: async (
    suborderId: string
  ): Promise<ApiResponse<BankTransferInstructions>> => {
    return (await apiClient.get(
      `/orders/suborders/${suborderId}/bank-instructions`
    )) as unknown as ApiResponse<BankTransferInstructions>;
  },

  uploadReceipt: async (
    suborderId: string,
    formData: FormData
  ): Promise<ApiResponse<PaymentSlipRecord>> => {
    return (await apiClient.post(`/orders/suborders/${suborderId}/receipt`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })) as unknown as ApiResponse<PaymentSlipRecord>;
  },

  cancelSuborder: async (
    suborderId: string,
    reason: string
  ): Promise<ApiResponse<SuborderDetail>> => {
    return (await apiClient.post(`/orders/suborders/${suborderId}/cancel`, {
      reason,
    })) as unknown as ApiResponse<SuborderDetail>;
  },

  getReceiptStreamUrl: (token: string): string => {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
    return `${baseUrl}/orders/receipts/stream?token=${encodeURIComponent(token)}`;
  },
};

export const sellerOrderApi = {
  getSellerSuborders: async (params?: {
    page?: number;
    limit?: number;
    fulfillmentStatus?: string;
    paymentStatus?: string;
  }): Promise<ApiResponse<{ suborders: SuborderDetail[]; pagination: Pagination }>> => {
    const raw = (await apiClient.get('/seller/suborders', { params })) as any;
    if (Array.isArray(raw?.data)) {
      return {
        ...raw,
        data: {
          suborders: raw.data,
          pagination: normalizePaginationMeta(raw.meta, raw.data.length),
        },
      };
    }
    return raw;
  },

  getSellerSuborderById: async (suborderId: string): Promise<ApiResponse<SuborderDetail>> => {
    return (await apiClient.get(`/seller/suborders/${suborderId}`)) as unknown as ApiResponse<SuborderDetail>;
  },

  updateFulfillmentStatus: async (
    suborderId: string,
    payload: {
      fulfillmentStatus: SuborderFulfillmentStatus;
      courierDetails?: CourierTrackingDetails;
      cancellationReason?: string;
    }
  ): Promise<ApiResponse<SuborderDetail>> => {
    return (await apiClient.patch(
      `/seller/suborders/${suborderId}/status`,
      payload
    )) as unknown as ApiResponse<SuborderDetail>;
  },

  getSellerSuborderReceipt: async (
    suborderId: string
  ): Promise<ApiResponse<{ slip: PaymentSlipRecord; downloadToken: string }>> => {
    return (await apiClient.get(
      `/seller/suborders/${suborderId}/receipt`
    )) as unknown as ApiResponse<{ slip: PaymentSlipRecord; downloadToken: string }>;
  },

  verifyReceipt: async (
    suborderId: string,
    payload: { action: 'APPROVE' | 'REJECT'; rejectionReason?: string }
  ): Promise<ApiResponse<{ suborder: SuborderDetail; slip: PaymentSlipRecord }>> => {
    return (await apiClient.post(
      `/seller/suborders/${suborderId}/receipt/verify`,
      payload
    )) as unknown as ApiResponse<{ suborder: SuborderDetail; slip: PaymentSlipRecord }>;
  },
};

export const deliveryRateApi = {
  submitProposal: async (payload: {
    districtRates: DistrictRateProposalItem[];
  }): Promise<ApiResponse<DeliveryRateProposalRecord>> => {
    return (await apiClient.post(
      '/seller/delivery-rates/proposals',
      payload
    )) as unknown as ApiResponse<DeliveryRateProposalRecord>;
  },

  getSellerRates: async (): Promise<
    ApiResponse<{
      activeRates: DeliveryZoneRecord[];
      proposals: DeliveryRateProposalRecord[];
    }>
  > => {
    return (await apiClient.get('/seller/delivery-rates')) as unknown as ApiResponse<{
      activeRates: DeliveryZoneRecord[];
      proposals: DeliveryRateProposalRecord[];
    }>;
  },

  getAdminProposals: async (
    status?: string
  ): Promise<ApiResponse<DeliveryRateProposalRecord[]>> => {
    return (await apiClient.get('/admin/delivery-rates/proposals', {
      params: status ? { status } : undefined,
    })) as unknown as ApiResponse<DeliveryRateProposalRecord[]>;
  },

  decideProposal: async (
    proposalId: string,
    payload: { decision: 'APPROVE' | 'REJECT'; reviewerNotes?: string; rejectionReason?: string }
  ): Promise<ApiResponse<DeliveryRateProposalRecord>> => {
    return (await apiClient.post(
      `/admin/delivery-rates/proposals/${proposalId}/decision`,
      payload
    )) as unknown as ApiResponse<DeliveryRateProposalRecord>;
  },
};

export const adminOrderApi = {
  getAdminOrders: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }): Promise<ApiResponse<{ orders: MasterOrderSummary[]; pagination: Pagination }>> => {
    const raw = (await apiClient.get('/admin/orders', { params })) as any;
    if (Array.isArray(raw?.data)) {
      return {
        ...raw,
        data: {
          orders: raw.data,
          pagination: normalizePaginationMeta(raw.meta, raw.data.length),
        },
      };
    }
    return raw;
  },

  getAdminOrderById: async (
    orderId: string
  ): Promise<ApiResponse<{ order: MasterOrderDetail; suborders: SuborderDetail[] }>> => {
    return (await apiClient.get(`/admin/orders/${orderId}`)) as unknown as ApiResponse<{
      order: MasterOrderDetail;
      suborders: SuborderDetail[];
    }>;
  },
};

export const cardPaymentApi = {
  initiateCardPayment: async (
    suborderId: string
  ): Promise<ApiResponse<{ sessionId: string; checkoutUrl: string; expiresAt: string }>> => {
    return (await apiClient.post('/payments/card/initiate', {
      suborderId,
    })) as unknown as ApiResponse<{ sessionId: string; checkoutUrl: string; expiresAt: string }>;
  },
};
