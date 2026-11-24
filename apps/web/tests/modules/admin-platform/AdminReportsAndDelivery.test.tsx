// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminReportsPage } from '../../../src/modules/admin-platform/pages/AdminReportsPage.js';
import { AdminNotificationsOperationsPage } from '../../../src/modules/admin-platform/pages/AdminNotificationsOperationsPage.js';
import { adminPlatformApi } from '../../../src/modules/admin-platform/api/adminPlatformApi.js';

vi.mock('../../../src/modules/admin-platform/api/adminPlatformApi.js', () => ({
  adminPlatformApi: {
    getReport: vi.fn(),
    downloadReportCsv: vi.fn(),
    getAdminOperations: vi.fn(),
    getDeliveryHealth: vi.fn(),
    retryDelivery: vi.fn(),
  },
}));

describe('MOD-05 Reports & Operational Delivery Health Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renders consolidated reports catalogue and displays sales velocity metrics', async () => {
    (adminPlatformApi.getReport as any).mockResolvedValue({
      success: true,
      data: [
        {
          metric: 'Gross Merchandise Value (Cents)',
          value: 12500000,
          currency: 'LKR',
        },
        {
          metric: 'Total Master Orders',
          value: 35,
          currency: 'COUNT',
        },
      ],
      meta: {
        reportType: 'sales-velocity',
        recordCount: 2,
      },
    });

    render(
      <MemoryRouter>
        <AdminReportsPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Consolidated Platform Reports')).toBeDefined();
    expect(screen.getByText('Multi-Vendor Sales Velocity')).toBeDefined();
    expect(screen.getByText('Seller Verification SLA')).toBeDefined();
    expect(screen.getByText('Commission Aging & Receivables')).toBeDefined();
    expect(screen.getByText('District Delivery Coverage')).toBeDefined();
    expect(screen.getByText('Security & Compliance Activity')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Result Dataset: 2 Records')).toBeDefined();
    });

    expect(screen.getByText('Gross Merchandise Value (Cents)')).toBeDefined();
    expect(screen.getByText('Rs. 125,000.00')).toBeDefined();
  });

  it('Triggers CSV download on clicking Download CSV button', async () => {
    (adminPlatformApi.getReport as any).mockResolvedValue({
      success: true,
      data: [{ status: 'OK' }],
      meta: { reportType: 'sales-velocity', recordCount: 1 },
    });

    (adminPlatformApi.downloadReportCsv as any).mockResolvedValue(undefined);

    render(
      <MemoryRouter>
        <AdminReportsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Download CSV/i)).toBeDefined();
    });

    fireEvent.click(screen.getByText(/Download CSV/i));

    await waitFor(() => {
      expect(adminPlatformApi.downloadReportCsv).toHaveBeenCalledWith(
        'sales-velocity',
        expect.anything()
      );
    });
  });

  it('Renders notification delivery telemetry with status distinction and retry button for failed dispatches', async () => {
    (adminPlatformApi.getAdminOperations as any).mockResolvedValue({
      success: true,
      data: [],
      meta: { pagination: { page: 1, limit: 20, total: 0, totalPages: 1 } },
    });

    (adminPlatformApi.getDeliveryHealth as any).mockResolvedValue({
      success: true,
      data: [
        {
          deliveryId: 'del_01',
          sourceModule: 'MOD-03',
          sourceEventName: 'ORDER_DISPATCHED',
          channel: 'EMAIL',
          templateId: 'tpl_order_dispatch',
          recipientAddress: 'c***@autodock.lk',
          status: 'FAILED',
          attemptCount: 3,
          lastAttemptAt: '2026-11-24T10:00:00.000Z',
          lastErrorCode: 'SMTP_TIMEOUT',
          lastErrorMessage: 'Mailbox host unreachable after 3 attempts',
        },
        {
          deliveryId: 'del_02',
          sourceModule: 'MOD-01',
          sourceEventName: 'SELLER_APPROVED',
          channel: 'EMAIL',
          templateId: 'tpl_seller_welcome',
          recipientAddress: 's***@autodock.lk',
          status: 'SENT',
          attemptCount: 1,
          lastAttemptAt: '2026-11-24T10:15:00.000Z',
        },
      ],
      meta: { pagination: { page: 1, limit: 20, total: 2, totalPages: 1 } },
    });

    (adminPlatformApi.retryDelivery as any).mockResolvedValue({
      success: true,
      message: 'Notification delivery has been enqueued for immediate retry',
      data: { deliveryId: 'del_01', status: 'RETRYING', attemptCount: 4 },
    });

    render(
      <MemoryRouter>
        <AdminNotificationsOperationsPage />
      </MemoryRouter>
    );

    // Switch to Delivery Health tab
    fireEvent.click(screen.getByText('Delivery Health & Retries'));

    await waitFor(() => {
      expect(screen.getByText('ORDER_DISPATCHED')).toBeDefined();
    });

    // Check status badges
    expect(screen.getByText('Permanent Failure')).toBeDefined();
    expect(screen.getByText('Provider Accepted')).toBeDefined();

    // Check masked recipient
    expect(screen.getByText('c***@autodock.lk')).toBeDefined();

    // Check retry button exists for failed dispatch
    expect(screen.getByText('Retry')).toBeDefined();

    // Trigger retry
    fireEvent.click(screen.getByText('Retry'));

    await waitFor(() => {
      expect(adminPlatformApi.retryDelivery).toHaveBeenCalledWith('del_01');
    });
  });
});
