import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from '../identity/components/ProtectedRoute.js';

// Public & Customer Experience Pages
import { HomePage } from './pages/HomePage.js';
import { ProductListingPage } from './pages/ProductListingPage.js';
import { ProductDetailPage } from './pages/ProductDetailPage.js';
import { MyGaragePage } from './pages/MyGaragePage.js';
import { CartPage } from './pages/CartPage.js';
import { WishlistPage } from './pages/WishlistPage.js';

// Seller Management Pages
import { SellerProductsPage } from './pages/seller/SellerProductsPage.js';
import { SellerProductEditorPage } from './pages/seller/SellerProductEditorPage.js';
import { SellerReviewsPage } from './pages/seller/SellerReviewsPage.js';

// Admin Platform Pages
import { AdminCataloguePage } from './pages/admin/AdminCataloguePage.js';
import { AdminReviewModerationPage } from './pages/admin/AdminReviewModerationPage.js';

export const customerExperienceRoutes: RouteObject[] = [
  // Public Discovery Routes
  { index: true, element: <HomePage /> },
  { path: 'products', element: <ProductListingPage /> },
  { path: 'products/:id', element: <ProductDetailPage /> },
  { path: 'cart', element: <CartPage /> },

  // Customer Authenticated Routes
  {
    path: 'garage',
    element: (
      <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
        <MyGaragePage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'wishlist',
    element: (
      <ProtectedRoute allowedRoles={['CUSTOMER', 'ADMIN']}>
        <WishlistPage />
      </ProtectedRoute>
    ),
  },

  // Seller Product & Review Management Routes
  {
    path: 'seller/products',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerProductsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/products/new',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerProductEditorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/products/:id/edit',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerProductEditorPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/reviews',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerReviewsPage />
      </ProtectedRoute>
    ),
  },

  // Administrator Catalogue & Moderation Routes
  {
    path: 'admin/catalogue',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminCataloguePage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/reviews',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminReviewModerationPage />
      </ProtectedRoute>
    ),
  },
];
