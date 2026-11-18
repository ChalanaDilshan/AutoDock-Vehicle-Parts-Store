// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { CheckoutPage } from '../../../src/modules/orders-delivery/pages/CheckoutPage.js';
import { OrderHistoryPage } from '../../../src/modules/orders-delivery/pages/OrderHistoryPage.js';
import { OrderDetailPage } from '../../../src/modules/orders-delivery/pages/OrderDetailPage.js';
import {
  checkoutApi,
  orderApi,
} from '../../../src/modules/orders-delivery/api/ordersDeliveryApi.js';
import * as AuthContextModule from '../../../src/modules/identity/context/AuthContext.js';

vi.mock('../../../src/modules/orders-delivery/api/ordersDeliveryApi.js', async () => {
  const actual = await vi.importActual<any>(
    '../../../src/modules/orders-delivery/api/ordersDeliveryApi.js'
  );
  return {
    ...actual,
    checkoutApi: {
      getQuote: vi.fn(),
      placeOrder: vi.fn(),
    },
    orderApi: {
      getCustomerOrders: vi.fn(),
      getOrderById: vi.fn(),
      getSuborderById: vi.fn(),
      getBankInstructions: vi.fn(),
      uploadReceipt: vi.fn(),
      cancelSuborder: vi.fn(),
      getReceiptStreamUrl: vi.fn(),
    },
  };
});

describe('MOD-03 Customer Checkout & Orders Frontend Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        id: 'cust-101',
        email: 'kasun@autodock.lk',
        firstName: 'Kasun',
        lastName: 'Perera',
        role: 'CUSTOMER',
        phone: '0771234567',
        accountStatus: 'ACTIVE',
        isEmailVerified: true,
      },
      token: 'jwt-cust-token',
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      refreshProfile: vi.fn(),
    });
  });

  it('Renders Checkout page with authoritative quote grouped by seller', async () => {
    vi.mocked(checkoutApi.getQuote).mockResolvedValueOnce({
      success: true,
      data: {
        sellerSuborders: [
          {
            sellerId: 'sel-01',
            sellerName: 'Apex Auto Spare Parts',
            items: [
              {
                productId: 'prod-01',
                name: 'Toyota Brake Pads Ceramic',
                partNumber: 'BP-TY-001',
                sku: 'APX-BP-001',
                quantity: 2,
                unitPriceInCents: 1250000,
                lineTotalInCents: 2500000,
                discountInCents: 0,
              },
            ],
            productSubtotalInCents: 2500000,
            deliveryFeeInCents: 50000,
            totalInCents: 2550000,
            isDefaultRate: false,
          },
          {
            sellerId: 'sel-02',
            sellerName: 'Colombo Motor Imports',
            items: [
              {
                productId: 'prod-02',
                name: 'Denso Iridium Spark Plug',
                partNumber: 'SP-IK20',
                sku: 'CMI-SP-002',
                quantity: 4,
                unitPriceInCents: 250000,
                lineTotalInCents: 1000000,
                discountInCents: 0,
              },
            ],
            productSubtotalInCents: 1000000,
            deliveryFeeInCents: 45000,
            totalInCents: 1045000,
            isDefaultRate: false,
          },
        ],
        totalProductAmountInCents: 3500000,
        totalDeliveryFeeInCents: 95000,
        totalDiscountInCents: 0,
        finalPayableAmountInCents: 3595000,
        shippingDistrict: 'Colombo',
      },
    });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    // Verify Quote Loading concludes and renders multi-vendor groups
    await waitFor(() => {
      expect(screen.getByText('Apex Auto Spare Parts')).toBeDefined();
      expect(screen.getByText('Colombo Motor Imports')).toBeDefined();
    });

    // Verify products and quantities
    expect(screen.getByText('Toyota Brake Pads Ceramic')).toBeDefined();
    expect(screen.getByText('Denso Iridium Spark Plug')).toBeDefined();

    // Verify separate seller delivery fees and authoritative grand total
    expect(screen.getByText('Final Order Financial Summary')).toBeDefined();
    expect(screen.getByText(/35,950/)).toBeDefined(); // 35,950.00 LKR
  });

  it('Places multi-vendor order and submits address with idempotency key', async () => {
    vi.mocked(checkoutApi.getQuote).mockResolvedValueOnce({
      success: true,
      data: {
        sellerSuborders: [
          {
            sellerId: 'sel-01',
            sellerName: 'Apex Auto Spare Parts',
            items: [
              {
                productId: 'prod-01',
                name: 'Toyota Brake Pads',
                partNumber: 'BP-TY-001',
                sku: 'APX-BP-001',
                quantity: 1,
                unitPriceInCents: 1250000,
                lineTotalInCents: 1250000,
                discountInCents: 0,
              },
            ],
            productSubtotalInCents: 1250000,
            deliveryFeeInCents: 50000,
            totalInCents: 1300000,
            isDefaultRate: false,
          },
        ],
        totalProductAmountInCents: 1250000,
        totalDeliveryFeeInCents: 50000,
        totalDiscountInCents: 0,
        finalPayableAmountInCents: 1300000,
        shippingDistrict: 'Colombo',
      },
    });

    vi.mocked(checkoutApi.placeOrder).mockResolvedValueOnce({
      success: true,
      data: {
        order: {
          _id: 'ord-999',
          orderNumber: 'ORD-20261118-0999',
          customerId: 'cust-101',
          suborderIds: ['sub-01'],
          totalProductAmountInCents: 1250000,
          totalDeliveryFeeInCents: 50000,
          totalDiscountInCents: 0,
          finalPayableAmountInCents: 1300000,
          overallStatus: 'AWAITING_FULFILLMENT',
          shippingAddress: {
            fullName: 'Kasun Perera',
            phone: '0771234567',
            street: 'No 10 Galle Road',
            city: 'Colombo',
            district: 'Colombo',
            postalCode: '00300',
          },
          statusHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        suborders: [],
      },
    });

    render(
      <MemoryRouter>
        <CheckoutPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Apex Auto Spare Parts')).toBeDefined();
    });

    // Fill street address and city
    fireEvent.change(screen.getByPlaceholderText('e.g. No. 45, Temple Road'), {
      target: { value: 'No 10 Galle Road' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. Nugegoda'), {
      target: { value: 'Colombo' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g. 10250'), {
      target: { value: '00300' },
    });

    // Click confirm order
    const placeOrderBtn = screen.getByText('Confirm & Place Order');
    fireEvent.click(placeOrderBtn);

    await waitFor(() => {
      expect(checkoutApi.placeOrder).toHaveBeenCalledTimes(1);
    });

    const callPayload = vi.mocked(checkoutApi.placeOrder).mock.calls[0][0];
    expect(callPayload.shippingAddress.district).toBe('Colombo');
    expect(callPayload.shippingAddress.street).toBe('No 10 Galle Road');
    expect(callPayload.idempotencyKey).toMatch(/^idemp_/);
  });

  it('Renders customer OrderHistoryPage with order summaries and rollup badge', async () => {
    vi.mocked(orderApi.getCustomerOrders).mockResolvedValueOnce({
      success: true,
      data: {
        orders: [
          {
            _id: 'ord-101',
            orderNumber: 'ORD-20261118-0001',
            customerId: 'cust-101',
            suborderIds: ['sub-01', 'sub-02'],
            totalProductAmountInCents: 3500000,
            totalDeliveryFeeInCents: 95000,
            totalDiscountInCents: 0,
            finalPayableAmountInCents: 3595000,
            overallStatus: 'IN_PROGRESS',
            shippingAddress: {
              fullName: 'Kasun Perera',
              phone: '0771234567',
              street: 'No 10 Galle Road',
              city: 'Colombo',
              district: 'Colombo',
              postalCode: '00300',
            },
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

    render(
      <MemoryRouter>
        <OrderHistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-20261118-0001')).toBeDefined();
    });

    expect(screen.getByText('In Progress')).toBeDefined();
    expect(screen.getByText(/35,950/)).toBeDefined();
    expect(screen.getByText('2 Merchant Suborders')).toBeDefined();
  });

  it('Renders customer OrderDetailPage with multiple constituent seller suborders', async () => {
    vi.mocked(orderApi.getOrderById).mockResolvedValueOnce({
      success: true,
      data: {
        order: {
          _id: 'ord-101',
          orderNumber: 'ORD-20261118-0001',
          customerId: 'cust-101',
          suborderIds: ['sub-01', 'sub-02'],
          totalProductAmountInCents: 3500000,
          totalDeliveryFeeInCents: 95000,
          totalDiscountInCents: 0,
          finalPayableAmountInCents: 3595000,
          overallStatus: 'IN_PROGRESS',
          shippingAddress: {
            fullName: 'Kasun Perera',
            phone: '0771234567',
            street: 'No 10 Galle Road',
            city: 'Colombo',
            district: 'Colombo',
            postalCode: '00300',
          },
          statusHistory: [
            {
              status: 'AWAITING_FULFILLMENT',
              changedAt: '2026-11-18T10:00:00.000Z',
            },
          ],
          createdAt: '2026-11-18T10:00:00.000Z',
          updatedAt: '2026-11-18T10:00:00.000Z',
        },
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
          {
            _id: 'sub-02',
            suborderNumber: 'ORD-20261118-0001-02',
            orderId: 'ord-101',
            sellerId: 'sel-02',
            items: [
              {
                productId: 'prod-02',
                name: 'Denso Spark Plugs',
                sku: 'CMI-SP-002',
                partNumber: 'SP-IK20',
                quantity: 4,
                unitPriceInCents: 250000,
                lineTotalInCents: 1000000,
                sellerDiscountInCents: 0,
                platformDiscountInCents: 0,
              },
            ],
            productSubtotalInCents: 1000000,
            sellerDiscountInCents: 0,
            platformDiscountInCents: 0,
            commissionableBaseInCents: 1000000,
            deliveryFeeInCents: 45000,
            totalAmountInCents: 1045000,
            deliveryDistrict: 'Colombo',
            paymentMethod: 'DIRECT_BANK_TRANSFER',
            paymentStatus: 'RECEIPT_UPLOADED',
            fulfillmentStatus: 'PROCESSING',
            createdAt: '2026-11-18T10:00:00.000Z',
            updatedAt: '2026-11-18T10:00:00.000Z',
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={['/orders/ord-101']}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-20261118-0001')).toBeDefined();
    });

    // Check independent seller suborders
    expect(screen.getByText('ORD-20261118-0001-01')).toBeDefined();
    expect(screen.getByText('ORD-20261118-0001-02')).toBeDefined();
    expect(screen.getByText('Toyota Brake Pads Ceramic')).toBeDefined();
    expect(screen.getByText('Denso Spark Plugs')).toBeDefined();
  });
});
