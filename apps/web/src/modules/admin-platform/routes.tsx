import { RouteObject, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../identity/components/ProtectedRoute.js';
import { AdminDashboardPage } from './pages/AdminDashboardPage.js';
import { NotificationsPage } from './pages/NotificationsPage.js';
import { AdminNotificationsOperationsPage } from './pages/AdminNotificationsOperationsPage.js';
import { AdminAuditExplorerPage } from './pages/AdminAuditExplorerPage.js';
import { AdminReportsPage } from './pages/AdminReportsPage.js';

export const adminPlatformRoutes: RouteObject[] = [
  // User-Facing In-App Notification Centre (Available for all authenticated users: Customers, Sellers, Admins)
  {
    path: 'notifications',
    element: (
      <ProtectedRoute>
        <NotificationsPage />
      </ProtectedRoute>
    ),
  },

  // Central Administrator Workstation Routes (Restricted strictly to role: 'ADMIN')
  {
    path: 'admin',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: 'admin/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/notifications',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminNotificationsOperationsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/audit-logs',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminAuditExplorerPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/reports',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminReportsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: 'admin/reports/:reportType',
    element: (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <AdminReportsPage />
      </ProtectedRoute>
    ),
  },
];
