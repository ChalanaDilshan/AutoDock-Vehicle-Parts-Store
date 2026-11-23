import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '../identity/components/ProtectedRoute.js';

// Customer Pages
import { CheckoutPage } from './pages/CheckoutPage.js';
import { OrderHistoryPage } from './pages/OrderHistoryPage.js';
import { OrderDetailPage } from './pages/OrderDetailPage.js';

// Seller Workstation Pages
import { SellerOrdersPage } from './pages/seller/SellerOrdersPage.js';
import { SellerSuborderDetailPage } from './pages/seller/SellerSuborderDetailPage.js';
import { SellerDeliveryRatesPage } from './pages/seller/SellerDeliveryRatesPage.js';

// Administrator Governance Pages
import { AdminOrdersPage } from './pages/admin/AdminOrdersPage.js';
import { AdminOrderDetailPage } from './pages/admin/AdminOrderDetailPage.js';
import { AdminDeliveryProposalsPage } from './pages/admin/AdminDeliveryProposalsPage.js';

export const ordersDeliveryRoutes: RouteObject[] = [
  // Customer Checkout & Purchase Routes
  {
    path: 'checkout',
    element: (
      <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
        <CheckoutPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'orders',
    element: (
      <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
        <OrderHistoryPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'orders/:id',
    element: (
      <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
        <OrderDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'orders/suborders/:suborderId',
    element: (
      <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
        <OrderDetailPage />
      </ProtectedRoute>
    ),
  },

  // Seller Order Fulfillment & Delivery Rates Routes
  {
    path: 'seller/orders',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerOrdersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/orders/:suborderId',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerSuborderDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/delivery-rates',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerDeliveryRatesPage />
      </ProtectedRoute>
    ),
  },

  // Administrator Orders & Rate Verification Routes
  {
    path: 'admin/orders',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminOrdersPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/orders/:id',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminOrderDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/delivery-proposals',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminDeliveryProposalsPage />
      </ProtectedRoute>
    ),
  },
];
