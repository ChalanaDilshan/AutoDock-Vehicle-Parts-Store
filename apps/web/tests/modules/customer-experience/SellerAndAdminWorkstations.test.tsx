// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SellerProductsPage } from '../../../src/modules/customer-experience/pages/seller/SellerProductsPage.js';
import { SellerReviewsPage } from '../../../src/modules/customer-experience/pages/seller/SellerReviewsPage.js';
import { AdminReviewModerationPage } from '../../../src/modules/customer-experience/pages/admin/AdminReviewModerationPage.js';
import { AdminCataloguePage } from '../../../src/modules/customer-experience/pages/admin/AdminCataloguePage.js';
import {
  sellerProductsApi,
  reviewApi,
  taxonomyApi,
} from '../../../src/modules/customer-experience/api/customerExperienceApi.js';
import { sellerApi } from '../../../src/modules/identity/api/identityApi.js';

// Mock API
vi.mock('../../../src/modules/customer-experience/api/customerExperienceApi.js', async () => {
  const actual = await vi.importActual<any>('../../../src/modules/customer-experience/api/customerExperienceApi.js');
  return {
    ...actual,
    sellerProductsApi: {
      list: vi.fn(),
      getById: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      adjustStock: vi.fn(),
      updateStatus: vi.fn(),
      delete: vi.fn(),
      getReviews: vi.fn(),
    },
    reviewApi: {
      adminList: vi.fn(),
      adminModerate: vi.fn(),
    },
    taxonomyApi: {
      getCategories: vi.fn(),
      getBrands: vi.fn(),
      adminCreateCategory: vi.fn(),
      adminUpdateCategory: vi.fn(),
      adminCreateBrand: vi.fn(),
      adminUpdateBrand: vi.fn(),
    },
  };
});

vi.mock('../../../src/modules/identity/api/identityApi.js', async () => {
  return {
    sellerApi: {
      getMe: vi.fn(),
    },
  };
});

describe('MOD-02 Seller & Administrator Workstations Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Renders seller inventory dashboard and opens quick stock adjustment modal', async () => {
    vi.mocked(sellerApi.getMe).mockResolvedValueOnce({
      success: true,
      data: {
        sellerId: 's-1',
        businessName: 'Apex Motor Spares Colombo',
        storeSlug: 'apex-spares',
        sellerType: 'PHYSICAL_STORE',
        verificationStatus: 'APPROVED',
        isEligibleToSell: true,
        businessRegistrationNumber: 'PV-98765',
      } as any,
    });

    vi.mocked(sellerProductsApi.list).mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            _id: 'prod-01',
            name: 'Hydraulic Clutch Master Cylinder',
            sku: 'APX-CMC-01',
            priceInCents: 1850000,
            stock: 3,
            lowStockThreshold: 5,
            condition: 'NEW',
            status: 'ACTIVE',
            images: [],
          },
        ] as any,
        pagination: { total: 1, page: 1, limit: 50, pages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <SellerProductsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Hydraulic Clutch Master Cylinder')).toBeDefined();
    expect(screen.getByText('APX-CMC-01')).toBeDefined();
    expect(screen.getByText('Rs. 18,500.00')).toBeDefined();
    expect(screen.getByText('3 units')).toBeDefined();

    // Quick stock edit button
    const quickStockBtn = screen.getByTitle('Quick Stock Adjustment');
    fireEvent.click(quickStockBtn);

    expect(await screen.findByText('Quick Stock Update')).toBeDefined();
    expect(screen.getByRole('button', { name: /Update Stock/i })).toBeDefined();
  });

  it('Enforces read-only seller reviews table without edit/hide/delete controls (FR-PROD-010)', async () => {
    vi.mocked(sellerProductsApi.getReviews).mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            _id: 'rev-01',
            productId: { _id: 'prod-01', name: 'Original Front Shock Mount', sku: 'TY-SM-01' },
            userId: { _id: 'u-1', firstName: 'Roshan', lastName: 'Silva' },
            sellerId: 's-1',
            suborderId: 'sub-01',
            rating: 4,
            comment: 'Quality genuine mount. Vibration completely solved.',
            isVerifiedPurchase: true,
            moderationStatus: 'PUBLISHED',
            createdAt: new Date().toISOString(),
          },
        ] as any,
        pagination: { total: 1, page: 1, limit: 50, pages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <SellerReviewsPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Original Front Shock Mount')).toBeDefined();
    expect(screen.getByText('Quality genuine mount. Vibration completely solved.')).toBeDefined();
    expect(screen.getByText(/Marketplace Transparency Notice \(Read-Only Access\)/i)).toBeDefined();

    // Verify there are no edit or delete buttons on the seller page
    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /hide/i })).toBeNull();
  });

  it('Renders administrator review moderation workstation and requires reason to hide review', async () => {
    vi.mocked(reviewApi.adminList).mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            _id: 'rev-mod-01',
            productId: { _id: 'prod-01', name: 'Oil Filter Standard', sku: 'FLT-01' },
            userId: { _id: 'u-2', firstName: 'Dinesh', lastName: 'K' },
            sellerId: 's-1',
            suborderId: 'sub-02',
            rating: 1,
            comment: 'Commercial spam review promoting external website.',
            isVerifiedPurchase: true,
            moderationStatus: 'PUBLISHED',
            createdAt: new Date().toISOString(),
          },
        ] as any,
        pagination: { total: 1, page: 1, limit: 50, pages: 1 },
      },
    });

    render(
      <MemoryRouter>
        <AdminReviewModerationPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Oil Filter Standard')).toBeDefined();
    expect(screen.getByText('Commercial spam review promoting external website.')).toBeDefined();
    expect(screen.getByText('Published')).toBeDefined();

    // Click Hide button
    const hideBtn = screen.getByRole('button', { name: /Hide/i });
    fireEvent.click(hideBtn);

    // Verify dialog opens prompting for moderation reason
    expect(await screen.findByText('Hide Customer Review')).toBeDefined();
    expect(screen.getByText(/Moderation Justification Reason \*/i)).toBeDefined();

    const submitHideBtn = screen.getByRole('button', { name: /Confirm Hide/i });
    fireEvent.click(submitHideBtn);

    // Form prevents submission without reason
    expect(await screen.findByText(/A justification reason is mandatory when hiding a customer review/i)).toBeDefined();
  });

  it('Renders administrator catalogue management tabs for categories and brands', async () => {
    vi.mocked(taxonomyApi.getCategories).mockResolvedValueOnce({
      success: true,
      data: [
        { _id: 'cat-1', name: 'Engine Components', slug: 'engine', isActive: true, displayOrder: 1 },
      ],
    });
    vi.mocked(taxonomyApi.getBrands).mockResolvedValueOnce({
      success: true,
      data: [
        { _id: 'brd-1', name: 'Denso', slug: 'denso', countryOfOrigin: 'Japan', isActive: true },
      ],
    });

    render(
      <MemoryRouter>
        <AdminCataloguePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Engine Components')).toBeDefined();
    expect(screen.getByText('Top-Level')).toBeDefined();

    // Switch to Brands tab
    const brandsTab = screen.getByRole('button', { name: /Manufacturer Brands/i });
    fireEvent.click(brandsTab);

    expect(await screen.findByText('Denso')).toBeDefined();
    expect(screen.getByText('Japan')).toBeDefined();
  });
});
