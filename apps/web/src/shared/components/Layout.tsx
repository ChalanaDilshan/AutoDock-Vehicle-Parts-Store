import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { ShoppingCart, Wrench, ShieldCheck, User } from 'lucide-react';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Notification / Trust Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 text-center">
        <span>Island-wide delivery across all 25 Sri Lankan districts | Verified auto spare-parts merchants</span>
      </div>

      {/* Main Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Brand Wordmark */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <span className="text-slate-900">AUTO</span>
            <span className="text-blue-600">DOCK</span>
            <span className="text-amber-500 font-black">.</span>
          </Link>

          {/* Quick Nav / Fitment Badge */}
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-700">
            <Link to="/products" className="hover:text-blue-600 transition">
              Parts Catalog
            </Link>
            <Link to="/garage" className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition">
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>My Garage</span>
            </Link>
            <Link to="/sellers/register" className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Sell on AutoDock</span>
            </Link>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-full relative transition"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
            >
              <User className="w-4 h-4" />
              <span>Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Shared Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          <p className="mb-2 font-medium text-slate-700">AutoDock — Sri Lanka Vehicle Spare-Parts Marketplace</p>
          <p>© {new Date().getFullYear()} AutoDock Platform. Developed for University Undergraduate Project.</p>
        </div>
      </footer>
    </div>
  );
};
