// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { NotificationsPage } from '../../../src/modules/admin-platform/pages/NotificationsPage.js';
import { adminPlatformApi, NotificationItem } from '../../../src/modules/admin-platform/api/adminPlatformApi.js';

vi.mock('../../../src/modules/admin-platform/api/adminPlatformApi.js', () => ({
  adminPlatformApi: {
    getMyNotifications: vi.fn(),
    getUnreadCount: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
  },
}));

describe('MOD-05 In-App Notification Centre Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockNotifications: NotificationItem[] = [
    {
      id: 'notif_01',
      title: 'Order Dispatch Notice',
      message: 'Your brake pads order #OD-1001 has been dispatched.',
      category: 'ORDER',
      priority: 'HIGH',
      isRead: false,
      actionUrl: '/orders/OD-1001',
      createdAt: '2026-11-24T10:30:00.000Z',
    },
    {
      id: 'notif_02',
      title: 'Bank Payment Slip Verified',
      message: 'Deposit slip for suborder #SUB-2001 approved.',
      category: 'PAYMENT',
      priority: 'NORMAL',
      isRead: true,
      readAt: '2026-11-24T11:00:00.000Z',
      actionUrl: '/orders/suborders/SUB-2001',
      createdAt: '2026-11-24T09:00:00.000Z',
    },
  ];

  it('Renders user notifications with unread badge and category pills', async () => {
    (adminPlatformApi.getMyNotifications as any).mockResolvedValue({
      success: true,
      data: mockNotifications,
      meta: {
        unreadCount: 1,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    // Title and unread count badge
    expect(screen.getByText('Notification Centre')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Order Dispatch Notice')).toBeDefined();
    });

    expect(screen.getByText('1 Unread')).toBeDefined();
    expect(screen.getByText('Bank Payment Slip Verified')).toBeDefined();
    expect(screen.getByText('ORDER')).toBeDefined();
    expect(screen.getByText('PAYMENT')).toBeDefined();

    // Check action link
    const actionLinks = screen.getAllByText('Open Related Item');
    expect(actionLinks.length).toBe(2);
  });

  it('Allows marking a single unread notification as read', async () => {
    (adminPlatformApi.getMyNotifications as any).mockResolvedValue({
      success: true,
      data: mockNotifications,
      meta: {
        unreadCount: 1,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
    });

    (adminPlatformApi.markAsRead as any).mockResolvedValue({
      success: true,
      data: { id: 'notif_01', isRead: true, readAt: '2026-11-24T12:00:00.000Z' },
    });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mark Read')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Mark Read'));

    await waitFor(() => {
      expect(adminPlatformApi.markAsRead).toHaveBeenCalledWith('notif_01');
    });
  });

  it('Allows marking all notifications as read in one batch action', async () => {
    (adminPlatformApi.getMyNotifications as any).mockResolvedValue({
      success: true,
      data: mockNotifications,
      meta: {
        unreadCount: 1,
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
    });

    (adminPlatformApi.markAllAsRead as any).mockResolvedValue({
      success: true,
      data: { modifiedCount: 1 },
    });

    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Mark All as Read')).toBeDefined();
    });

    fireEvent.click(screen.getByText('Mark All as Read'));

    await waitFor(() => {
      expect(adminPlatformApi.markAllAsRead).toHaveBeenCalled();
    });
  });
});
