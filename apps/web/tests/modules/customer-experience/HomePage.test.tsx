// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HomePage } from '../../../src/modules/customer-experience/pages/HomePage.js';
import {
  productsApi,
  taxonomyApi,
  cartApi,
  wishlistApi,
} from '../../../src/modules/customer-experience/api/customerExperienceApi.js';

const mockUseAuth = vi.fn();

vi.mock('../../../src/modules/identity/context/AuthContext.js', () => ({
  useAuth: () => mockUseAuth(),
}));

vi.mock('../../../src/modules/customer-experience/api/customerExperienceApi.js', async () => {
  const actual = await vi.importActual<any>(
    '../../../src/modules/customer-experience/api/customerExperienceApi.js'
  );
  return {
    ...actual,
    productsApi: {
      getRecommendations: vi.fn(),
    },
    taxonomyApi: {
      getCategories: vi.fn(),
      getBrands: vi.fn(),
      getMakes: vi.fn(),
      getModels: vi.fn(),
    },
    cartApi: {
      addItem: vi.fn(),
    },
    wishlistApi: {
      addItem: vi.fn(),
    },
  };
});

const LocationDisplay: React.FC = () => {
  const loc = useLocation();
  return <div data-testid="location-display">{`${loc.pathname}${loc.search}`}</div>;
};

describe('HomePage Component Tests', () => {
  const sampleCategories = [
    { _id: 'c1', name: 'Engine Parts', slug: 'engine-parts', isActive: true, displayOrder: 1 },
    { _id: 'c2', name: 'Brakes', slug: 'brakes', isActive: true, displayOrder: 2 },
    { _id: 'c3', name: 'Filters', slug: 'filters', isActive: true, displayOrder: 3 },
    { _id: 'c4', name: 'Electrical', slug: 'electrical', isActive: true, displayOrder: 4 },
    { _id: 'c5', name: 'Suspension', slug: 'suspension', isActive: true, displayOrder: 5 },
    { _id: 'c6', name: 'Body Parts', slug: 'body-parts', isActive: true, displayOrder: 6 },
    { _id: 'c7', name: 'Accessories', slug: 'accessories', isActive: true, displayOrder: 7 },
  ];

  const sampleProducts = [
    {
      _id: 'p1',
      sellerId: 's1',
      name: 'Brake Disc (Front)',
      slug: 'brake-disc-front',
      sku: 'BD-001',
      categoryId: 'c2',
      brandId: { _id: 'b1', name: 'Brembo', slug: 'brembo', isActive: true },
      description: 'Front ventilated brake disc',
      priceInCents: 850000,
      stock: 12,
      condition: 'NEW',
      images: [],
      specifications: {},
      status: 'ACTIVE',
      averageRating: 4.8,
      reviewCount: 24,
      isUniversalFit: false,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    vi.mocked(productsApi.getRecommendations).mockResolvedValue({
      success: true,
      data: sampleProducts as any,
    });
    vi.mocked(taxonomyApi.getCategories).mockResolvedValue({
      success: true,
      data: sampleCategories as any,
    });
    vi.mocked(taxonomyApi.getBrands).mockResolvedValue({
      success: true,
      data: [{ _id: 'b1', name: 'Denso', slug: 'denso', countryOfOrigin: 'Japan', isActive: true }] as any,
    });
    vi.mocked(taxonomyApi.getMakes).mockResolvedValue({
      success: true,
      data: ['Toyota', 'Honda'],
    });
    vi.mocked(taxonomyApi.getModels).mockResolvedValue({
      success: true,
      data: ['Corolla', 'Prius'],
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders Hero section, Categories, Featured Products, and Promotional Banners', async () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    // Hero section
    expect(screen.getByText('Quality Vehicle Parts for a Smoother Ride')).toBeDefined();
    expect(
      screen.getByText('Find the right parts for your vehicle. Wide range. Trusted sellers.')
    ).toBeDefined();
    expect(screen.getAllByText('Shop Now').length).toBeGreaterThan(0);

    // Categories
    await waitFor(() => {
      expect(screen.getByText('Engine Parts')).toBeDefined();
      expect(screen.getByText('Brakes')).toBeDefined();
      expect(screen.getByText('Filters')).toBeDefined();
      expect(screen.getByText('Electrical')).toBeDefined();
      expect(screen.getByText('Suspension')).toBeDefined();
      expect(screen.getByText('Body Parts')).toBeDefined();
      expect(screen.getByText('Accessories')).toBeDefined();
    });
    expect(screen.getByText('View All Categories')).toBeDefined();

    // Featured Products
    expect(screen.getByText('Featured Products')).toBeDefined();
    expect(screen.getByText('Brake Disc (Front)')).toBeDefined();
    expect(screen.getByText('View All')).toBeDefined();

    // Promotional Banners
    expect(screen.getByText(/Genuine Parts/)).toBeDefined();
    expect(screen.getByText('Special Offers')).toBeDefined();
    expect(screen.getByText('Learn More')).toBeDefined();
  });

  it('submits Find Parts for Your Vehicle form with selected Make, Model, and Year', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/products" element={<LocationDisplay />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Toyota')).toBeDefined();
    });

    const makeSelect = screen.getByLabelText('Vehicle Make') as HTMLSelectElement;
    fireEvent.change(makeSelect, { target: { value: 'Toyota' } });

    await waitFor(() => {
      expect(taxonomyApi.getModels).toHaveBeenCalledWith('Toyota');
      expect(screen.getByText('Corolla')).toBeDefined();
    });

    const modelSelect = screen.getByLabelText('Vehicle Model') as HTMLSelectElement;
    fireEvent.change(modelSelect, { target: { value: 'Corolla' } });

    const yearSelect = screen.getByLabelText('Vehicle Year') as HTMLSelectElement;
    fireEvent.change(yearSelect, { target: { value: '2020' } });

    const searchBtn = screen.getByRole('button', { name: 'Search Parts' });
    fireEvent.click(searchBtn);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe(
        '/products?make=Toyota&model=Corolla&year=2020'
      );
    });
  });

  it('calls cartApi.addItem when authenticated user clicks Add to Shopping Cart', async () => {
    mockUseAuth.mockReturnValue({
      user: { firstName: 'Iniyavan', role: 'CUSTOMER' },
      isAuthenticated: true,
    });
    vi.mocked(cartApi.addItem).mockResolvedValue({ success: true } as any);

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Brake Disc (Front)')).toBeDefined();
    });

    const addCartBtn = screen.getByLabelText('Add to Shopping Cart');
    fireEvent.click(addCartBtn);

    await waitFor(() => {
      expect(cartApi.addItem).toHaveBeenCalledWith({ productId: 'p1', quantity: 1 });
      expect(screen.getByRole('status').textContent).toContain('Brake Disc (Front)');
    });
  });

  it('displays empty/error fallback gracefully when backend APIs fail', async () => {
    vi.mocked(productsApi.getRecommendations).mockRejectedValue(new Error('Network error'));
    vi.mocked(taxonomyApi.getCategories).mockRejectedValue(new Error('Network error'));
    vi.mocked(taxonomyApi.getBrands).mockRejectedValue(new Error('Network error'));
    vi.mocked(taxonomyApi.getMakes).mockRejectedValue(new Error('Network error'));

    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Unable to load featured products right now.')).toBeDefined();
      expect(screen.getByText('Categories are currently unavailable.')).toBeDefined();
    });
  });
});
