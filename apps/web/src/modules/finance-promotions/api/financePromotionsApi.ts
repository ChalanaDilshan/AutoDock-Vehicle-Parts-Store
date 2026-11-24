import { apiClient } from '../../../shared/api/apiClient.js';

// ============================================================================
// Enums & Domain Types
// ============================================================================

export type SellerInvoiceStatus =
  | 'ISSUED'
  | 'PAYMENT_PENDING_VERIFICATION'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type ReceiptReviewStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export type CommissionLedgerStatus = 'ACCRUED' | 'INVOICED' | 'ADJUSTED';

export type PromotionFundingSource = 'SELLER_FUNDED' | 'AUTODOCK_FUNDED';

export type PromotionDiscountType = 'PERCENTAGE' | 'FIXED_AMOUNT';

export type PromotionStatus = 'ACTIVE' | 'INACTIVE';

export type ExemptionStatus = 'ACTIVE' | 'REVOKED';

export type SubsidyStatus = 'ACCRUED' | 'SETTLED';

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
}

// ============================================================================
// Entity Interfaces
// ============================================================================

export interface CommissionSummary {
  lifetimeCommissionInCents: number;
  currentMonthAccruedInCents: number;
  uninvoicedAccruedInCents: number;
  outstandingInvoiceBalanceInCents: number;
  totalSubsidyAccruedInCents: number;
}

export interface SellerBillingSnapshot {
  businessName: string;
  businessRegNumber: string;
  billingEmail: string;
  contactPhone: string;
  address?: {
    street?: string;
    city?: string;
    district?: string;
    province?: string;
    postalCode?: string;
  };
}

export interface SellerInvoice {
  _id: string;
  invoiceNumber: string;
  sellerId:
    | string
    | {
        _id: string;
        businessName?: string;
        storeName?: string;
        contactPhone?: string;
      };
  billingPeriod: string;
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  grossProductTotalInCents: number;
  grossCommissionInCents: number;
  verifiedPaidInCents: number;
  outstandingBalanceInCents: number;
  status: SellerInvoiceStatus;
  sellerBillingSnapshot: SellerBillingSnapshot;
  itemCount: number;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionLedgerEntry {
  _id: string;
  ledgerReference: string;
  sellerId: string | { _id: string; businessName?: string; storeName?: string };
  orderId: string;
  suborderId: string;
  completionEventId?: string;
  completionTimestamp: string;
  productSubtotalInCents: number;
  sellerDiscountInCents: number;
  platformDiscountInCents: number;
  deliveryFeeInCents: number;
  commissionableBaseInCents: number;
  appliedRateBasisPoints: number;
  isExempt: boolean;
  commissionAmountInCents: number;
  currency: string;
  status: CommissionLedgerStatus;
  invoiceId?: string;
  invoicedAt?: string;
  createdAt: string;
}

export interface InvoicePaymentReceipt {
  _id: string;
  invoiceId:
    | string
    | {
        _id: string;
        invoiceNumber?: string;
        billingPeriod?: string;
        grossCommissionInCents?: number;
        outstandingBalanceInCents?: number;
        status?: SellerInvoiceStatus;
        dueDate?: string;
      };
  sellerId:
    | string
    | {
        _id: string;
        storeName?: string;
        businessName?: string;
        contactPhone?: string;
      };
  storageKey?: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  claimedAmountInCents: number;
  depositedAmountInCents?: number;
  depositDate: string;
  bankTransactionReference?: string;
  reviewStatus: ReceiptReviewStatus;
  reviewedBy?: string | { _id: string; firstName?: string; lastName?: string; email?: string };
  reviewedAt?: string;
  rejectionReason?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface PromotionRecord {
  _id: string;
  code: string;
  title: string;
  description?: string;
  fundingSource: PromotionFundingSource;
  sellerId?: string | { _id: string; businessName?: string; storeName?: string };
  discountType: PromotionDiscountType;
  discountValue: number; // basis points if PERCENTAGE (100 = 1%), cents if FIXED_AMOUNT
  minSpendInCents: number;
  maxDiscountInCents?: number;
  applicableProductIds: string[];
  applicableCategoryIds: string[];
  startDate: string;
  endDate: string;
  totalUsageLimit?: number;
  perCustomerLimit: number;
  currentUsageCount: number;
  status: PromotionStatus;
  createdAt: string;
}

export interface PlatformSubsidyRecord {
  _id: string;
  subsidyReference: string;
  sellerId: string | { _id: string; businessName?: string; storeName?: string };
  orderId: string;
  suborderId: string;
  promotionId: string;
  promotionCode: string;
  eligibleProductAmountInCents: number;
  subsidyAmountInCents: number;
  currency: string;
  accrualTimestamp: string;
  status: SubsidyStatus;
  settledAt?: string;
  settlementReference?: string;
  createdAt: string;
}

export interface CommissionRateConfig {
  _id: string;
  basisPoints: number;
  percentage: number;
  effectiveFrom: string;
  status: 'ACTIVE' | 'SUPERSEDED' | 'INACTIVE';
  description: string;
  configuredBy?: string | { _id: string; firstName?: string; lastName?: string; email?: string };
  createdAt: string;
}

export interface SellerCommissionExemption {
  _id: string;
  sellerId: string | { _id: string; businessName?: string; storeName?: string; email?: string };
  status: ExemptionStatus;
  reason: string;
  activatedBy?: string | { _id: string; firstName?: string; lastName?: string; email?: string };
  activatedAt: string;
  revokedBy?: string | { _id: string; firstName?: string; lastName?: string; email?: string };
  revokedAt?: string;
  revocationReason?: string;
  createdAt: string;
}

export interface PlatformBankSettings {
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  branchName: string;
  branchCode?: string;
  paymentInstructions: string;
}

// ============================================================================
// Seller Finance APIs
// ============================================================================

export const sellerFinanceApi = {
  getSummary: (): Promise<ApiResponse<CommissionSummary>> => {
    return apiClient.get('/seller/finance/summary');
  },

  getInvoices: (params: {
    billingPeriod?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<{ invoices: SellerInvoice[]; pagination: Pagination }>> => {
    return apiClient.get('/seller/finance/invoices', { params });
  },

  getInvoiceById: (
    id: string
  ): Promise<
    ApiResponse<{
      invoice: SellerInvoice;
      lineItems: CommissionLedgerEntry[];
      receipts: InvoicePaymentReceipt[];
    }>
  > => {
    return apiClient.get(`/seller/finance/invoices/${id}`);
  },

  uploadReceipt: (
    invoiceId: string,
    payload: {
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
      fileContentBase64?: string;
      claimedAmountInCents: number;
      depositDate?: string;
    }
  ): Promise<ApiResponse<{ receipt: InvoicePaymentReceipt; invoice: SellerInvoice }>> => {
    return apiClient.post(`/seller/finance/invoices/${invoiceId}/receipt`, payload);
  },

  getReceipts: (invoiceId: string): Promise<ApiResponse<{ receipts: InvoicePaymentReceipt[] }>> => {
    return apiClient.get(`/seller/finance/invoices/${invoiceId}/receipts`);
  },

  getSubsidies: (params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<
    ApiResponse<{
      subsidies: PlatformSubsidyRecord[];
      totalAccruedInCents: number;
      totalSettledInCents: number;
      pagination: Pagination;
    }>
  > => {
    return apiClient.get('/seller/finance/subsidies', { params });
  },
};

// ============================================================================
// Seller Promotions APIs
// ============================================================================

export const sellerPromotionApi = {
  getPromotions: (params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<ApiResponse<{ promotions: PromotionRecord[]; pagination: Pagination }>> => {
    return apiClient.get('/seller/promotions', { params });
  },

  getPromotionById: (
    id: string
  ): Promise<
    ApiResponse<{
      promotion: PromotionRecord;
      redemptionCount: number;
      totalDiscountFundedInCents: number;
    }>
  > => {
    return apiClient.get(`/seller/promotions/${id}`);
  },

  createPromotion: (payload: {
    code: string;
    title: string;
    description?: string;
    discountType: PromotionDiscountType;
    discountValue: number;
    minSpendInCents?: number;
    maxDiscountInCents?: number;
    applicableProductIds?: string[];
    startDate: string;
    endDate: string;
    totalUsageLimit?: number;
    perCustomerLimit?: number;
  }): Promise<ApiResponse<{ promotion: PromotionRecord }>> => {
    return apiClient.post('/seller/promotions', payload);
  },

  updateStatus: (
    id: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<ApiResponse<{ promotion: PromotionRecord }>> => {
    return apiClient.patch(`/seller/promotions/${id}/status`, { status });
  },
};

// ============================================================================
// Administrator Finance APIs
// ============================================================================

export const adminFinanceApi = {
  getCommissionRate: (): Promise<
    ApiResponse<{
      currentRate: CommissionRateConfig;
      history: CommissionRateConfig[];
    }>
  > => {
    return apiClient.get('/admin/finance/commission-rate');
  },

  configureCommissionRate: (payload: {
    basisPoints: number;
    description: string;
    effectiveFrom?: string;
  }): Promise<ApiResponse<{ newRate: CommissionRateConfig }>> => {
    return apiClient.post('/admin/finance/commission-rate', payload);
  },

  getExemptions: (params: {
    sellerId?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<{ exemptions: SellerCommissionExemption[]; pagination: Pagination }>> => {
    return apiClient.get('/admin/finance/exemptions', { params });
  },

  grantExemption: (payload: {
    sellerId: string;
    reason: string;
  }): Promise<ApiResponse<{ exemption: SellerCommissionExemption }>> => {
    return apiClient.post('/admin/finance/exemptions', payload);
  },

  revokeExemption: (
    sellerId: string,
    payload: { reason: string }
  ): Promise<ApiResponse<{ exemption: SellerCommissionExemption }>> => {
    return apiClient.delete(`/admin/finance/exemptions/${sellerId}`, { data: payload });
  },

  getCommissionLedger: (params: {
    sellerId?: string;
    orderId?: string;
    suborderId?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<
    ApiResponse<{
      entries: CommissionLedgerEntry[];
      summary: { totalCommissionInCents: number; totalBaseInCents: number };
      pagination: Pagination;
    }>
  > => {
    return apiClient.get('/admin/finance/commission-ledger', { params });
  },

  getInvoices: (params: {
    sellerId?: string;
    billingPeriod?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<ApiResponse<{ invoices: SellerInvoice[]; pagination: Pagination }>> => {
    return apiClient.get('/admin/finance/invoices', { params });
  },

  getInvoiceById: (
    id: string
  ): Promise<
    ApiResponse<{
      invoice: SellerInvoice;
      lineItems: CommissionLedgerEntry[];
      receipts: InvoicePaymentReceipt[];
    }>
  > => {
    return apiClient.get(`/admin/finance/invoices/${id}`);
  },

  generateInvoices: (payload: {
    billingPeriod: string;
  }): Promise<
    ApiResponse<{ generatedCount: number; skippedCount: number; billingPeriod: string }>
  > => {
    return apiClient.post('/admin/finance/invoices/generate', payload);
  },

  getPaymentVerificationQueue: (params: {
    page?: number;
    limit?: number;
  } = {}): Promise<
    ApiResponse<{ pendingReceipts: InvoicePaymentReceipt[]; pagination: Pagination }>
  > => {
    return apiClient.get('/admin/finance/payment-verification-queue', { params });
  },

  verifyPaymentReceipt: (
    invoiceId: string,
    receiptId: string,
    payload: {
      action: 'APPROVE' | 'REJECT';
      depositedAmountInCents?: number;
      bankTransactionReference?: string;
      rejectionReason?: string;
      adminNotes?: string;
    }
  ): Promise<ApiResponse<{ receipt: InvoicePaymentReceipt; invoice: SellerInvoice }>> => {
    return apiClient.post(
      `/admin/finance/invoices/${invoiceId}/receipts/${receiptId}/verify`,
      payload
    );
  },

  getPlatformBankSettings: (): Promise<ApiResponse<{ settings: PlatformBankSettings }>> => {
    return apiClient.get('/admin/finance/platform-bank-account');
  },

  updatePlatformBankSettings: (
    payload: PlatformBankSettings
  ): Promise<ApiResponse<{ settings: PlatformBankSettings }>> => {
    return apiClient.put('/admin/finance/platform-bank-account', payload);
  },
};

// ============================================================================
// Administrator Promotions & Subsidies APIs
// ============================================================================

export const adminPromotionApi = {
  getPromotions: (params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<ApiResponse<{ promotions: PromotionRecord[]; pagination: Pagination }>> => {
    return apiClient.get('/admin/promotions', { params });
  },

  getPromotionById: (
    id: string
  ): Promise<
    ApiResponse<{
      promotion: PromotionRecord;
      redemptionCount: number;
      totalDiscountFundedInCents: number;
    }>
  > => {
    return apiClient.get(`/admin/promotions/${id}`);
  },

  createPromotion: (payload: {
    code: string;
    title: string;
    description?: string;
    discountType: PromotionDiscountType;
    discountValue: number;
    minSpendInCents?: number;
    maxDiscountInCents?: number;
    applicableCategoryIds?: string[];
    applicableProductIds?: string[];
    startDate: string;
    endDate: string;
    totalUsageLimit?: number;
    perCustomerLimit?: number;
  }): Promise<ApiResponse<{ promotion: PromotionRecord }>> => {
    return apiClient.post('/admin/promotions', payload);
  },

  updateStatus: (
    id: string,
    status: 'ACTIVE' | 'INACTIVE'
  ): Promise<ApiResponse<{ promotion: PromotionRecord }>> => {
    return apiClient.patch(`/admin/promotions/${id}/status`, { status });
  },

  getSubsidies: (params: {
    page?: number;
    limit?: number;
    status?: string;
    sellerId?: string;
  } = {}): Promise<
    ApiResponse<{
      subsidies: PlatformSubsidyRecord[];
      totalAccruedInCents: number;
      totalSettledInCents: number;
      pagination: Pagination;
    }>
  > => {
    return apiClient.get('/admin/promotions/subsidies', { params });
  },
};

// ============================================================================
// Public / Shared Finance APIs
// ============================================================================

export const publicFinanceApi = {
  getPlatformBankAccount: (): Promise<ApiResponse<PlatformBankSettings>> => {
    return apiClient.get('/finance/platform-bank-account');
  },
};
