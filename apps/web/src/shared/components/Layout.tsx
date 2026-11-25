import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AdminLayout } from '../../modules/admin-platform/components/AdminLayout.js';
import { Header } from './Header.js';
import { Footer } from './Footer.js';

/**
 * Root application layout shell.
 * Renders AdminLayout for /admin routes, or the standard storefront Header, Outlet, and Footer.
 */
export const Layout: React.FC = () => {
  const location = useLocation();

  // If navigating any administrative workstation, render the unified AdminLayout shell
  if (location.pathname.startsWith('/admin')) {
    return <AdminLayout />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white antialiased">
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};
