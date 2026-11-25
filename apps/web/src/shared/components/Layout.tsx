import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Wrench,
  ShieldCheck,
  LogOut,
  Heart,
  Layers,
  Package,
  Truck,
  Search,
  Menu,
  X,
  CreditCard,
  Building2,
  Phone,
  CheckCircle2,
  LayoutDashboard,
} from 'lucide-react';
import { useAuth } from '../../modules/identity/context/AuthContext.js';
import { NotificationBell } from '../../modules/admin-platform/components/NotificationBell.js';
import { AdminLayout } from '../../modules/admin-platform/components/AdminLayout.js';

export const Layout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // If navigating any administrative workstation, render the unified AdminLayout shell
  if (location.pathname.startsWith('/admin')) {
    return <AdminLayout />;
  }

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  // Close mobile drawer on route change
  React.useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white antialiased">
      {/* Top Utility & Trust Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-slate-300">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Merchants</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="font-medium text-slate-200">
              Sri Lanka Vehicle Spare-Parts Marketplace
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="text-slate-400 hidden md:inline">
              Delivery across all 25 districts
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <a
              href="tel:+94112345678"
              className="inline-flex items-center gap-1.5 hover:text-white transition"
              title="Customer Support Hotline"
            >
              <Phone className="w-3 h-3 text-blue-400" />
              <span>Hotline: +94 11 234 5678</span>
            </a>
            <span className="text-slate-700 hidden sm:inline">|</span>
            <span className="inline-flex items-center gap-1 text-slate-300 hidden sm:inline-flex">
              <Building2 className="w-3 h-3 text-amber-400" />
              <span>Direct Bank Deposit & COD Supported</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4 sm:gap-6">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Wrench className="w-4 h-4 text-blue-400" />
            </div>
            <div className="flex flex-col">
              <div className="text-lg font-bold tracking-tight leading-none text-slate-900 flex items-center">
                <span>AUTO</span>
                <span className="text-blue-600">DOCK</span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                Genuine Parts LK
              </span>
            </div>
          </Link>

          {/* Desktop Practical Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-lg mx-2 relative items-center"
          >
            <div className="relative w-full flex items-center">
              <input
                type="text"
                placeholder="Search by part name, OEM number, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-20 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-300 rounded-md focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition outline-none text-slate-800 placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-700">
            <Link
              to="/products"
              className="text-slate-700 hover:text-blue-600 transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-slate-400" />
              <span>Parts Catalog</span>
            </Link>

            <Link
              to="/garage"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition"
              title="Access your saved vehicles for guaranteed fitment"
            >
              <Car className="w-3.5 h-3.5 text-blue-600" />
              <span>My Garage</span>
            </Link>

            {/* Role-Specific Workstations */}
            {user?.role === 'ADMIN' ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <Link
                  to="/admin/dashboard"
                  className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 hover:bg-blue-100 transition"
                >
                  Admin Console
                </Link>
                <Link
                  to="/admin/dashboard"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-blue-600" />
                  <span>Dashboard</span>
                </Link>
                <Link
                  to="/admin/sellers/verification"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sellers</span>
                </Link>
                <Link to="/admin/catalogue" className="text-slate-700 hover:text-blue-600 transition">
                  Catalogue
                </Link>
                <Link to="/admin/orders" className="text-slate-700 hover:text-blue-600 transition">
                  Orders
                </Link>
                <Link to="/admin/delivery-proposals" className="text-slate-700 hover:text-blue-600 transition">
                  Rates
                </Link>
                <Link to="/admin/reviews" className="text-slate-700 hover:text-blue-600 transition">
                  Reviews
                </Link>
                <Link to="/admin/finance" className="text-slate-700 hover:text-blue-600 transition">
                  Finance
                </Link>
              </div>
            ) : user?.role === 'SELLER' ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <Link
                  to="/seller/dashboard"
                  className="flex items-center gap-1 text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200 transition font-medium"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Seller Portal</span>
                </Link>
                <Link to="/seller/products" className="text-slate-700 hover:text-blue-600 transition">
                  Inventory
                </Link>
                <Link to="/seller/orders" className="text-slate-700 hover:text-blue-600 transition">
                  Orders
                </Link>
                <Link to="/seller/finance" className="text-slate-700 hover:text-blue-600 transition">
                  Finance
                </Link>
                <Link to="/seller/promotions" className="text-slate-700 hover:text-blue-600 transition">
                  Promos
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {isAuthenticated && (
                  <Link
                    to="/orders"
                    className="flex items-center gap-1 text-slate-700 hover:text-blue-600 transition"
                  >
                    <Package className="w-3.5 h-3.5 text-slate-400" />
                    <span>My Orders</span>
                  </Link>
                )}
                <Link
                  to="/sellers/register"
                  className="flex items-center gap-1 text-slate-700 hover:text-blue-600 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>Sell on AutoDock</span>
                </Link>
              </div>
            )}
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-2">
            <NotificationBell />

            <Link
              to="/wishlist"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
              title="Saved Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              to="/cart"
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md relative transition"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 ml-1">
                <Link
                  to="/account/profile"
                  className="flex items-center gap-2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-md text-xs font-medium text-slate-800 transition border border-slate-200"
                  title={`${user.firstName} ${user.lastName} (${user.role})`}
                >
                  <span className="font-semibold text-slate-900">{user.firstName}</span>
                  <span className="text-[10px] text-blue-700 font-bold uppercase">
                    {user.role}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                  title="Sign Out"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-1">
                <Link
                  to="/login"
                  className="px-3 py-1.5 border border-slate-300 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-semibold transition"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search parts or OEM numbers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-8 pr-14 py-2 bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-2.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1 px-2.5 py-1 bg-blue-600 text-white rounded text-xs font-medium"
              >
                Go
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <Link
                to="/products"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-2 hover:bg-slate-100"
              >
                <Layers className="w-4 h-4 text-slate-500" />
                <span>Parts Catalog</span>
              </Link>
              <Link
                to="/garage"
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-md flex items-center gap-2 hover:bg-slate-100"
              >
                <Car className="w-4 h-4 text-slate-500" />
                <span>My Garage</span>
              </Link>
            </div>

            {/* Authenticated Links in Mobile */}
            {isAuthenticated ? (
              <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
                  Account ({user?.role})
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="space-y-1 text-xs font-semibold">
                    <Link
                      to="/admin/dashboard"
                      className="block p-2 rounded-lg text-blue-700 bg-blue-50 font-bold"
                    >
                      Executive Dashboard Overview
                    </Link>
                    <Link
                      to="/admin/sellers/verification"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Seller Verifications & Reviews
                    </Link>
                    <Link to="/admin/orders" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      Master Orders
                    </Link>
                    <Link to="/admin/delivery-proposals" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      Delivery Rates
                    </Link>
                    <Link to="/admin/reviews" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      Reviews Moderation
                    </Link>
                    <Link to="/admin/finance" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      Finance & Settlements
                    </Link>
                    <Link
                      to="/admin/notifications"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Operational Alerts & Delivery Retries
                    </Link>
                    <Link
                      to="/admin/audit-logs"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Security & Compliance Audit Logs
                    </Link>
                    <Link
                      to="/admin/reports"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Consolidated Platform Reports
                    </Link>
                    <Link
                      to="/notifications"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      My Notification Centre
                    </Link>
                  </div>
                )}

                {user?.role === 'SELLER' && (
                  <div className="space-y-1">
                    <Link to="/seller/dashboard" className="block p-1.5 text-emerald-800 font-medium hover:bg-emerald-50 rounded">
                      Seller Portal
                    </Link>
                    <Link to="/seller/products" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      Inventory Management
                    </Link>
                    <Link to="/seller/orders" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      Orders Fulfillment
                    </Link>
                    <Link to="/seller/delivery-rates" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      Delivery Rates
                    </Link>
                    <Link to="/seller/finance" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      Finance & Invoices
                    </Link>
                    <Link to="/seller/promotions" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      Promotions
                    </Link>
                    <Link
                      to="/notifications"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      My Notification Centre
                    </Link>
                  </div>
                )}

                {user?.role === 'CUSTOMER' && (
                  <div className="space-y-1">
                    <Link to="/orders" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      My Orders & Receipts
                    </Link>
                    <Link
                      to="/notifications"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      My Notification Centre
                    </Link>
                    <Link
                      to="/account/profile"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      My Account & Addresses
                    </Link>
                    <Link to="/sellers/register" className="block p-1.5 text-slate-700 hover:bg-slate-50 rounded">
                      Apply as Merchant
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left p-1.5 text-rose-600 hover:bg-rose-50 font-medium flex items-center gap-1.5 rounded"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex-1 py-2 text-center border border-slate-300 rounded-md text-xs font-semibold text-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="flex-1 py-2 text-center bg-blue-600 rounded-md text-xs font-semibold text-white"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      {/* Clean Modern Minimalist Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto pt-10 pb-8 text-xs">
        <div className="max-w-7xl mx-auto px-4 space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Column 1: Brand */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-blue-600 flex items-center justify-center text-white">
                  <Wrench className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="text-base font-bold text-white tracking-tight">AutoDock</span>
              </div>
              <p className="text-xs text-slate-400">
                Genuine automotive spare parts with guaranteed vehicle fitment.
              </p>
            </div>

            {/* Column 2: Catalog & Categories */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Categories
              </h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>
                  <Link to="/products?category=engine-and-drivetrain" className="hover:text-white transition">
                    Engine & Drivetrain
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=brakes-and-suspension" className="hover:text-white transition">
                    Brakes & Suspension
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=filters-and-fluids" className="hover:text-white transition">
                    Filters & Fluids
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=electrical-and-lighting" className="hover:text-white transition">
                    Electrical & Lights
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=transmission" className="hover:text-white transition">
                    Transmission
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Services */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Customer Services
              </h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>
                  <Link to="/garage" className="hover:text-white transition">
                    My Garage
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:text-white transition">
                    Track Orders
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-white transition">
                    Shopping Cart
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-white transition">
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Merchants & Support */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                Merchants & Support
              </h4>
              <ul className="space-y-1.5 text-slate-400">
                <li>
                  <Link to="/sellers/register" className="hover:text-white text-blue-400 font-medium transition">
                    Sell on AutoDock
                  </Link>
                </li>
                <li>
                  <a href="tel:+94112345678" className="hover:text-white transition">
                    Hotline: +94 11 234 5678
                  </a>
                </li>
                <li className="text-slate-500 pt-1">
                  Island-wide delivery across all 25 districts
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Copyright & Payment Badges */}
          <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              AutoDock — Sri Lanka Vehicle Spare-Parts Marketplace &copy; {new Date().getFullYear()}
            </div>

            <div className="flex items-center gap-3 text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>Cash on Delivery</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bank Deposit</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                <span>Cards</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
