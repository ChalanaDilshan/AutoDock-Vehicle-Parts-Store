// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { MyGaragePage } from '../../../src/modules/customer-experience/pages/MyGaragePage.js';
import { CartPage } from '../../../src/modules/customer-experience/pages/CartPage.js';
import { WishlistPage } from '../../../src/modules/customer-experience/pages/WishlistPage.js';
import {
  garageApi,
  cartApi,
  wishlistApi,
  taxonomyApi,
} from '../../../src/modules/customer-experience/api/customerExperienceApi.js';
import * as AuthContextModule from '../../../src/modules/identity/context/AuthContext.js';

// Mock API
vi.mock('../../../src/modules/customer-experience/api/customerExperienceApi.js', async () => {
  const actual = await vi.importActual<any>('../../../src/modules/customer-experience/api/customerExperienceApi.js');
  return {
    ...actual,
    garageApi: {
      getVehicles: vi.fn(),
      addVehicle: vi.fn(),
      setDefault: vi.fn(),
      removeVehicle: vi.fn(),
    },
    cartApi: {
      get: vi.fn(),
      addItem: vi.fn(),
      updateQuantity: vi.fn(),
      removeItem: vi.fn(),
    },
    wishlistApi: {
      get: vi.fn(),
      addItem: vi.fn(),
      removeItem: vi.fn(),
      moveToCart: vi.fn(),
    },
    taxonomyApi: {
      getMakes: vi.fn(),
      getModels: vi.fn(),
    },
  };
});

describe('MOD-02 Garage, Cart & Wishlist Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'user-01',
        email: 'customer@autodock.lk',
        firstName: 'Nimal',
        lastName: 'Perera',
        role: 'CUSTOMER',
        phone: '+94771234567',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
      },
      token: 'jwt-mock-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });
  });

  it('Renders My Garage with saved vehicles and displays default badge', async () => {
    vi.mocked(garageApi.getVehicles).mockResolvedValueOnce({
      success: true,
      data: {
        vehicles: [
          {
            _id: 'veh-1',
            make: 'Toyota',
            model: 'Corolla',
            year: 2018,
            engine: '1.8L Dual VVT-i',
            vin: 'NZE161-123456',
            nickname: 'Daily Driver',
            isDefault: true,
          },
          {
            _id: 'veh-2',
            make: 'Honda',
            model: 'Vezel',
            year: 2016,
            engine: '1.5L i-VTEC Hybrid',
            isDefault: false,
          },
        ] as any,
      },
    });

    render(
      <MemoryRouter>
        <MyGaragePage />
      </MemoryRouter>
    );

    expect(await screen.findByText('2018 Toyota Corolla')).toBeDefined();
    expect(screen.getByText('"Daily Driver"')).toBeDefined();
    expect(screen.getByText('Default')).toBeDefined();
    expect(screen.getByText('2016 Honda Vezel')).toBeDefined();
    expect(screen.getByText('2/10 Vehicles Saved')).toBeDefined();
  });

  it('Renders multi-vendor shopping cart with seller subtotal and triggers checkout boundary modal', async () => {
    const item1 = {
      _id: 'item-1',
      productId: {
        _id: 'prod-001',
        name: 'Denso Spark Plugs Iridium (Set of 4)',
        sku: 'DNS-IK20',
        priceInCents: 850000,
        stock: 20,
        images: [],
      },
      sellerId: 'seller-1',
      quantity: 1,
      priceInCentsAtAdd: 850000,
      addedAt: new Date().toISOString(),
    };

    const item2 = {
      _id: 'item-2',
      productId: {
        _id: 'prod-002',
        name: 'KYB Excel-G Rear Shock Absorber',
        sku: 'KYB-343412',
        priceInCents: 1500000,
        stock: 8,
        images: [],
      },
      sellerId: 'seller-2',
      quantity: 1,
      priceInCentsAtAdd: 1500000,
      addedAt: new Date().toISOString(),
    };

    const mockCartData = {
      _id: 'cart-123',
      userId: 'user-01',
      totalInCents: 2350000, // Rs. 23,500.00
      items: [item1, item2],
      sellerGroups: [
        {
          sellerId: 'seller-1',
          storeName: 'Colombo Auto Parts Ltd',
          items: [item1],
          subtotalInCents: 850000,
        },
        {
          sellerId: 'seller-2',
          storeName: 'Kandy Motor Spares',
          items: [item2],
          subtotalInCents: 1500000,
        },
      ],
    };

    vi.mocked(cartApi.get).mockResolvedValueOnce({
      success: true,
      data: mockCartData as any,
    });

    const CheckoutMarker = () => {
      const loc = useLocation();
      return <div data-testid="checkout-route">{loc.pathname}</div>;
    };

    render(
      <MemoryRouter initialEntries={['/cart']}>
        <Routes>
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutMarker />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText('Denso Spark Plugs Iridium (Set of 4)')).toBeDefined();
    expect(screen.getByText('KYB Excel-G Rear Shock Absorber')).toBeDefined();
    expect(screen.getByText(/Colombo Auto Parts Ltd/i)).toBeDefined();
    expect(screen.getByText(/Kandy Motor Spares/i)).toBeDefined();

    // Verify grand total formatted in LKR
    expect(screen.getAllByText('Rs. 23,500.00').length).toBeGreaterThan(0);

    // Click proceed to checkout button -> direct navigation to /checkout
    const checkoutBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    fireEvent.click(checkoutBtn);

    expect(await screen.findByTestId('checkout-route')).toBeDefined();
  });

  it('Renders customer wishlist with 1-click move to cart', async () => {
    vi.mocked(wishlistApi.get).mockResolvedValueOnce({
      success: true,
      data: {
        _id: 'w-1',
        userId: 'user-01',
        items: [
          {
            productId: {
              _id: 'prod-001',
              name: 'Engine Timing Belt Kit',
              sku: 'GAT-T284',
              priceInCents: 980000,
              stock: 5,
              status: 'ACTIVE',
              images: [],
            },
            addedAt: new Date().toISOString(),
          },
        ] as any,
      },
    });

    vi.mocked(wishlistApi.moveToCart).mockResolvedValueOnce({
      success: true,
      data: {} as any,
    });

    render(
      <MemoryRouter>
        <WishlistPage />
      </MemoryRouter>
    );

    expect(await screen.findByText('Engine Timing Belt Kit')).toBeDefined();
    expect(screen.getByText('Rs. 9,800.00')).toBeDefined();

    const moveToCartBtn = screen.getByRole('button', { name: /Move to Cart/i });
    fireEvent.click(moveToCartBtn);

    await waitFor(() => {
      expect(wishlistApi.moveToCart).toHaveBeenCalledWith('prod-001', 1);
    });
  });
});
