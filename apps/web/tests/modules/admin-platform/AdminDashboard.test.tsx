// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminDashboardPage } from '../../../src/modules/admin-platform/pages/AdminDashboardPage.js';
import { adminPlatformApi, DashboardSummaryData } from '../../../src/modules/admin-platform/api/adminPlatformApi.js';

vi.mock('../../../src/modules/admin-platform/api/adminPlatformApi.js', () => ({
  adminPlatformApi: {
    getDashboardSummary: vi.fn(),
  },
}));

describe('MOD-05 Executive Administrator Dashboard Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockDashboardData: DashboardSummaryData = {
    overview: {
      grossMerchandiseValueInCents: 15450000, // Rs. 154,500.00
      logisticsRevenueInCents: 2450000,       // Rs. 24,500.00
      accruedCommissionInCents: 1545000,      // Rs. 15,450.00
      platformSubsidyLiabilityInCents: 350000, // Rs. 3,500.00
      totalMasterOrders: 42,
      totalMerchantSuborders: 78,
      activeRegisteredCustomers: 120,
      approvedSellers: 15,
      activeCatalogueProducts: 450,
    },
    actionQueues: {
      pendingSellerKYC: 4,
      pendingDeliveryProposals: 2,
      pendingBankPaymentSlips: 5,
      unpaidOverdueInvoices: 1,
      failedNotificationDeliveries: 3,
    },
    systemFreshness: {
      cachedAt: '2026-11-24T12:00:00.000Z',
      ttlSeconds: 60,
      moduleHealth: {
        MOD_01: 'ONLINE',
        MOD_02: 'ONLINE',
        MOD_03: 'ONLINE',
        MOD_04: 'ONLINE',
        MOD_05: 'ONLINE',
      },
    },
  };

  it('Renders executive dashboard KPIs with distinct master orders and suborders', async () => {
    (adminPlatformApi.getDashboardSummary as any).mockResolvedValue({
      success: true,
      data: mockDashboardData,
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    // Verify Title
    expect(screen.getByText('Executive Marketplace Workstation')).toBeDefined();

    // Wait for data load
    await waitFor(() => {
      expect(screen.getByText('Rs. 154,500.00')).toBeDefined();
    });

    // Check strict separation: Customer Master Orders vs Merchant Suborders
    expect(screen.getByText('Customer Master Orders')).toBeDefined();
    expect(screen.getByText('42')).toBeDefined();

    expect(screen.getByText('Merchant Suborders')).toBeDefined();
    expect(screen.getByText('78')).toBeDefined();

    // Check Suborder-to-Master Split Ratio (78 / 42 = 1.86x)
    expect(screen.getByText('1.86x')).toBeDefined();

    // Check Financials: Commission vs Platform Subsidy
    expect(screen.getByText('Rs. 15,450.00')).toBeDefined(); // Commission
    expect(screen.getByText('Rs. 3,500.00')).toBeDefined();  // Subsidy

    // Check Action Queues
    expect(screen.getByText('Seller KYC Verification')).toBeDefined();
    expect(screen.getByText('4')).toBeDefined();
    expect(screen.getByText('Rate Card Proposals')).toBeDefined();
    expect(screen.getByText('2')).toBeDefined();
    expect(screen.getByText('Bank Payment Slips')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('Failed Dispatches')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();

    // Verify Module Health status bar
    expect(screen.getByTestId('module-health-indicators')).toBeDefined();
    expect(screen.getByText('MOD-01')).toBeDefined();
    expect(screen.getByText('MOD-05')).toBeDefined();
  });

  it('Explicitly displays degraded status when a module data source is degraded without crashing dashboard', async () => {
    const degradedData: DashboardSummaryData = {
      ...mockDashboardData,
      systemFreshness: {
        ...mockDashboardData.systemFreshness,
        moduleHealth: {
          MOD_01: 'ONLINE',
          MOD_02: 'DEGRADED',
          MOD_03: 'DEGRADED',
          MOD_04: 'ONLINE',
          MOD_05: 'ONLINE',
        },
      },
    };

    (adminPlatformApi.getDashboardSummary as any).mockResolvedValue({
      success: true,
      data: degradedData,
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Degraded indicators rendered for affected cards
      const degradedBadges = screen.getAllByText('Source Unavailable');
      expect(degradedBadges.length).toBeGreaterThan(0);
    });

    // Non-degraded cards remain rendered
    expect(screen.getByText('Rs. 15,450.00')).toBeDefined(); // MOD-04 Commission still online
  });

  it('Triggers force refresh query on clicking Force Refresh button', async () => {
    (adminPlatformApi.getDashboardSummary as any).mockResolvedValue({
      success: true,
      data: mockDashboardData,
    });

    render(
      <MemoryRouter>
        <AdminDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Force Refresh')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Force Refresh'));

    await waitFor(() => {
      expect(adminPlatformApi.getDashboardSummary).toHaveBeenCalledWith(true);
    });
  });
});
