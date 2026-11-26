// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { SellOnAutoDockPage } from '../../../src/modules/identity/pages/seller/SellOnAutoDockPage.js';
import { SellerRegisterStep1Page } from '../../../src/modules/identity/pages/seller/SellerRegisterStep1Page.js';
import { identityRoutes } from '../../../src/modules/identity/routes.js';
import { sellerApi } from '../../../src/modules/identity/api/identityApi.js';
import { SRI_LANKA_DISTRICTS } from '../../../src/modules/identity/constants/sriLankaLocations.js';

const mockUseAuth = vi.fn();

vi.mock('../../../src/modules/identity/context/AuthContext.js', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../src/modules/identity/api/identityApi.js', () => ({
  sellerApi: {
    registerProfile: vi.fn(),
    getMe: vi.fn(),
  },
}));

describe('MOD-01 Sell on AutoDock Landing & Step 1 Registration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('defines /seller/register and /sellers/register in identityRoutes without 404', () => {
    const paths = identityRoutes.map((r) => r.path);
    expect(paths).toContain('seller/register');
    expect(paths).toContain('sellers/register');
  });

  it('SellOnAutoDockPage renders guest CTAs, onboarding steps, comparison, and factual settlement summary', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/seller/register']}>
        <Routes>
          <Route path="/seller/register" element={<SellOnAutoDockPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(
      screen.getByRole('heading', { name: /Sell Vehicle Spare Parts on AutoDock/i })
    ).toBeDefined();

    const signInLinks = screen.getAllByRole('link', { name: /Sign In to Register Store/i });
    expect(signInLinks[0].getAttribute('href')).toBe('/login?next=/sellers/register');

    const registerLink = screen.getByRole('link', { name: /Create AutoDock Account/i });
    expect(registerLink.getAttribute('href')).toBe('/register?next=/sellers/register');

    // Operating model comparison
    expect(screen.getByText('Physical Store')).toBeDefined();
    expect(screen.getByText('Online-Only Merchant')).toBeDefined();
    expect(screen.getByText(/WhatsApp video call/i)).toBeDefined();

    // 4-step process
    expect(screen.getByText(/4-Step Onboarding Process/i)).toBeDefined();
    expect(screen.getByText(/Direct-to-Seller Bank Transfers/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /Read Privacy Policy/i }).getAttribute('href')).toBe(
      '/privacy-policy'
    );
  });

  it('SellOnAutoDockPage renders role-aware CTAs for CUSTOMER, SELLER, and ADMIN', async () => {
    // 1. Logged-in CUSTOMER without sellerId
    mockUseAuth.mockReturnValue({
      user: {
        id: 'c1',
        role: 'CUSTOMER',
        sellerId: null,
      },
      isAuthenticated: true,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    const { unmount } = render(
      <MemoryRouter>
        <SellOnAutoDockPage />
      </MemoryRouter>
    );

    const startLinks = screen.getAllByRole('link', { name: /Start Store Registration/i });
    expect(startLinks[0].getAttribute('href')).toBe('/sellers/register');
    unmount();

    // 2. Logged-in SELLER in DRAFT state -> Continue Store Onboarding
    mockUseAuth.mockReturnValue({
      user: {
        id: 's1',
        role: 'SELLER',
        sellerId: 'seller_1',
      },
      isAuthenticated: true,
      isLoading: false,
      refreshProfile: vi.fn(),
    });
    vi.mocked(sellerApi.getMe).mockResolvedValueOnce({
      success: true,
      data: {
        sellerId: 'seller_1',
        businessName: 'Auto Spares',
        storeSlug: 'auto-spares',
        sellerType: 'ONLINE_ONLY',
        businessRegistrationNumber: 'PV-100',
        operatingAddress: {
          street: '10 Main St',
          city: 'Colombo',
          district: 'Colombo',
          province: 'Western',
          postalCode: '00100',
        },
        contactPhone: '+94112345678',
        verificationStatus: 'DRAFT',
        isEligibleToSell: false,
      },
    });

    const draftView = render(
      <MemoryRouter>
        <SellOnAutoDockPage />
      </MemoryRouter>
    );

    const onboardingLinks = await screen.findAllByRole('link', {
      name: /Continue Store Onboarding/i,
    });
    expect(onboardingLinks[0].getAttribute('href')).toBe('/seller/onboarding');
    draftView.unmount();

    // 3. Logged-in SELLER in APPROVED state -> Open Seller Portal
    vi.mocked(sellerApi.getMe).mockResolvedValueOnce({
      success: true,
      data: {
        sellerId: 'seller_1',
        businessName: 'Auto Spares',
        storeSlug: 'auto-spares',
        sellerType: 'ONLINE_ONLY',
        businessRegistrationNumber: 'PV-100',
        operatingAddress: {
          street: '10 Main St',
          city: 'Colombo',
          district: 'Colombo',
          province: 'Western',
          postalCode: '00100',
        },
        contactPhone: '+94112345678',
        verificationStatus: 'APPROVED',
        isEligibleToSell: true,
      },
    });

    const approvedView = render(
      <MemoryRouter>
        <SellOnAutoDockPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      const portalLinks = screen.getAllByRole('link', { name: /Open Seller Portal/i });
      expect(portalLinks[0].getAttribute('href')).toBe('/seller/dashboard');
    });
    approvedView.unmount();

    // 4. Logged-in ADMIN -> Open Seller Verification Queue
    mockUseAuth.mockReturnValue({
      user: {
        id: 'a1',
        role: 'ADMIN',
        sellerId: null,
      },
      isAuthenticated: true,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter>
        <SellOnAutoDockPage />
      </MemoryRouter>
    );

    expect(
      screen.getByRole('link', { name: /Open Seller Verification Queue/i }).getAttribute('href')
    ).toBe('/admin/sellers/verification');
  });

  it('SellerRegisterStep1Page blocks unauthenticated visitors with Sign In and Create Account CTAs', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    render(
      <MemoryRouter initialEntries={['/sellers/register']}>
        <SellerRegisterStep1Page />
      </MemoryRouter>
    );

    expect(
      screen.getByText(/You need an AutoDock account to register as a seller\./i)
    ).toBeDefined();
    expect(screen.getByRole('link', { name: /^Sign In$/i }).getAttribute('href')).toBe(
      '/login?next=/sellers/register'
    );
    expect(screen.getByRole('link', { name: /Create Account/i }).getAttribute('href')).toBe(
      '/register?next=/sellers/register'
    );
    expect(screen.queryByLabelText(/Registered Business Name/i)).toBeNull();
  });

  it('SellerRegisterStep1Page redirects existing SELLER to onboarding or dashboard', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: 's1',
        role: 'SELLER',
        sellerId: 'seller_1',
      },
      isAuthenticated: true,
      isLoading: false,
      refreshProfile: vi.fn(),
    });

    vi.mocked(sellerApi.getMe).mockResolvedValueOnce({
      success: true,
      data: {
        sellerId: 'seller_1',
        businessName: 'Auto Spares',
        storeSlug: 'auto-spares',
        sellerType: 'ONLINE_ONLY',
        businessRegistrationNumber: 'PV-100',
        operatingAddress: {
          street: '10 Main St',
          city: 'Colombo',
          district: 'Colombo',
          province: 'Western',
          postalCode: '00100',
        },
        contactPhone: '+94112345678',
        verificationStatus: 'DRAFT',
        isEligibleToSell: false,
      },
    });

    render(
      <MemoryRouter initialEntries={['/sellers/register']}>
        <Routes>
          <Route path="/sellers/register" element={<SellerRegisterStep1Page />} />
          <Route path="/seller/onboarding" element={<div>Onboarding Destination</div>} />
          <Route path="/seller/dashboard" element={<div>Dashboard Destination</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Onboarding Destination')).toBeDefined();
  });

  it('SellerRegisterStep1Page normalizes phone numbers, validates inline, and provides 25 Sri Lankan districts', async () => {
    const mockRefreshProfile = vi.fn().mockResolvedValue(undefined);
    mockUseAuth.mockReturnValue({
      user: {
        id: 'c1',
        role: 'CUSTOMER',
        sellerId: null,
      },
      isAuthenticated: true,
      isLoading: false,
      refreshProfile: mockRefreshProfile,
    });

    vi.mocked(sellerApi.registerProfile).mockResolvedValueOnce({
      success: true,
      data: {
        sellerId: 'seller_new',
        storeSlug: 'kandy-brake-masters',
        sellerType: 'PHYSICAL_STORE',
        verificationStatus: 'DRAFT',
      },
    });

    render(
      <MemoryRouter initialEntries={['/sellers/register']}>
        <Routes>
          <Route path="/sellers/register" element={<SellerRegisterStep1Page />} />
          <Route path="/seller/onboarding" element={<div>Onboarding Hub Destination</div>} />
        </Routes>
      </MemoryRouter>
    );

    // 25 Sri Lanka districts check
    const districtSelect = screen.getByLabelText(/District/i) as HTMLSelectElement;
    expect(districtSelect.options.length).toBe(SRI_LANKA_DISTRICTS.length);
    expect(SRI_LANKA_DISTRICTS.length).toBe(25);

    fireEvent.change(districtSelect, { target: { value: 'Kandy' } });
    const provinceSelect = screen.getByLabelText(/Province/i) as HTMLSelectElement;
    expect(provinceSelect.value).toBe('Central');

    fireEvent.change(screen.getByLabelText(/Registered Business Name/i), {
      target: { value: 'Kandy Brake Masters' },
    });
    fireEvent.change(screen.getByLabelText(/Business Registration Number/i), {
      target: { value: 'PV-55667' },
    });
    fireEvent.change(screen.getByLabelText(/Street Address/i), {
      target: { value: '25 Colombo Street' },
    });
    fireEvent.change(screen.getByLabelText(/^City/i), {
      target: { value: 'Kandy' },
    });

    // Invalid phone triggers inline error
    fireEvent.change(screen.getByLabelText(/Business Contact Phone/i), {
      target: { value: '0771234567' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue to Document Verification/i }));

    expect(
      await screen.findByText(/Contact phone must follow Sri Lankan E\.164 format: \+94XXXXXXXXX/i)
    ).toBeDefined();
    expect(sellerApi.registerProfile).not.toHaveBeenCalled();

    // Spaced/dashed +94 phone normalizes cleanly before submission
    fireEvent.change(screen.getByLabelText(/Business Contact Phone/i), {
      target: { value: '+94 77 123-4567' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue to Document Verification/i }));

    await waitFor(() => {
      expect(sellerApi.registerProfile).toHaveBeenCalledWith({
        businessName: 'Kandy Brake Masters',
        storeSlug: 'kandy-brake-masters',
        sellerType: 'PHYSICAL_STORE',
        businessRegistrationNumber: 'PV-55667',
        contactPhone: '+94771234567',
        operatingAddress: {
          street: '25 Colombo Street',
          city: 'Kandy',
          district: 'Kandy',
          province: 'Central',
          postalCode: '00100',
        },
      });
    });

    expect(await screen.findByText('Onboarding Hub Destination')).toBeDefined();
  });
});
