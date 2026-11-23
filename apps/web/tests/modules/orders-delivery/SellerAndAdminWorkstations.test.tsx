// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { SellerOrdersPage } from '../../../src/modules/orders-delivery/pages/seller/SellerOrdersPage.js';
import { CourierDispatchModal } from '../../../src/modules/orders-delivery/components/CourierDispatchModal.js';
import { SellerDeliveryRatesPage } from '../../../src/modules/orders-delivery/pages/seller/SellerDeliveryRatesPage.js';
import { AdminOrdersPage } from '../../../src/modules/orders-delivery/pages/admin/AdminOrdersPage.js';
import { AdminDeliveryProposalsPage } from '../../../src/modules/orders-delivery/pages/admin/AdminDeliveryProposalsPage.js';
import {
  sellerOrderApi,
  deliveryRateApi,
  adminOrderApi,
} from '../../../src/modules/orders-delivery/api/ordersDeliveryApi.js';
import * as AuthContextModule from '../../../src/modules/identity/context/AuthContext.js';

vi.mock('../../../src/modules/orders-delivery/api/ordersDeliveryApi.js', async () => {
  const actual = await vi.importActual<any>(
    '../../../src/modules/orders-delivery/api/ordersDeliveryApi.js'
  );
  return {
    ...actual,
    sellerOrderApi: {
      getSellerSuborders: vi.fn(),
      getSellerSuborderById: vi.fn(),
      updateFulfillmentStatus: vi.fn(),
      getSellerSuborderReceipt: vi.fn(),
      verifyReceipt: vi.fn(),
    },
    deliveryRateApi: {
      submitProposal: vi.fn(),
      getSellerRates: vi.fn(),
      getAdminProposals: vi.fn(),
      decideProposal: vi.fn(),
    },
    adminOrderApi: {
      getAdminOrders: vi.fn(),
      getAdminOrderById: vi.fn(),
    },
  };
});

describe('MOD-03 Seller & Administrator Workstation Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'seller-user-01',
        email: 'seller@apexparts.lk',
        firstName: 'Sunil',
        lastName: 'Perera',
        role: 'SELLER',
        phone: '0772223344',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
        sellerId: 'sel-01',
      },
      token: 'jwt-seller-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });
  });

  it('Renders SellerOrdersPage and allows advancing fulfillment state', async () => {
    vi.mocked(sellerOrderApi.getSellerSuborders).mockResolvedValueOnce({
      success: true,
      data: {
        suborders: [
          {
            _id: 'sub-01',
            suborderNumber: 'ORD-20261118-0001-01',
            orderId: 'ord-101',
            sellerId: 'sel-01',
            items: [
              {
                productId: 'prod-01',
                name: 'Toyota Brake Pads Ceramic',
                sku: 'APX-BP-001',
                partNumber: 'BP-TY-001',
                quantity: 2,
                unitPriceInCents: 1250000,
                lineTotalInCents: 2500000,
                sellerDiscountInCents: 0,
                platformDiscountInCents: 0,
              },
            ],
            productSubtotalInCents: 2500000,
            sellerDiscountInCents: 0,
            platformDiscountInCents: 0,
            commissionableBaseInCents: 2500000,
            deliveryFeeInCents: 50000,
            totalAmountInCents: 2550000,
            deliveryDistrict: 'Colombo',
            paymentMethod: 'COD',
            paymentStatus: 'PENDING',
            fulfillmentStatus: 'AWAITING_FULFILLMENT',
            createdAt: '2026-11-18T10:00:00.000Z',
            updatedAt: '2026-11-18T10:00:00.000Z',
          },
        ],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
        },
      },
    });

    vi.mocked(sellerOrderApi.updateFulfillmentStatus).mockResolvedValueOnce({
      success: true,
      data: {} as any,
    });

    render(
      <MemoryRouter>
        <SellerOrdersPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-20261118-0001-01')).toBeDefined();
    });

    expect(screen.getByText('Start Processing')).toBeDefined();

    // Advance status to PROCESSING
    fireEvent.click(screen.getByText('Start Processing'));

    await waitFor(() => {
      expect(sellerOrderApi.updateFulfillmentStatus).toHaveBeenCalledWith('sub-01', {
        fulfillmentStatus: 'PROCESSING',
      });
    });
  });

  it('CourierDispatchModal enforces required tracking consignment details', async () => {
    vi.mocked(sellerOrderApi.updateFulfillmentStatus).mockResolvedValueOnce({
      success: true,
      data: {} as any,
    });

    const onDispatchSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <CourierDispatchModal
        isOpen={true}
        onClose={onClose}
        suborderId="sub-01"
        suborderNumber="ORD-20261118-0001-01"
        onDispatchSuccess={onDispatchSuccess}
      />
    );

    expect(screen.getByText('Dispatch Package')).toBeDefined();

    // Fill consignment tracking number
    fireEvent.change(screen.getByPlaceholderText('e.g. DMX-89234190'), {
      target: { value: 'DMX-88991122' },
    });

    // Submit dispatch
    fireEvent.click(screen.getByText('Confirm Dispatch'));

    await waitFor(() => {
      expect(sellerOrderApi.updateFulfillmentStatus).toHaveBeenCalledWith('sub-01', {
        fulfillmentStatus: 'DISPATCHED',
        courierDetails: {
          courierName: 'Domex Courier',
          trackingNumber: 'DMX-88991122',
          estimatedDeliveryDate: undefined,
          courierContactPhone: undefined,
        },
      });
      expect(onDispatchSuccess).toHaveBeenCalledTimes(1);
    });
  });

  it('SellerDeliveryRatesPage renders active rates and submits proposal', async () => {
    vi.mocked(deliveryRateApi.getSellerRates).mockResolvedValueOnce({
      success: true,
      data: {
        activeRates: [
          {
            _id: 'zone-01',
            sellerId: 'sel-01',
            district: 'Colombo',
            deliveryFeeInCents: 45000,
            estimatedDaysMin: 1,
            estimatedDaysMax: 2,
            isActive: true,
            version: 1,
            approvedProposalId: 'prop-01',
          },
        ],
        proposals: [
          {
            _id: 'prop-01',
            sellerId: 'sel-01',
            districtRates: [
              {
                district: 'Colombo',
                deliveryFeeInCents: 45000,
                estimatedDaysMin: 1,
                estimatedDaysMax: 2,
              },
            ],
            status: 'APPROVED',
            createdAt: '2026-11-17T10:00:00.000Z',
            updatedAt: '2026-11-17T10:00:00.000Z',
          },
        ],
      },
    });

    vi.mocked(deliveryRateApi.submitProposal).mockResolvedValueOnce({
      success: true,
      data: {} as any,
    });

    render(
      <MemoryRouter>
        <SellerDeliveryRatesPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Active Approved Delivery Rates')).toBeDefined();
      expect(screen.getByText('Colombo District')).toBeDefined();
    });

    // Click submit proposal
    fireEvent.click(screen.getByText('Submit Proposal to Admin'));

    await waitFor(() => {
      expect(deliveryRateApi.submitProposal).toHaveBeenCalledTimes(1);
    });
  });

  it('AdminDeliveryProposalsPage renders pending queue and approves proposal', async () => {
    vi.mocked(deliveryRateApi.getAdminProposals).mockResolvedValueOnce({
      success: true,
      data: [
        {
          _id: 'prop-999',
          sellerId: 'sel-01',
          districtRates: [
            {
              district: 'Kandy',
              deliveryFeeInCents: 65000,
              estimatedDaysMin: 2,
              estimatedDaysMax: 4,
            },
          ],
          status: 'PENDING_APPROVAL',
          createdAt: '2026-11-18T10:00:00.000Z',
          updatedAt: '2026-11-18T10:00:00.000Z',
        },
      ],
    });

    vi.mocked(deliveryRateApi.decideProposal).mockResolvedValueOnce({
      success: true,
      data: {} as any,
    });

    render(
      <MemoryRouter>
        <AdminDeliveryProposalsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Delivery Rate Proposals Verification')).toBeDefined();
      expect(screen.getByText('Inspect & Decide')).toBeDefined();
    });

    // Open decision modal
    fireEvent.click(screen.getByText('Inspect & Decide'));

    await waitFor(() => {
      expect(screen.getByText('Review Delivery Proposal')).toBeDefined();
      expect(screen.getByText('Approve & Activate Rates')).toBeDefined();
    });

    // Approve proposal
    fireEvent.click(screen.getByText('Approve & Activate Rates'));

    await waitFor(() => {
      expect(deliveryRateApi.decideProposal).toHaveBeenCalledWith('prop-999', {
        decision: 'APPROVE',
        reviewerNotes: undefined,
        rejectionReason: undefined,
      });
    });
  });
});
