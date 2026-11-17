import { apiClient } from '../../../shared/api/apiClient.js';

export type UserRole = 'CUSTOMER' | 'SELLER' | 'ADMIN';
export type UserAccountStatus = 'ACTIVE' | 'PENDING_EMAIL_VERIFICATION' | 'RESTRICTED' | 'SUSPENDED' | 'DEACTIVATED';
export type SellerStoreType = 'PHYSICAL_STORE' | 'ONLINE_ONLY';
export type SellerVerificationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'UNDER_VERIFICATION'
  | 'ADDITIONAL_INFO_REQUIRED'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED';

export type BankVerificationStatus = 'PENDING' | 'VERIFIED' | 'REJECTED';
export type DocumentType = 'BUSINESS_REGISTRATION' | 'SELLER_ID_CARD' | 'SELLER_FACE_PHOTO' | 'STORE_PHOTO';
export type DocumentReviewStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  accountStatus: UserAccountStatus;
  isEmailVerified: boolean;
  sellerId?: string | null;
  shippingAddresses?: Array<{
    _id?: string;
    street: string;
    city: string;
    district: string;
    province: string;
    postalCode: string;
    isDefault?: boolean;
  }>;
  createdAt?: string;
}

export interface SellerProfileData {
  sellerId: string;
  businessName: string;
  storeSlug: string;
  sellerType: SellerStoreType;
  businessRegistrationNumber: string;
  operatingAddress: {
    street: string;
    city: string;
    district: string;
    province: string;
    postalCode: string;
  };
  contactPhone: string;
  verificationStatus: SellerVerificationStatus;
  isEligibleToSell: boolean;
  documentsCount?: number;
  bankVerificationStatus?: string;
  privacyAcknowledged?: boolean;
  rejectionReason?: string | null;
  additionalInfoRequested?: string | null;
  verificationHistory?: Array<{
    reviewedByAdminId: string;
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
    verificationMethod?: 'PHYSICAL_VISIT' | 'WHATSAPP_VIDEO_CALL' | 'DOCUMENT_ONLY';
    verificationNotes: string;
    reviewedAt: string;
  }>;
  user?: {
    _id?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  documents?: SellerDocumentItem[];
  bankDetails?: {
    bankName: string;
    accountHolderName: string;
    maskedAccountNumber: string;
    branchName: string;
    branchCode?: string | null;
    verificationStatus: BankVerificationStatus;
    verifiedAt?: string | null;
    rejectionReason?: string | null;
  } | null;
  hasPrivacyAcknowledgement?: boolean;
}

export interface SellerDocumentItem {
  documentId: string;
  documentType: DocumentType;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  reviewStatus: DocumentReviewStatus;
  adminReviewNotes?: string | null;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  code?: string;
  message?: string;
  data: T;
  meta?: {
    requestId?: string;
    timestamp?: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

// -----------------------------------------------------------------------------
// Authentication API
// -----------------------------------------------------------------------------
export const authApi = {
  register: async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }): Promise<ApiResponse<{ userId: string; email: string; role: UserRole; isEmailVerified: boolean }>> => {
    return apiClient.post('/auth/register', payload);
  },

  login: async (payload: {
    email: string;
    password: string;
  }): Promise<ApiResponse<{
    accessToken: string;
    tokenType: string;
    expiresInSeconds: number;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
      role: UserRole;
      sellerId?: string | null;
    };
  }>> => {
    return apiClient.post('/auth/login', payload);
  },

  logout: async (): Promise<ApiResponse<null>> => {
    return apiClient.post('/auth/logout');
  },

  forgotPassword: async (payload: { email: string }): Promise<ApiResponse<null>> => {
    return apiClient.post('/auth/forgot-password', payload);
  },

  resetPassword: async (payload: { token: string; newPassword: string }): Promise<ApiResponse<null>> => {
    return apiClient.post('/auth/reset-password', payload);
  },

  getMe: async (): Promise<ApiResponse<UserProfile>> => {
    return apiClient.get('/users/me');
  },

  updateMe: async (payload: {
    firstName?: string;
    lastName?: string;
    phone?: string;
  }): Promise<ApiResponse<UserProfile>> => {
    return apiClient.put('/users/me', payload);
  },
};

// -----------------------------------------------------------------------------
// Seller Onboarding API
// -----------------------------------------------------------------------------
export const sellerApi = {
  registerProfile: async (payload: {
    businessName: string;
    storeSlug: string;
    sellerType: SellerStoreType;
    businessRegistrationNumber: string;
    operatingAddress: {
      street: string;
      city: string;
      district: string;
      province: string;
      postalCode: string;
    };
    contactPhone: string;
  }): Promise<ApiResponse<{ sellerId: string; storeSlug: string; sellerType: SellerStoreType; verificationStatus: SellerVerificationStatus }>> => {
    return apiClient.post('/sellers/register', payload);
  },

  getMe: async (): Promise<ApiResponse<SellerProfileData>> => {
    return apiClient.get('/sellers/me');
  },

  uploadDocument: async (payload: {
    documentType: DocumentType;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
    fileContentBase64?: string;
  }): Promise<ApiResponse<SellerDocumentItem>> => {
    return apiClient.post('/sellers/me/documents', payload);
  },

  getDocuments: async (): Promise<ApiResponse<SellerDocumentItem[]>> => {
    return apiClient.get('/sellers/me/documents');
  },

  submitBankDetails: async (payload: {
    bankName: string;
    accountHolderName: string;
    accountNumber: string;
    branchName: string;
    branchCode?: string;
  }): Promise<ApiResponse<{
    bankName: string;
    accountHolderName: string;
    maskedAccountNumber: string;
    branchName: string;
    verificationStatus: BankVerificationStatus;
  }>> => {
    return apiClient.post('/sellers/me/bank-details', payload);
  },

  acknowledgePrivacy: async (payload: {
    noticeVersion: string;
    acknowledged: true;
  }): Promise<ApiResponse<{ noticeVersion: string; acknowledgedAt: string }>> => {
    return apiClient.post('/sellers/me/privacy-acknowledgement', payload);
  },

  submitApplication: async (): Promise<ApiResponse<{
    sellerId: string;
    verificationStatus: SellerVerificationStatus;
    isEligibleToSell: boolean;
  }>> => {
    return apiClient.post('/sellers/me/submit');
  },
};

// -----------------------------------------------------------------------------
// Administrator Seller Verification API
// -----------------------------------------------------------------------------
export const adminSellerApi = {
  listApplications: async (params?: {
    status?: string;
    sellerType?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<SellerProfileData[]>> => {
    return apiClient.get('/admin/sellers', { params });
  },

  getApplicationDetail: async (sellerId: string): Promise<ApiResponse<SellerProfileData>> => {
    return apiClient.get(`/admin/sellers/${sellerId}`);
  },

  reviewApplication: async (
    sellerId: string,
    payload: {
      decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
      verificationMethod?: 'PHYSICAL_VISIT' | 'WHATSAPP_VIDEO_CALL' | 'DOCUMENT_ONLY';
      verificationNotes: string;
    }
  ): Promise<ApiResponse<{
    sellerId: string;
    verificationStatus: SellerVerificationStatus;
    isEligibleToSell: boolean;
    rejectionReason?: string;
    additionalInfoRequested?: string;
  }>> => {
    return apiClient.post(`/admin/sellers/${sellerId}/review`, payload);
  },

  verifyBankDetails: async (
    sellerId: string,
    payload: {
      decision: 'VERIFY' | 'REJECT';
      rejectionReason?: string;
    }
  ): Promise<ApiResponse<{
    sellerId: string;
    verificationStatus: BankVerificationStatus;
    rejectionReason?: string;
    verifiedAt?: string;
  }>> => {
    return apiClient.patch(`/admin/sellers/${sellerId}/bank-details/verify`, payload);
  },

  getDocumentViewUrl: async (
    sellerId: string,
    docId: string
  ): Promise<ApiResponse<{ viewUrl: string; expiresInSeconds: number }>> => {
    return apiClient.get(`/admin/sellers/${sellerId}/documents/${docId}/view-url`);
  },
};
