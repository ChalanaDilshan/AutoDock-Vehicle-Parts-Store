import { RouteObject } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.js';

// Authentication Pages
import { LoginPage } from './pages/LoginPage.js';
import { RegisterPage } from './pages/RegisterPage.js';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage.js';
import { ResetPasswordPage } from './pages/ResetPasswordPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.js';

// Seller Onboarding & Dashboard Pages
import { SellOnAutoDockPage } from './pages/seller/SellOnAutoDockPage.js';
import { SellerRegisterStep1Page } from './pages/seller/SellerRegisterStep1Page.js';
import { SellerOnboardingHub } from './pages/seller/SellerOnboardingHub.js';
import { SellerStatusNoticePage } from './pages/seller/SellerStatusNoticePage.js';
import { RestrictedSellerDashboard } from './pages/seller/RestrictedSellerDashboard.js';

// Administrator Verification Pages
import { SellerApplicationsQueuePage } from './pages/admin/SellerApplicationsQueuePage.js';
import { SellerApplicationReviewPage } from './pages/admin/SellerApplicationReviewPage.js';

export const identityRoutes: RouteObject[] = [
  // Public Auth Routes
  { path: 'login', element: <LoginPage /> },
  { path: 'register', element: <RegisterPage /> },
  { path: 'forgot-password', element: <ForgotPasswordPage /> },
  { path: 'reset-password', element: <ResetPasswordPage /> },
  { path: 'privacy-policy', element: <PrivacyPolicyPage /> },

  // Authenticated User Routes
  {
    path: 'account/profile',
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },

  // Seller Onboarding & Portal Routes
  { path: 'seller/register', element: <SellOnAutoDockPage /> },
  { path: 'sellers/register', element: <SellerRegisterStep1Page /> },
  {
    path: 'seller/onboarding',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerOnboardingHub />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/onboarding/status',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <SellerStatusNoticePage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'seller/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['SELLER', 'ADMIN']}>
        <RestrictedSellerDashboard />
      </ProtectedRoute>
    ),
  },

  // Administrator Verification Workstation Routes
  {
    path: 'admin/sellers/verification',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <SellerApplicationsQueuePage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/sellers/:id/review',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <SellerApplicationReviewPage />
      </ProtectedRoute>
    ),
  },
];
