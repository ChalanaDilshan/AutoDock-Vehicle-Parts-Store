// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminAuditExplorerPage } from '../../../src/modules/admin-platform/pages/AdminAuditExplorerPage.js';
import { adminPlatformApi, AuditLogItem, AuditDetailItem } from '../../../src/modules/admin-platform/api/adminPlatformApi.js';

vi.mock('../../../src/modules/admin-platform/api/adminPlatformApi.js', () => ({
  adminPlatformApi: {
    searchAuditLogs: vi.fn(),
    getAuditLogById: vi.fn(),
  },
}));

describe('MOD-05 Security & Compliance Audit Explorer Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAuditLogs: AuditLogItem[] = [
    {
      id: 'audit_101',
      action: 'SELLER_VERIFICATION_APPROVED',
      sourceModule: 'MOD-01',
      severity: 'HIGH',
      actor: {
        actorId: 'adm_1',
        actorRole: 'ADMIN',
        email: 'compliance@autodock.lk',
        ipAddress: '192.168.1.50',
      },
      targetEntity: {
        entityType: 'SELLER_PROFILE',
        entityId: 'sel_99',
        publicReference: 'Colombo Auto Spares',
      },
      reason: 'Physical inspection completed with valid trade license',
      timestamp: '2026-11-24T08:15:00.000Z',
    },
    {
      id: 'audit_102',
      action: 'RATE_PROPOSAL_APPROVED',
      sourceModule: 'MOD-03',
      severity: 'MEDIUM',
      actor: {
        actorId: 'adm_2',
        actorRole: 'ADMIN',
        email: 'logistics@autodock.lk',
      },
      targetEntity: {
        entityType: 'DELIVERY_RATE',
        entityId: 'rate_55',
      },
      timestamp: '2026-11-24T09:20:00.000Z',
    },
  ];

  const mockDetailLog: AuditDetailItem = {
    ...mockAuditLogs[0],
    requestId: 'req_xyz_123',
    correlationId: 'corr_abc_456',
    delta: [
      {
        field: 'verificationStatus',
        oldValue: 'PENDING',
        newValue: 'APPROVED',
      },
      {
        field: 'isEligibleToSell',
        oldValue: false,
        newValue: true,
      },
    ],
  };

  it('Renders audit search workstation with server-side logs and read-only badge', async () => {
    (adminPlatformApi.searchAuditLogs as any).mockResolvedValue({
      success: true,
      data: mockAuditLogs,
      meta: {
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <AdminAuditExplorerPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Security & Compliance Audit Explorer')).toBeDefined();
    expect(screen.getByText('Read-Only')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('SELLER_VERIFICATION_APPROVED')).toBeDefined();
    });

    expect(screen.getByText('MOD-01')).toBeDefined();
    expect(screen.getByText('HIGH')).toBeDefined();
    expect(screen.getByText('RATE_PROPOSAL_APPROVED')).toBeDefined();
    expect(screen.getByText('MOD-03')).toBeDefined();

    // Verify Read-Only Integrity: NO delete or edit controls exist
    expect(screen.queryByText(/delete/i)).toBeNull();
    expect(screen.queryByText(/edit/i)).toBeNull();
    expect(screen.queryByText(/remove/i)).toBeNull();
  });

  it('Opens immutable audit detail modal displaying before/after field deltas', async () => {
    (adminPlatformApi.searchAuditLogs as any).mockResolvedValue({
      success: true,
      data: mockAuditLogs,
      meta: {
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
    });

    (adminPlatformApi.getAuditLogById as any).mockResolvedValue({
      success: true,
      data: mockDetailLog,
    });

    render(
      <MemoryRouter>
        <AdminAuditExplorerPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText('View').length).toBe(2);
    });

    fireEvent.click(screen.getAllByText('View')[0]);

    await waitFor(() => {
      expect(screen.getByText('Audit Event Detail')).toBeDefined();
    });

    // Verify modal contents
    expect(screen.getByText(/immutable audit entry/i)).toBeDefined();
    expect(screen.getByText('verificationStatus')).toBeDefined();
    expect(screen.getByText('PENDING')).toBeDefined();
    expect(screen.getByText('APPROVED')).toBeDefined();
    expect(screen.getByText('Physical inspection completed with valid trade license')).toBeDefined();

    // Close modal
    fireEvent.click(screen.getByText('Close Detail'));
    await waitFor(() => {
      expect(screen.queryByText('Audit Event Detail')).toBeNull();
    });
  });
});
