// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProductListingPage } from '../../../src/modules/customer-experience/pages/ProductListingPage.js';
import { ProductDetailPage } from '../../../src/modules/customer-experience/pages/ProductDetailPage.js';
import { productsApi, taxonomyApi, garageApi } from '../../../src/modules/customer-experience/api/customerExperienceApi.js';
import { AuthProvider } from '../../../src/modules/identity/context/AuthContext.js';

// Mock API
vi.mock('../../../src/modules/customer-experience/api/customerExperienceApi.js', async () => {
  const actual = await vi.importActual<any>('../../../src/modules/customer-experience/api/customerExperienceApi.js');
  return {
    ...actual,
    productsApi: {
      search: vi.fn(),
      getById: vi.fn(),
      checkFitment: vi.fn(),
      getReviews: vi.fn(),
      getRecommendations: vi.fn(),
    },
    taxonomyApi: {
      getCategories: vi.fn(),
      getBrands: vi.fn(),
      getMakes: vi.fn(),
      getModels: vi.fn(),
    },
    garageApi: {
      getVehicles: vi.fn(),
    },
    cartApi: {
      addItem: vi.fn(),
    },
    wishlistApi: {
      addItem: vi.fn(),
    },
  };
});

const mockProducts = [
  {
    _id: 'prod-001',
    name: 'Front Brake Pads Ceramic',
    sku: 'BRK-CER-01',
    description: 'High performance ceramic composite brake pads.',
    priceInCents: 1250000, // Rs. 12,500.00
    stock: 15,
    condition: 'NEW',
    status: 'ACTIVE',
    averageRating: 4.8,
    reviewCount: 6,
    isUniversalFit: false,
    brandId: { _id: 'b-1', name: 'Brembo' },
    categoryId: { _id: 'c-1', name: 'Brakes' },
    images: [{ url: 'https://example.com/pads.jpg', isPrimary: true }],
    specifications: { Material: 'Ceramic', Position: 'Front' },
  },
  {
    _id: 'prod-002',
    name: 'Universal Oil Filter Wrench',
    sku: 'TLS-WRENCH-02',
    description: 'Adjustable steel strap filter wrench.',
    priceInCents: 350000, // Rs. 3,500.00
    stock: 25,
    condition: 'NEW',
    status: 'ACTIVE',
    averageRating: 5.0,
    reviewCount: 2,
    isUniversalFit: true,
    brandId: { _id: 'b-2', name: 'Bosch' },
    categoryId: { _id: 'c-2', name: 'Tools' },
    images: [{ url: 'https://example.com/wrench.jpg', isPrimary: true }],
    specifications: { Material: 'Alloy Steel' },
  },
];

describe('MOD-02 Product Browsing & Details Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(taxonomyApi.getCategories).mockResolvedValue({
      success: true,
      data: [{ _id: 'c-1', name: 'Brakes', slug: 'brakes', isActive: true, displayOrder: 1 }],
    });
    vi.mocked(taxonomyApi.getBrands).mockResolvedValue({
      success: true,
      data: [{ _id: 'b-1', name: 'Brembo', slug: 'brembo', isActive: true }],
    });
    vi.mocked(taxonomyApi.getMakes).mockResolvedValue({
      success: true,
      data: ['Toyota', 'Honda'],
    });
    vi.mocked(garageApi.getVehicles).mockResolvedValue({
      success: true,
      data: { vehicles: [] },
    });
  });

  it('Renders product listing page with faceted filters and catalogue items', async () => {
    vi.mocked(productsApi.search).mockResolvedValueOnce({
      success: true,
      data: {
        items: mockProducts as any,
        pagination: { total: 2, page: 1, limit: 12, pages: 1 },
      },
    });

    render(
      <MemoryRouter initialEntries={['/products']}>
        <AuthProvider>
          <ProductListingPage />
        </AuthProvider>
      </MemoryRouter>
    );

    expect((await screen.findAllByText('Front Brake Pads Ceramic')).length).toBeGreaterThan(0);
    expect(screen.getByText('Universal Oil Filter Wrench')).toBeDefined();
    expect(screen.getByText(/2 parts found/i)).toBeDefined();

    // Verify LKR price format
    expect(screen.getByText('Rs. 12,500.00')).toBeDefined();
    expect(screen.getByText('Rs. 3,500.00')).toBeDefined();

    // Verify sort allowlist
    const sortSelect = screen.getByRole('combobox');
    expect(sortSelect).toBeDefined();
    expect(screen.getByText('Sort: Relevance')).toBeDefined();
  });

  it('Renders product detail page with technical specs, fitment banner and Add-To-Cart box', async () => {
    vi.mocked(productsApi.getById).mockResolvedValueOnce({
      success: true,
      data: mockProducts[0] as any,
    });
    vi.mocked(productsApi.getReviews).mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            _id: 'rev-1',
            productId: 'prod-001',
            userId: { _id: 'u-1', firstName: 'Kavinda', lastName: 'P.' },
            sellerId: 's-1',
            suborderId: 'sub-1',
            rating: 5,
            comment: 'Fitted perfectly on my 2018 Corolla. Excellent braking response.',
            isVerifiedPurchase: true,
            moderationStatus: 'PUBLISHED',
            createdAt: new Date().toISOString(),
          },
        ] as any,
        pagination: { total: 1, page: 1, limit: 10, pages: 1 },
      },
    });
    vi.mocked(productsApi.getRecommendations).mockResolvedValueOnce({
      success: true,
      data: [mockProducts[1]] as any,
    });

    render(
      <MemoryRouter initialEntries={['/products/prod-001']}>
        <AuthProvider>
          <Routes>
            <Route path="/products/:id" element={<ProductDetailPage />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    expect((await screen.findAllByText('Front Brake Pads Ceramic')).length).toBeGreaterThan(0);
    expect(screen.getByText('High performance ceramic composite brake pads.')).toBeDefined();

    // Specs table
    expect(screen.getByText('Technical Specifications')).toBeDefined();
    expect(screen.getByText('BRK-CER-01')).toBeDefined();
    expect(screen.getByText('Ceramic')).toBeDefined();

    // AddToCart box
    expect(screen.getByText('Add to Shopping Cart')).toBeDefined();
    expect(screen.getByText(/15 available/i)).toBeDefined();

    // Verified review
    expect(screen.getByText('Fitted perfectly on my 2018 Corolla. Excellent braking response.')).toBeDefined();
    expect(screen.getByText('Verified Purchase')).toBeDefined();
  });
});
