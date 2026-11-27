import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Wrench,
  Search,
  ShoppingCart,
  Heart,
  LogOut,
  Menu,
  X,
  Car,
  Package,
  Store,
  ShieldCheck,
  User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../modules/identity/context/AuthContext.js';
import { NotificationBell } from '../../modules/admin-platform/components/NotificationBell.js';
import { Button } from './Button.js';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      navigate(`/products?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate('/products');
    }
    setMobileMenuOpen(false);
  };

  const role = user?.role;
  const isSeller = isAuthenticated && role === 'SELLER';
  const isAdmin = isAuthenticated && role === 'ADMIN';
  const isCustomer = isAuthenticated && role === 'CUSTOMER';

  const navLinkClass = (active: boolean) =>
    `text-sm font-medium whitespace-nowrap transition-colors ${
      active ? 'text-[#E11D30]' : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      {/* Subtle announcement bar on larger viewports */}
      <div className="hidden sm:block bg-[#0B121F] border-b border-slate-800 text-slate-200 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-8 flex items-center justify-between gap-4">
          <p className="truncate">
            <span className="text-[#FB2C36] font-semibold">Island-wide spare parts delivery</span>{' '}
            across Sri Lanka &middot; LKR checkout
          </p>
          <div className="flex items-center gap-4 shrink-0">
            <span className="text-slate-400">Support: +94 11 234 5678</span>
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="text-white font-medium hover:text-[#FB2C36] transition-colors"
              >
                Admin Console &rarr;
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 lg:gap-6">
        {/* Brand */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 shrink-0 focus-visible:outline-none"
        >
          <span className="w-8 h-8 rounded-md bg-[#E11D30] text-white flex items-center justify-center shrink-0">
            <Wrench className="w-4 h-4" aria-hidden="true" />
          </span>
          <span className="text-lg font-bold tracking-tight leading-none">
            <span className="text-slate-900">AUTO</span>
            <span className="text-[#E11D30]">DOCK</span>
          </span>
        </Link>

        {/* Desktop Search */}
        <form
          onSubmit={handleSearchSubmit}
          className="hidden md:flex flex-1 max-w-md lg:max-w-lg items-center"
        >
          <div className="relative w-full">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search parts, OEM numbers, or brands..."
              aria-label="Search parts"
              className="w-full h-9 pl-9 pr-20 rounded-lg border border-slate-300 bg-slate-50 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-[#E11D30] focus:outline-none focus:ring-2 focus:ring-[#E11D30]/15 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3 rounded-md bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        {/* Desktop Primary Navigation */}
        <nav
          aria-label="Primary navigation"
          className="hidden lg:flex items-center gap-5 shrink-0"
        >
          <Link
            to="/products"
            className={navLinkClass(location.pathname.startsWith('/products'))}
          >
            Parts Catalog
          </Link>
          <Link
            to="/garage"
            className={navLinkClass(location.pathname.startsWith('/garage'))}
          >
            My Garage
          </Link>
          {isCustomer && (
            <Link
              to="/orders"
              className={navLinkClass(location.pathname.startsWith('/orders'))}
            >
              My Orders
            </Link>
          )}
          {isSeller && (
            <Link
              to="/seller/dashboard"
              className={navLinkClass(location.pathname.startsWith('/seller'))}
            >
              Seller Portal
            </Link>
          )}
          {!isSeller && !isAdmin && (
            <Link
              to="/seller/register"
              className={navLinkClass(location.pathname.startsWith('/seller'))}
            >
              Sell on AutoDock
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium whitespace-nowrap transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Admin Console</span>
            </Link>
          )}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <NotificationBell />

          <Link
            to="/wishlist"
            aria-label="Wishlist"
            title="Saved Wishlist"
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <Heart className="w-4 h-4" aria-hidden="true" />
          </Link>

          <Link
            to="/cart"
            aria-label="Shopping Cart"
            title="Shopping Cart"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" aria-hidden="true" />
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/account/profile"
                className="hidden sm:inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors max-w-[200px]"
              >
                <span className="w-5 h-5 rounded-full bg-red-50 text-[#E11D30] flex items-center justify-center font-semibold shrink-0">
                  {(user?.firstName?.[0] || 'U').toUpperCase()}
                </span>
                <span className="truncate">{user?.firstName || 'Account'}</span>
                <span className="text-[10px] font-semibold uppercase text-slate-500 shrink-0">
                  {user?.role}
                </span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign Out"
                title="Sign Out"
                className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">
                  Register
                </Button>
              </Link>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Menu className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Seller Workspace Quick Bar (Desktop) */}
      {isSeller && (
        <div className="hidden lg:block bg-slate-50 border-t border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center gap-6 text-xs font-medium text-slate-600 overflow-x-auto">
            <span className="text-slate-400 uppercase tracking-wider font-semibold shrink-0">
              Merchant Tools
            </span>
            <Link to="/seller/products" className="hover:text-[#E11D30] whitespace-nowrap">
              Inventory
            </Link>
            <Link to="/seller/orders" className="hover:text-[#E11D30] whitespace-nowrap">
              Orders
            </Link>
            <Link to="/seller/promotions" className="hover:text-[#E11D30] whitespace-nowrap">
              Promos
            </Link>
            <Link to="/seller/delivery-rates" className="hover:text-[#E11D30] whitespace-nowrap">
              Delivery Rates
            </Link>
            <Link to="/seller/finance" className="hover:text-[#E11D30] whitespace-nowrap">
              Finance &amp; Invoices
            </Link>
            <Link to="/seller/reviews" className="hover:text-[#E11D30] whitespace-nowrap">
              Reviews
            </Link>
          </div>
        </div>
      )}

      {/* Mobile Navigation & Search Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4 shadow-md">
          <form onSubmit={handleSearchSubmit} className="relative flex items-center md:hidden">
            <Search
              className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spare parts, SKU, OEM..."
              aria-label="Mobile search parts"
              className="w-full h-9 pl-9 pr-16 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#E11D30] focus:outline-none"
            />
            <button
              type="submit"
              className="absolute right-1 h-7 px-2.5 rounded-md bg-slate-900 text-white text-xs font-medium"
            >
              Go
            </button>
          </form>

          <nav className="grid grid-cols-1 gap-1" aria-label="Mobile navigation">
            <Link
              to="/products"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Package className="w-4 h-4 text-slate-500" />
              <span>Parts Catalog</span>
            </Link>
            <Link
              to="/garage"
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              <Car className="w-4 h-4 text-slate-500" />
              <span>My Garage</span>
            </Link>
            {isAuthenticated && (
              <Link
                to="/wishlist"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Heart className="w-4 h-4 text-slate-500" />
                <span>Saved Wishlist</span>
              </Link>
            )}
            {isCustomer && (
              <Link
                to="/orders"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Package className="w-4 h-4 text-slate-500" />
                <span>My Orders</span>
              </Link>
            )}
            {isSeller && (
              <>
                <Link
                  to="/seller/dashboard"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-[#E11D30] bg-red-50"
                >
                  <Store className="w-4 h-4" />
                  <span>Seller Portal</span>
                </Link>
                <div className="pl-9 grid grid-cols-2 gap-1 py-1 text-xs font-medium text-slate-600">
                  <Link to="/seller/products" className="py-1.5 hover:text-slate-900">
                    Inventory
                  </Link>
                  <Link to="/seller/orders" className="py-1.5 hover:text-slate-900">
                    Orders
                  </Link>
                  <Link to="/seller/promotions" className="py-1.5 hover:text-slate-900">
                    Promos
                  </Link>
                  <Link to="/seller/finance" className="py-1.5 hover:text-slate-900">
                    Finance
                  </Link>
                </div>
              </>
            )}
            {!isSeller && !isAdmin && (
              <Link
                to="/seller/register"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                <Store className="w-4 h-4 text-slate-500" />
                <span>Sell on AutoDock</span>
              </Link>
            )}
            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-white bg-slate-900"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Console</span>
              </Link>
            )}
          </nav>

          <div className="border-t border-slate-200 pt-3">
            {isAuthenticated ? (
              <div className="flex items-center justify-between gap-3">
                <Link
                  to="/account/profile"
                  className="flex items-center gap-2.5 text-sm font-medium text-slate-800"
                >
                  <UserIcon className="w-4 h-4 text-slate-500" />
                  <span>
                    {user?.firstName} {user?.lastName}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 text-xs font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" fullWidth>
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" fullWidth>
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
