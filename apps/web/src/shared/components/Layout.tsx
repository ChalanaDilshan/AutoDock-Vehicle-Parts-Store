import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { ShoppingCart, Wrench, ShieldCheck, User, LogOut, Shield, Heart, Layers, MessageSquare } from 'lucide-react';
import { useAuth } from '../../modules/identity/context/AuthContext.js';

export const Layout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
          <div className="hidden md:flex items-center gap-5 text-sm font-medium text-slate-700">
            <Link to="/products" className="hover:text-blue-600 transition">
              Parts Catalog
            </Link>
            <Link to="/garage" className="flex items-center gap-1.5 text-slate-600 hover:text-blue-600 transition">
              <Wrench className="w-4 h-4 text-amber-500" />
              <span>My Garage</span>
            </Link>
            {user?.role === 'ADMIN' ? (
              <div className="flex items-center gap-4 text-xs font-semibold">
                <Link
                  to="/admin/sellers/verification"
                  className="flex items-center gap-1 text-blue-700 hover:text-blue-900 transition"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sellers</span>
                </Link>
                <Link
                  to="/admin/catalogue"
                  className="flex items-center gap-1 text-slate-700 hover:text-blue-900 transition"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Catalogue</span>
                </Link>
                <Link
                  to="/admin/reviews"
                  className="flex items-center gap-1 text-slate-700 hover:text-blue-900 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reviews</span>
                </Link>
              </div>
            ) : user?.role === 'SELLER' ? (
              <div className="flex items-center gap-4 text-xs font-semibold">
                <Link
                  to="/seller/dashboard"
                  className="flex items-center gap-1 text-emerald-700 hover:text-emerald-900 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Seller Portal</span>
                </Link>
                <Link
                  to="/seller/products"
                  className="hover:text-blue-600 text-slate-700 transition"
                >
                  Inventory
                </Link>
              </div>
            ) : (
              <Link
                to="/sellers/register"
                className="flex items-center gap-1 text-slate-600 hover:text-blue-600 transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Sell on AutoDock</span>
              </Link>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            <Link
              to="/wishlist"
              className="p-2 text-slate-700 hover:text-rose-600 hover:bg-slate-100 rounded-full transition"
              title="Saved Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              to="/cart"
              className="p-2 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-full relative transition"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/account/profile"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-800 hover:bg-slate-50 transition"
                  title={`${user.firstName} (${user.role})`}
                >
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  <span className="max-w-[100px] truncate">{user.firstName}</span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-300 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                <User className="w-4 h-4" />
                <span>Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Shared Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500 space-y-2">
          <p className="font-medium text-slate-700">AutoDock — Sri Lanka Vehicle Spare-Parts Marketplace</p>
          <div className="flex justify-center gap-4 text-slate-600">
            <Link to="/privacy-policy" className="hover:text-blue-600 underline">
              Privacy Policy & Verification Notice (v1.2)
            </Link>
            <Link to="/sellers/register" className="hover:text-blue-600 underline">
              Merchant Application
            </Link>
          </div>
          <p>© {new Date().getFullYear()} AutoDock Platform. Developed for University Undergraduate Project.</p>
        </div>
      </footer>
    </div>
  );
};
