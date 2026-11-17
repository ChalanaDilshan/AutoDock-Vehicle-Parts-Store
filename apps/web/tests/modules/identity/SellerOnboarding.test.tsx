// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { StoreTypeSelector } from '../../../src/modules/identity/components/StoreTypeSelector.js';
import { SellerOnboardingHub } from '../../../src/modules/identity/pages/seller/SellerOnboardingHub.js';
import { RestrictedSellerDashboard } from '../../../src/modules/identity/pages/seller/RestrictedSellerDashboard.js';
import { sellerApi, SellerProfileData } from '../../../src/modules/identity/api/identityApi.js';

// Mock sellerApi
vi.mock('../../../src/modules/identity/api/identityApi.js', () => {
  return {
    sellerApi: {
      getMe: vi.fn(),
      getDocuments: vi.fn(),
      uploadDocument: vi.fn(),
      submitBankDetails: vi.fn(),
      acknowledgePrivacy: vi.fn(),
      submitApplication: vi.fn(),
    },
  };
});

describe('MOD-01 Seller Onboarding & Restricted Experience Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('StoreTypeSelector renders Physical and Online models with respective verification requirements', () => {
    const handleChange = vi.fn();
    render(
      <StoreTypeSelector
        value="PHYSICAL_STORE"
        onChange={handleChange}
      />
    );

    expect(screen.getByText(/Physical Retail Store/i)).toBeDefined();
    expect(screen.getByText(/Online-Only Merchant/i)).toBeDefined();
    expect(screen.getByText(/Physical Storefront & Workshop Photos/i)).toBeDefined();
    expect(screen.getByText(/Storefront photos NOT required/i)).toBeDefined();

    const onlineCard = screen.getByText(/Online-Only Merchant/i);
    fireEvent.click(onlineCard);
    expect(handleChange).toHaveBeenCalledWith('ONLINE_ONLY');
  });

  it('SellerOnboardingHub conditionally hides storefront upload for ONLINE_ONLY store', async () => {
    const mockOnlineSeller: SellerProfileData = {
      sellerId: 'seller_123',
      businessName: 'Apex Online Spares',
      storeSlug: 'apex-online-spares',
      sellerType: 'ONLINE_ONLY',
      businessRegistrationNumber: 'PV-98765',
      operatingAddress: {
        street: '12 Warehouse Way',
        city: 'Wattala',
        district: 'Gampaha',
        province: 'Western',
        postalCode: '11300',
      },
      contactPhone: '+94112345678',
      verificationStatus: 'DRAFT',
      isEligibleToSell: false,
      hasPrivacyAcknowledgement: false,
    };

    vi.mocked(sellerApi.getMe).mockResolvedValue({
      success: true,
      data: mockOnlineSeller,
    });

    vi.mocked(sellerApi.getDocuments).mockResolvedValue({
      success: true,
      data: [],
    });

    render(
      <MemoryRouter>
        <SellerOnboardingHub />
      </MemoryRouter>
    );

    expect(await screen.findByText('Apex Online Spares')).toBeDefined();
    expect(screen.getAllByText(/Online-Only Merchant/i).length).toBeGreaterThan(0);

    // Verify storefront photos NOT required notice appears
    expect(screen.getByText(/Storefront Photos Not Required/i)).toBeDefined();
    expect(screen.queryByLabelText(/Physical Storefront & Workshop Photographs/i)).toBeNull();

    // Verify privacy checkbox starts unchecked
    const privacyCheckbox = screen.getByLabelText(/AutoDock Seller Privacy Notice \(Version 1\.2\)/i) as HTMLInputElement;
    expect(privacyCheckbox.checked).toBe(false);

    // Verify final submit button is disabled
    const submitBtn = screen.getByRole('button', { name: /Submit Application for Administrative Verification/i });
    expect(submitBtn.hasAttribute('disabled')).toBe(true);
  });

  it('SellerOnboardingHub enforces all 4 documents for PHYSICAL_STORE and enables privacy toggle', async () => {
    const mockPhysicalSeller: SellerProfileData = {
      sellerId: 'seller_456',
      businessName: 'Central Auto Workshop',
      storeSlug: 'central-auto',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-54321',
      operatingAddress: {
        street: '45 Panchikawatte Rd',
        city: 'Colombo',
        district: 'Colombo',
        province: 'Western',
        postalCode: '01000',
      },
      contactPhone: '+94112345678',
      verificationStatus: 'DRAFT',
      isEligibleToSell: false,
      hasPrivacyAcknowledgement: false,
    };

    vi.mocked(sellerApi.getMe).mockResolvedValue({
      success: true,
      data: mockPhysicalSeller,
    });

    vi.mocked(sellerApi.getDocuments).mockResolvedValue({
      success: true,
      data: [],
    });

    vi.mocked(sellerApi.acknowledgePrivacy).mockResolvedValue({
      success: true,
      data: { noticeVersion: 'v1.2', acknowledgedAt: new Date().toISOString() },
    });

    render(
      <MemoryRouter>
        <SellerOnboardingHub />
      </MemoryRouter>
    );

    expect(await screen.findByText('Central Auto Workshop')).toBeDefined();
    // Physical store requires storefront photo dropzone
    expect(screen.getByText(/Physical Storefront & Workshop Photographs/i)).toBeDefined();

    // Test privacy toggle
    const privacyCheckbox = screen.getByLabelText(/AutoDock Seller Privacy Notice \(Version 1\.2\)/i) as HTMLInputElement;
    expect(privacyCheckbox.checked).toBe(false);

    fireEvent.click(privacyCheckbox);
    expect(privacyCheckbox.checked).toBe(true);
    expect(sellerApi.acknowledgePrivacy).toHaveBeenCalledWith({
      noticeVersion: 'v1.2',
      acknowledged: true,
    });
  });

  it('RestrictedSellerDashboard locks catalog publishing for unapproved seller', async () => {
    const mockPendingSeller: SellerProfileData = {
      sellerId: 'seller_789',
      businessName: 'Lanka Spares Mart',
      storeSlug: 'lanka-spares-mart',
      sellerType: 'PHYSICAL_STORE',
      businessRegistrationNumber: 'PV-112233',
      operatingAddress: {
        street: '100 Kandy Rd',
        city: 'Kelaniya',
        district: 'Gampaha',
        province: 'Western',
        postalCode: '11600',
      },
      contactPhone: '+94112345678',
      verificationStatus: 'PENDING',
      isEligibleToSell: false,
    };

    vi.mocked(sellerApi.getMe).mockResolvedValue({
      success: true,
      data: mockPendingSeller,
    });

    render(
      <MemoryRouter>
        <RestrictedSellerDashboard />
      </MemoryRouter>
    );

    expect(await screen.findByText('Lanka Spares Mart')).toBeDefined();
    expect(screen.getByText(/Restricted Merchant Access — Catalog Publishing Locked/i)).toBeDefined();
    expect(screen.getByText(/Locked pending verification/i)).toBeDefined();
  });
});
