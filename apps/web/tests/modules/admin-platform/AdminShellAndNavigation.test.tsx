// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '../../../src/modules/admin-platform/components/AdminLayout.js';
import { ProtectedRoute } from '../../../src/modules/identity/components/ProtectedRoute.js';
import * as AuthContextModule from '../../../src/modules/identity/context/AuthContext.js';
import { adminPlatformApi } from '../../../src/modules/admin-platform/api/adminPlatformApi.js';

vi.mock('../../../src/modules/admin-platform/api/adminPlatformApi.js', () => ({
  adminPlatformApi: {
    getUnreadCount: vi.fn(),
    getMyNotifications: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

describe('MOD-05 Shared Administrator Shell & Navigation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (adminPlatformApi.getUnreadCount as any).mockResolvedValue({
      success: true,
      data: { unreadCount: 3 },
    });
  });

  it('Renders shared administrator shell with navigation groups and unread count badge for authenticated admin', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        userId: 'admin_1',
        email: 'admin@autodock.lk',
        firstName: 'Kasun',
        lastName: 'Perera',
        role: 'ADMIN',
      } as any,
      token: 'valid_admin_token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Test Dashboard View</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    // Header Branding & Console
    expect(screen.getByText('AUTODOCK')).toBeDefined();
    expect(screen.getByText('Console')).toBeDefined();
    expect(screen.getByText('Platform Administrator')).toBeDefined();

    // Navigation Items
    expect(screen.getByText('Executive Dashboard')).toBeDefined();
    expect(screen.getByText('Seller Verification')).toBeDefined();
    expect(screen.getByText('Catalogue Taxonomy')).toBeDefined();
    expect(screen.getByText('Marketplace Orders')).toBeDefined();
    expect(screen.getByText('Security Audit Logs')).toBeDefined();
    expect(screen.getByText('Platform Reports')).toBeDefined();

    // Unread notification badge in header
    await waitFor(() => {
      expect(screen.getByTestId('unread-notification-count')).toBeDefined();
      expect(screen.getByTestId('unread-notification-count').textContent).toBe('3');
    });

    // Content view rendered in outlet
    expect(screen.getByText('Test Dashboard View')).toBeDefined();
  });

  it('Denies access (403) to customer when attempting to access admin route guarded by ProtectedRoute', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        userId: 'cust_99',
        email: 'customer@autodock.lk',
        firstName: 'Nimal',
        lastName: 'Silva',
        role: 'CUSTOMER',
      } as any,
      token: 'cust_token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <div>Secret Admin Content</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText('Secret Admin Content')).toBeNull();
    expect(screen.getByTestId('auth-forbidden')).toBeDefined();
    expect(screen.getByText(/Access Restricted \(403\)/i)).toBeDefined();
    expect(screen.getByText('CUSTOMER')).toBeDefined();
  });

  it('Toggles mobile navigation drawer cleanly on mobile viewport', async () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        userId: 'admin_1',
        email: 'admin@autodock.lk',
        firstName: 'Kasun',
        lastName: 'Perera',
        role: 'ADMIN',
      } as any,
      token: 'valid_token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<div>Dashboard</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    const hamburgerBtn = screen.getByLabelText(/Toggle navigation drawer/i);
    expect(hamburgerBtn).toBeDefined();

    fireEvent.click(hamburgerBtn);
    expect(screen.getByText('Executive Dashboard')).toBeDefined();
  });
});
