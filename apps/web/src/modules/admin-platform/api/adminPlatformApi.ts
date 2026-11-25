import { apiClient } from '../../../shared/api/apiClient.js';

// --- Dashboard Types ---
export interface SystemModuleHealth {
  MOD_01: 'ONLINE' | 'DEGRADED';
  MOD_02: 'ONLINE' | 'DEGRADED';
  MOD_03: 'ONLINE' | 'DEGRADED';
  MOD_04: 'ONLINE' | 'DEGRADED';
  MOD_05: 'ONLINE';
}

export interface DashboardSummaryData {
  overview: {
    grossMerchandiseValueInCents: number;
    logisticsRevenueInCents: number;
    accruedCommissionInCents: number;
    platformSubsidyLiabilityInCents: number;
    totalMasterOrders: number;
    totalMerchantSuborders: number;
    activeRegisteredCustomers: number;
    approvedSellers: number;
    activeCatalogueProducts: number;
  };
  actionQueues: {
    pendingSellerKYC: number;
    pendingDeliveryProposals: number;
    pendingBankPaymentSlips: number;
    unpaidOverdueInvoices: number;
    failedNotificationDeliveries: number;
  };
  systemFreshness: {
    cachedAt: string;
    ttlSeconds: number;
    moduleHealth: SystemModuleHealth;
  };
}

// --- Notification Types ---
export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: 'ORDER' | 'PAYMENT' | 'VERIFICATION' | 'FINANCE' | 'SYSTEM' | 'SECURITY';
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  isRead: boolean;
  readAt?: string | null;
  actionUrl?: string | null;
  createdAt: string;
}

export interface NotificationPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  unreadCount: number;
  pagination: NotificationPagination;
}

export interface AdminAlertItem {
  id: string;
  title: string;
  message: string;
  category: string;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';
  isRead: boolean;
  targetEntityId?: string;
  targetEntityType?: string;
  actionUrl?: string | null;
  createdAt: string;
}

export interface DeliveryHealthLogItem {
  deliveryId: string;
  sourceModule: string;
  sourceEventName: string;
  channel: 'EMAIL' | 'IN_APP';
  templateId: string;
  recipientAddress: string;
  status: 'PENDING' | 'QUEUED' | 'PROCESSING' | 'SENT' | 'DELIVERED' | 'FAILED' | 'RETRYING' | 'CANCELLED';
  attemptCount: number;
  lastAttemptAt?: string | null;
  nextAttemptAt?: string | null;
  lastErrorCode?: string | null;
  lastErrorMessage?: string | null;
}

// --- Audit Types ---
export interface AuditActor {
  actorId: string;
  actorRole: 'ADMIN' | 'SELLER' | 'CUSTOMER' | 'SYSTEM';
  email?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditTargetEntity {
  entityType: string;
  entityId: string;
  publicReference?: string | null;
}

export interface AuditDeltaField {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogItem {
  id: string;
  action: string;
  sourceModule: 'MOD-01' | 'MOD-02' | 'MOD-03' | 'MOD-04' | 'MOD-05';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  actor: AuditActor;
  targetEntity: AuditTargetEntity;
  delta?: AuditDeltaField[];
  reason?: string | null;
  requestId?: string | null;
  timestamp: string;
}

export interface AuditDetailItem extends AuditLogItem {
  correlationId?: string | null;
}

// --- Report Types ---
export interface ReportCatalogueItem {
  reportType: string;
  title: string;
  description: string;
  primaryModule: string;
  exportable: boolean;
  supportedFilters: string[];
}

export interface ReportDataResponse {
  reportName: string;
  data: Record<string, any>[];
  meta?: {
    reportType: string;
    recordCount: number;
  };
}

// --- API Client Implementation ---
export const adminPlatformApi = {
  // 1. Dashboard
  async getDashboardSummary(refresh: boolean = false): Promise<{ success: boolean; data: DashboardSummaryData }> {
    return apiClient.get('/admin/dashboard/summary', {
      params: refresh ? { refresh: 'true' } : undefined,
    });
  },

  // 2. In-App Notifications (Current User)
  async getMyNotifications(params?: {
    page?: number;
    limit?: number;
    isRead?: boolean;
    category?: string;
  }): Promise<{ success: boolean; data: NotificationItem[]; meta: { unreadCount: number; pagination: NotificationPagination } }> {
    const queryParams: Record<string, any> = {};
    if (params?.page) queryParams.page = params.page;
    if (params?.limit) queryParams.limit = params.limit;
    if (params?.isRead !== undefined) queryParams.isRead = String(params.isRead);
    if (params?.category) queryParams.category = params.category;

    return apiClient.get('/notifications', { params: queryParams });
  },

  async getUnreadCount(): Promise<{ success: boolean; data: { unreadCount: number } }> {
    return apiClient.get('/notifications/unread-count');
  },

  async markAsRead(id: string): Promise<{ success: boolean; data: { id: string; isRead: boolean; readAt: string } }> {
    return apiClient.patch(`/notifications/${id}/read`);
  },

  async markAllAsRead(): Promise<{ success: boolean; data: { modifiedCount: number } }> {
    return apiClient.patch('/notifications/mark-all-read');
  },

  // 3. Admin Notification Operations & Delivery Health
  async getAdminOperations(params?: {
    page?: number;
    limit?: number;
    category?: string;
    priority?: string;
  }): Promise<{ success: boolean; data: AdminAlertItem[]; meta: { pagination: NotificationPagination } }> {
    return apiClient.get('/admin/notifications/operations', { params });
  },

  async getDeliveryHealth(params?: {
    page?: number;
    limit?: number;
    status?: string;
    channel?: string;
  }): Promise<{ success: boolean; data: DeliveryHealthLogItem[]; meta: { pagination: NotificationPagination } }> {
    return apiClient.get('/admin/notifications/delivery-health', { params });
  },

  async retryDelivery(deliveryId: string): Promise<{ success: boolean; message: string; data: { deliveryId: string; status: string; attemptCount: number } }> {
    return apiClient.post(`/admin/notifications/${deliveryId}/retry`);
  },

  // 4. Audit Explorer
  async searchAuditLogs(params?: {
    page?: number;
    limit?: number;
    action?: string;
    sourceModule?: string;
    severity?: string;
    actorRole?: string;
    actorId?: string;
    targetEntityType?: string;
    targetEntityId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: AuditLogItem[]; meta: { pagination: NotificationPagination } }> {
    return apiClient.get('/admin/audit-logs', { params });
  },

  async getAuditLogById(id: string): Promise<{ success: boolean; data: AuditDetailItem }> {
    return apiClient.get(`/admin/audit-logs/${id}`);
  },

  // 5. Consolidated Reports
  async getReport(
    reportType: string,
    params?: {
      startDate?: string;
      endDate?: string;
      sellerId?: string;
    }
  ): Promise<{ success: boolean; data: Record<string, any>[]; meta: { reportType: string; recordCount: number } }> {
    return apiClient.get(`/admin/reports/${reportType}`, {
      params: {
        ...params,
        format: 'json',
      },
    });
  },

  // Trigger browser file download of CSV export
  async downloadReportCsv(
    reportType: string,
    params?: {
      startDate?: string;
      endDate?: string;
      sellerId?: string;
    }
  ): Promise<void> {
    const query = new URLSearchParams();
    query.set('format', 'csv');
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.sellerId) query.set('sellerId', params.sellerId);

    const baseUrl = apiClient.defaults.baseURL || '/api/v1';
    const downloadUrl = `${baseUrl}/admin/reports/${reportType}?${query.toString()}`;

    // Use native fetch with auth header or window download
    const token = sessionStorage.getItem('accessToken');
    const headers: Record<string, string> = {};
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(downloadUrl, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      const errorJson = await res.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(errorJson.message || 'Failed to download report CSV');
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autodock-${reportType}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
