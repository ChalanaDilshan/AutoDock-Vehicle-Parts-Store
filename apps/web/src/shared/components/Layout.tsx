import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from './Header.js';
import { Footer } from './Footer.js';
import { AdminLayout } from '../../modules/admin-platform/components/AdminLayout.js';

/**
 * Top-level route shell switcher:
 * Renders AdminLayout for /admin routes, or the standard storefront Header, Outlet, and Footer.
 */
export const Layout: React.FC = () => {
  const location = useLocation();

  if (location.pathname.startsWith('/admin')) {
    return <AdminLayout />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};
