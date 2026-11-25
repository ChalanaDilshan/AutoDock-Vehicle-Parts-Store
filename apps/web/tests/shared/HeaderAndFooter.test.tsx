// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Header, Footer, Layout } from '../../src/shared/components/index.js';

const mockUseAuth = vi.fn();

vi.mock('../../src/modules/identity/context/AuthContext.js', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../src/modules/admin-platform/components/NotificationBell.js', () => ({
  NotificationBell: () => <div data-testid="notification-bell">Bell</div>,
}));

vi.mock('../../src/modules/admin-platform/components/AdminLayout.js', () => ({
  AdminLayout: () => <div data-testid="admin-layout">Admin Layout</div>,
}));

describe('Extracted Header, Footer & Layout Components', () => {
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      logout: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  describe('Header', () => {
    it('renders brand logo, guest navigation links, and search bar', () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      expect(screen.getByText('AUTO')).toBeDefined();
      expect(screen.getByText('DOCK')).toBeDefined();
      expect(screen.getByText('Parts Catalog')).toBeDefined();
      expect(screen.getByText('My Garage')).toBeDefined();
      expect(screen.getByText('Sell on AutoDock')).toBeDefined();
      expect(screen.getByText('Sign In')).toBeDefined();
      expect(screen.getByText('Register')).toBeDefined();
      expect(screen.getByTestId('notification-bell')).toBeDefined();
      expect(screen.getByLabelText('Wishlist')).toBeDefined();
      expect(screen.getByLabelText('Shopping Cart')).toBeDefined();
    });

    it('submits desktop search and navigates to /products with query param', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Header />
          <Routes>
            <Route path="/" element={<div>Home</div>} />
            <Route path="/products" element={<div data-testid="products-route">Products Page</div>} />
          </Routes>
        </MemoryRouter>
      );

      const searchInput = screen.getByLabelText('Search parts') as HTMLInputElement;
      fireEvent.change(searchInput, { target: { value: 'Brake Pad' } });
      fireEvent.submit(searchInput.closest('form')!);

      expect(screen.getByTestId('products-route')).toBeDefined();
    });

    it('renders authenticated CUSTOMER links and calls logout on Sign Out', async () => {
      const mockLogout = vi.fn().mockResolvedValue(undefined);
      mockUseAuth.mockReturnValue({
        user: { firstName: 'Iniyavan', lastName: 'K', role: 'CUSTOMER' },
        isAuthenticated: true,
        logout: mockLogout,
      });

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      expect(screen.getByText('Iniyavan')).toBeDefined();
      expect(screen.getByText('CUSTOMER')).toBeDefined();
      expect(screen.getByText('My Orders')).toBeDefined();

      const signOutBtn = screen.getByLabelText('Sign Out');
      fireEvent.click(signOutBtn);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('renders SELLER role-based navigation links', () => {
      mockUseAuth.mockReturnValue({
        user: { firstName: 'Kamal', lastName: 'S', role: 'SELLER' },
        isAuthenticated: true,
        logout: vi.fn(),
      });

      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      expect(screen.getByText('Seller Portal')).toBeDefined();
      expect(screen.getByText('Inventory')).toBeDefined();
      expect(screen.getByText('Promos')).toBeDefined();
    });

    it('toggles mobile navigation drawer when menu button is clicked', () => {
      render(
        <MemoryRouter>
          <Header />
        </MemoryRouter>
      );

      expect(screen.queryByLabelText('Mobile search parts')).toBeNull();

      const toggleBtn = screen.getByLabelText('Toggle Navigation Menu');
      fireEvent.click(toggleBtn);

      expect(screen.getByLabelText('Mobile search parts')).toBeDefined();
      expect(toggleBtn.getAttribute('aria-expanded')).toBe('true');

      fireEvent.click(toggleBtn);
      expect(screen.queryByLabelText('Mobile search parts')).toBeNull();
    });
  });

  describe('Footer', () => {
    it('renders all 4 footer columns, links, and payment badges', () => {
      render(
        <MemoryRouter>
          <Footer />
        </MemoryRouter>
      );

      expect(screen.getByText('AutoDock')).toBeDefined();
      expect(screen.getByText('Engine & Drivetrain')).toBeDefined();
      expect(screen.getByText('Brakes & Suspension')).toBeDefined();
      expect(screen.getByText('My Garage')).toBeDefined();
      expect(screen.getByText('Track Orders')).toBeDefined();
      expect(screen.getByText('Privacy Policy')).toBeDefined();
      expect(screen.getByText('Sell on AutoDock')).toBeDefined();
      expect(screen.getByText('Cash on Delivery')).toBeDefined();
      expect(screen.getByText('Bank Deposit')).toBeDefined();
      expect(screen.getByText('Cards')).toBeDefined();
    });
  });

  describe('Layout', () => {
    it('renders Header, Outlet content, and Footer for storefront routes', () => {
      render(
        <MemoryRouter initialEntries={['/']}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<div data-testid="outlet-content">Storefront Home</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText('AUTO')).toBeDefined();
      expect(screen.getByTestId('outlet-content')).toBeDefined();
      expect(screen.getByText('Cash on Delivery')).toBeDefined();
    });

    it('renders AdminLayout for /admin routes', () => {
      render(
        <MemoryRouter initialEntries={['/admin/dashboard']}>
          <Routes>
            <Route path="/admin/*" element={<Layout />} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByTestId('admin-layout')).toBeDefined();
    });
  });
});
