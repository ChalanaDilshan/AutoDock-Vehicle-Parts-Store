// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SellerPromotionsPage } from '../../../src/modules/finance-promotions/pages/seller/SellerPromotionsPage.js';
import { CreateSellerPromotionModal } from '../../../src/modules/finance-promotions/components/CreateSellerPromotionModal.js';
import {
  sellerPromotionApi,
  PromotionRecord,
} from '../../../src/modules/finance-promotions/api/financePromotionsApi.js';
import { sellerProductsApi } from '../../../src/modules/customer-experience/api/customerExperienceApi.js';

vi.mock('../../../src/modules/finance-promotions/api/financePromotionsApi.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    sellerPromotionApi: {
      getPromotions: vi.fn(),
      getPromotionById: vi.fn(),
      createPromotion: vi.fn(),
      updateStatus: vi.fn(),
    },
  };
});

vi.mock('../../../src/modules/customer-experience/api/customerExperienceApi.js', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    sellerProductsApi: {
      list: vi.fn(),
    },
  };
});

describe('MOD-04 Seller Promotions & Coupon Management Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  const mockPromotion: PromotionRecord = {
    _id: 'promo-01',
    code: 'BRAKE10',
    title: '10% Off Ceramic Brake Pads',
    description: 'Promotional discount on high performance brake pads',
    discountType: 'PERCENTAGE',
    discountValue: 1000, // 10.00%
    fundingSource: 'SELLER_FUNDED',
    sellerId: 'sel-001',
    status: 'ACTIVE',
    startDate: '2026-11-01T00:00:00.000Z',
    endDate: '2026-12-31T23:59:59.999Z',
    totalUsageLimit: 100,
    perCustomerLimit: 1,
    currentUsageCount: 14,
    applicableProductIds: ['prod-01', 'prod-02'],
    applicableCategoryIds: [],
    minSpendInCents: 500000,
    maxDiscountInCents: 200000,
    createdAt: '2026-11-01T00:00:00.000Z',
  };

  it('Renders SellerPromotionsPage, shows coupons and toggles pause/active status', async () => {
    vi.mocked(sellerPromotionApi.getPromotions).mockResolvedValueOnce({
      success: true,
      data: {
        promotions: [mockPromotion],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });

    vi.mocked(sellerPromotionApi.updateStatus).mockResolvedValueOnce({
      success: true,
      data: {
        promotion: {
          ...mockPromotion,
          status: 'INACTIVE',
        },
      },
    });

    render(
      <MemoryRouter>
        <SellerPromotionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Seller Promotions')).toBeDefined();
      expect(screen.getByText('BRAKE10')).toBeDefined();
      expect(screen.getByText('10% Off Ceramic Brake Pads')).toBeDefined();
      expect(screen.getByText('10% Off')).toBeDefined();
      expect(screen.getByText('Pause')).toBeDefined();
    });

    // Toggle status to pause
    const pauseBtn = screen.getByText('Pause');
    fireEvent.click(pauseBtn);

    await waitFor(() => {
      expect(sellerPromotionApi.updateStatus).toHaveBeenCalledWith('promo-01', 'INACTIVE');
    });
  });

  it('Opens Promotion Analytics modal and displays redemption statistics', async () => {
    vi.mocked(sellerPromotionApi.getPromotions).mockResolvedValueOnce({
      success: true,
      data: {
        promotions: [mockPromotion],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      },
    });

    vi.mocked(sellerPromotionApi.getPromotionById).mockResolvedValueOnce({
      success: true,
      data: {
        promotion: mockPromotion,
        redemptionCount: 14,
        totalDiscountFundedInCents: 1540000,
      },
    });

    render(
      <MemoryRouter>
        <SellerPromotionsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('BRAKE10')).toBeDefined();
    });

    // Click Analytics button
    const statsBtn = screen.getByRole('button', { name: /Analytics/i });
    fireEvent.click(statsBtn);

    await waitFor(() => {
      expect(screen.getByText('Promotion Analytics')).toBeDefined();
      expect(screen.getByText(/Total Discount Funded/i)).toBeDefined();
    });
  });

  it('Validates and creates seller-funded coupon with CreateSellerPromotionModal', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    vi.mocked(sellerProductsApi.list).mockResolvedValueOnce({
      success: true,
      data: {
        items: [
          {
            _id: 'prod-01',
            name: 'Hydraulic Clutch Master Cylinder',
            sku: 'HC-001',
            price: 1500000,
            stockQuantity: 10,
            sellerId: 'sel-001',
            brandId: 'b-01',
            categoryId: 'c-01',
            images: [],
            isActive: true,
            isDeleted: false,
            createdAt: '',
            updatedAt: '',
          },
        ],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      },
    });

    vi.mocked(sellerPromotionApi.createPromotion).mockResolvedValueOnce({
      success: true,
      data: { promotion: mockPromotion },
    });

    render(
      <CreateSellerPromotionModal
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    expect(screen.getByText('Create Seller Promotion Coupon')).toBeDefined();
    // Funding invariant: explicitly seller-funded
    expect(screen.getByText(/Merchant Funding Responsibility/i)).toBeDefined();

    // Fill form
    fireEvent.change(screen.getByPlaceholderText(/4-20 chars/i), {
      target: { value: 'NEWYEAR15' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Weekend Brake Pad Special/i), {
      target: { value: '15% Off New Year Sale' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Leave blank for unlimited/i), {
      target: { value: '50' },
    });

    // Submit form
    const createBtn = screen.getByRole('button', { name: /Publish Seller Promotion/i });
    fireEvent.click(createBtn);

    await waitFor(() => {
      expect(sellerPromotionApi.createPromotion).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'NEWYEAR15',
          title: '15% Off New Year Sale',
          discountType: 'PERCENTAGE',
          discountValue: 1000, // default 10% converted to 1000 bps
          totalUsageLimit: 50,
        })
      );
      expect(handleSuccess).toHaveBeenCalled();
    });
  });
});
