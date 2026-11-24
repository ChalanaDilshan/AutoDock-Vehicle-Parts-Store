import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '../identity/components/ProtectedRoute.js';

// Seller Finance Pages
import { SellerFinanceOverviewPage } from './pages/seller/SellerFinanceOverviewPage.js';
import { SellerInvoicesPage } from './pages/seller/SellerInvoicesPage.js';
import { SellerInvoiceDetailPage } from './pages/seller/SellerInvoiceDetailPage.js';
import { SellerPromotionsPage } from './pages/seller/SellerPromotionsPage.js';
import { SellerSubsidiesPage } from './pages/seller/SellerSubsidiesPage.js';

// Administrator Finance Governance Pages
import { AdminFinanceOverviewPage } from './pages/admin/AdminFinanceOverviewPage.js';
import { AdminCommissionRatePage } from './pages/admin/AdminCommissionRatePage.js';
import { AdminSellerExemptionsPage } from './pages/admin/AdminSellerExemptionsPage.js';
import { AdminCommissionLedgerPage } from './pages/admin/AdminCommissionLedgerPage.js';
import { AdminInvoicesPage } from './pages/admin/AdminInvoicesPage.js';
import { AdminInvoiceDetailPage } from './pages/admin/AdminInvoiceDetailPage.js';
import { AdminPaymentVerificationQueuePage } from './pages/admin/AdminPaymentVerificationQueuePage.js';
import { AdminPromotionsPage } from './pages/admin/AdminPromotionsPage.js';
import { AdminSubsidiesPage } from './pages/admin/AdminSubsidiesPage.js';
import { AdminPlatformBankSettingsPage } from './pages/admin/AdminPlatformBankSettingsPage.js';

export const financePromotionsRoutes: RouteObject[] = [
  // ==========================================================================
  // Seller Finance & Promotion Routes (Role: SELLER or ADMIN)
  // ==========================================================================
  {
    path: 'seller/finance',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerFinanceOverviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/invoices',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerInvoicesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/invoices/:id',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerInvoiceDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/promotions',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerPromotionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/subsidies',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerSubsidiesPage />
      </ProtectedRoute>
    ),
  },

  // ==========================================================================
  // Administrator Finance & Promotion Governance Routes (Role: ADMIN only)
  // ==========================================================================
  {
    path: 'admin/finance',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminFinanceOverviewPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/finance/commission-rate',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminCommissionRatePage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/finance/exemptions',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminSellerExemptionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/finance/commission-ledger',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminCommissionLedgerPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/finance/invoices',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminInvoicesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/finance/invoices/:id',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminInvoiceDetailPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/finance/verification-queue',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminPaymentVerificationQueuePage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/finance/promotions',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminPromotionsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/finance/subsidies',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminSubsidiesPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/finance/bank-settings',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminPlatformBankSettingsPage />
      </ProtectedRoute>
    ),
  },
];
