import React, { useState, useCallback } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { Layout } from '../shared/components/Layout.js';
import { ErrorBoundary } from '../shared/components/ErrorBoundary.js';
import { AuthProvider } from '../modules/identity/context/AuthContext.js';
import { SplashScreen } from '../shared/components/SplashScreen.js';

// Module route imports
import { identityRoutes } from '../modules/identity/routes.js';
import { customerExperienceRoutes } from '../modules/customer-experience/routes.js';
import { ordersDeliveryRoutes } from '../modules/orders-delivery/routes.js';
import { financePromotionsRoutes } from '../modules/finance-promotions/routes.js';
import { adminPlatformRoutes } from '../modules/admin-platform/routes.js';

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      ...customerExperienceRoutes,
      ...identityRoutes,
      ...ordersDeliveryRoutes,
      ...financePromotionsRoutes,
      ...adminPlatformRoutes,
      {
        path: '*',
        element: (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-slate-800 mb-2">404 — Page Not Found</h1>
            <p className="text-sm text-slate-500">The requested page does not exist on AutoDock.</p>
          </div>
        ),
      },
    ],
  },
]);

export const App: React.FC = () => {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashDone = useCallback(() => setSplashDone(true), []);

  return (
    <ErrorBoundary>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ErrorBoundary>
  );
};
