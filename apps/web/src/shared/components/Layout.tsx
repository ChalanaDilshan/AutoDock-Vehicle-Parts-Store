import React, { useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  Wrench,
  ShieldCheck,
  User,
  LogOut,
  Shield,
  Heart,
  Layers,
  MessageSquare,
  Package,
  Truck,
  Search,
  Menu,
  X,
  CreditCard,
  Building2,
  Phone,
  CheckCircle2,
  DollarSign,
  Car,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../modules/identity/context/AuthContext.js';

export const Layout: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
      {/* Top Precision Notification / Trust Bar */}
      <div className="bg-[#0b0f19] text-slate-300 text-xs py-2 px-4 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] font-medium text-slate-300">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <CheckCircle2 className="w-3 h-3" />
              <span>100% Vetted Merchants</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="font-semibold text-slate-200">
              Sri Lanka Vehicle Spare-Parts Marketplace
            </span>
            <span className="text-slate-600 hidden md:inline">•</span>
            <span className="text-slate-400 hidden md:inline">
              Doorstep delivery across all 25 districts
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-300">
            <a
              href="tel:+94112345678"
              className="inline-flex items-center gap-1.5 text-slate-300 hover:text-white transition"
              title="Customer Care Hotline"
            >
              <div className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center">
                <Phone className="w-2.5 h-2.5" />
              </div>
              <span className="font-medium">+94 11 234 5678</span>
            </a>
            <span className="text-slate-700">|</span>
            <span className="inline-flex items-center gap-1 text-amber-300/90 font-medium">
              <Building2 className="w-3 h-3 text-amber-400" />
              <span>BOC Bank Deposit & COD</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.06)]">
        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Wordmark & Logo */}
          <Link to="/" className="flex items-center gap-3 shrink-0 group">
            <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-slate-900 via-blue-900 to-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 group-hover:shadow-blue-500/30 transition-all duration-300 border border-slate-800">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <Wrench className="w-5 h-5 text-amber-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
            <div className="flex flex-col">
              <div className="text-xl sm:text-2xl font-black tracking-tight leading-none text-slate-900 flex items-center">
                <span className="tracking-tight text-slate-900">AUTO</span>
                <span className="text-blue-600 tracking-tight ml-0.5">DOCK</span>
                <span className="text-amber-500 font-black text-2xl leading-none">.</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400 mt-0.5 flex items-center gap-1">
                <span>Genuine Parts LK</span>
                <span className="w-1 h-1 rounded-full bg-emerald-500" />
              </span>
            </div>
          </Link>

          {/* Integrated Desktop Global Command Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-lg mx-2 relative items-center"
          >
            <div className="relative w-full flex items-center">
              <input
                type="text"
                placeholder="Search by part name, OEM chassis code, or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-10 pr-20 py-2.5 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-slate-200/90 focus:border-blue-500 rounded-xl focus:ring-4 focus:ring-blue-500/10 transition-all outline-none font-medium text-slate-800 placeholder:text-slate-400 shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1"
              >
                <span>Search</span>
              </button>
            </div>
          </form>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-4 text-xs font-semibold text-slate-700">
            <Link
              to="/products"
              className="px-3 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100/70 transition flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Parts Catalog</span>
            </Link>

            <Link
              to="/garage"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200/80 hover:bg-amber-100/90 hover:border-amber-300 transition shadow-xs group"
              title="Access your saved vehicles for guaranteed fitment"
            >
              <Car className="w-3.5 h-3.5 text-amber-600 group-hover:scale-110 transition" />
              <span>My Garage</span>
              <span className="ml-0.5 text-[10px] font-bold bg-amber-500 text-white px-1.5 py-0.2 rounded-full">
                Fitment
              </span>
            </Link>

            {/* Role-Specific Navigation Workstations */}
            {user?.role === 'ADMIN' ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 bg-blue-100/70 px-2.5 py-1 rounded-lg border border-blue-200">
                  Admin Platform
                </span>
                <Link
                  to="/admin/sellers/verification"
                  className="p-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition"
                  title="Seller Verifications"
                >
                  <Shield className="w-4 h-4 text-blue-600" />
                </Link>
                <Link
                  to="/admin/catalogue"
                  className="p-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition"
                  title="Catalogue Taxonomy"
                >
                  <Layers className="w-4 h-4 text-blue-600" />
                </Link>
                <Link
                  to="/admin/orders"
                  className="p-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition"
                  title="Orders Oversight"
                >
                  <Package className="w-4 h-4 text-blue-600" />
                </Link>
                <Link
                  to="/admin/delivery-proposals"
                  className="p-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition"
                  title="Delivery Rates"
                >
                  <Truck className="w-4 h-4 text-blue-600" />
                </Link>
                <Link
                  to="/admin/reviews"
                  className="p-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition"
                  title="Review Moderation"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                </Link>
                <Link
                  to="/admin/finance"
                  className="p-1.5 rounded-lg text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition"
                  title="Settlements & Finance"
                >
                  <DollarSign className="w-4 h-4 text-blue-600" />
                </Link>
              </div>
            ) : user?.role === 'SELLER' ? (
              <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
                <Link
                  to="/seller/dashboard"
                  className="flex items-center gap-1.5 text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200/80 transition font-bold"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Seller Portal</span>
                </Link>
                <Link
                  to="/seller/products"
                  className="px-2.5 py-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Inventory
                </Link>
                <Link
                  to="/seller/orders"
                  className="px-2.5 py-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Orders
                </Link>
                <Link
                  to="/seller/finance"
                  className="px-2.5 py-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Finance
                </Link>
                <Link
                  to="/seller/promotions"
                  className="px-2.5 py-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Promos
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {isAuthenticated && (
                  <Link
                    to="/orders"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition"
                  >
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <span>My Orders</span>
                  </Link>
                )}
                <Link
                  to="/sellers/register"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sell on AutoDock</span>
                </Link>
              </div>
            )}
          </div>

          {/* User & Cart Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/wishlist"
              className="p-2 sm:p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-100"
              title="Saved Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              to="/cart"
              className="p-2 sm:p-2.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl relative transition border border-transparent hover:border-blue-100"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-1.5 ml-1">
                <Link
                  to="/account/profile"
                  className="flex items-center gap-2 pl-1 pr-3 py-1 bg-slate-100 hover:bg-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 transition border border-slate-200"
                  title={`${user.firstName} ${user.lastName} (${user.role})`}
                >
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-700 to-blue-500 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {user.firstName.charAt(0)}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="max-w-[80px] sm:max-w-[110px] truncate leading-tight font-bold text-slate-900">
                      {user.firstName}
                    </span>
                    <span className="text-[9px] uppercase tracking-wider text-blue-600 font-extrabold">
                      {user.role}
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-50 transition shadow-2xs"
                >
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-xs font-bold transition shadow-xs shadow-blue-500/20 active:scale-95"
                >
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 lg:hidden text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Slide-Out Drawer Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Global Search Form */}
            <form onSubmit={handleSearchSubmit} className="relative flex items-center">
              <input
                type="text"
                placeholder="Search spare parts or OEM..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-14 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Go
              </button>
            </form>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <Link
                to="/products"
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700 transition"
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Parts Catalog</span>
              </Link>
              <Link
                to="/garage"
                className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900 hover:bg-amber-100 transition"
              >
                <Car className="w-4 h-4 text-amber-600" />
                <span>My Garage</span>
              </Link>
            </div>

            {/* Authenticated Links in Mobile */}
            {isAuthenticated ? (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
                  User Workstation ({user?.role})
                </div>

                {user?.role === 'ADMIN' && (
                  <div className="space-y-1 text-xs font-semibold">
                    <Link
                      to="/admin/sellers/verification"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Seller Verifications & Reviews
                    </Link>
                    <Link
                      to="/admin/catalogue"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Catalogue Taxonomy & Brands
                    </Link>
                    <Link
                      to="/admin/orders"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Master Orders & Oversight
                    </Link>
                    <Link
                      to="/admin/delivery-proposals"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Seller Delivery Rate Approvals
                    </Link>
                    <Link
                      to="/admin/reviews"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Customer Reviews Moderation
                    </Link>
                    <Link
                      to="/admin/finance"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Platform Finance & Settlements
                    </Link>
                  </div>
                )}

                {user?.role === 'SELLER' && (
                  <div className="space-y-1 text-xs font-semibold">
                    <Link
                      to="/seller/dashboard"
                      className="block p-2 rounded-lg text-emerald-700 font-bold hover:bg-emerald-50"
                    >
                      Seller Portal & Metrics
                    </Link>
                    <Link
                      to="/seller/products"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Inventory & Stock Management
                    </Link>
                    <Link
                      to="/seller/orders"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Suborders Fulfillment & Receipts
                    </Link>
                    <Link
                      to="/seller/delivery-rates"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      District Delivery Charge Proposals
                    </Link>
                    <Link
                      to="/seller/finance"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Finance Overview & Invoices
                    </Link>
                    <Link
                      to="/seller/promotions"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      Seller Promotion Coupons
                    </Link>
                  </div>
                )}

                {user?.role === 'CUSTOMER' && (
                  <div className="space-y-1 text-xs font-semibold">
                    <Link
                      to="/orders"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      My Order History & Receipts
                    </Link>
                    <Link
                      to="/account/profile"
                      className="block p-2 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      My Account & Saved Vehicles
                    </Link>
                    <Link
                      to="/sellers/register"
                      className="block p-2 rounded-lg text-emerald-700 hover:bg-emerald-50"
                    >
                      Sell on AutoDock (Merchant Application)
                    </Link>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left p-2 rounded-lg text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <Link
                  to="/login"
                  className="block p-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-bold text-center"
                >
                  Sign In
                </Link>
                <Link
                  to="/sellers/register"
                  className="block p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold text-center"
                >
                  Sell on AutoDock (Merchant Onboarding)
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

      {/* Modern High-Trust Automotive Footer */}
      <footer className="bg-[#0b0f19] text-slate-400 border-t border-slate-800 mt-auto pt-14 pb-10">
        <div className="max-w-7xl mx-auto px-4 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1: Brand & Purpose */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-blue-600 flex items-center justify-center text-white border border-slate-700 shadow-md">
                  <Wrench className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex items-center text-xl font-black tracking-tight text-white">
                  AutoDock<span className="text-amber-500">.</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sri Lanka's dedicated multi-vendor marketplace for automotive spare parts. Eliminating fitment mismatch with virtual garages and connecting vehicle owners directly with verified local merchants.
              </p>
              <div className="pt-1 space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>25 Sri Lankan Districts Covered</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
                  <span>100% Genuine & Verified Merchants</span>
                </div>
              </div>
            </div>

            {/* Column 2: Parts Categories */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                Popular Categories
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/products?category=engine-and-drivetrain" className="hover:text-blue-400 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>Engine & Drivetrain Components</span>
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=brakes-and-suspension" className="hover:text-blue-400 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>Brake Pads, Rotors & Suspension</span>
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=filters-and-fluids" className="hover:text-blue-400 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>Filters, Spark Plugs & Lubricants</span>
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=electrical-and-lighting" className="hover:text-blue-400 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>Electrical, Sensors & Headlamps</span>
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=transmission" className="hover:text-blue-400 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>Transmission & Clutch Kits</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Care & Services */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                Customer Services
              </h4>
              <ul className="space-y-2.5 text-xs">
                <li>
                  <Link to="/garage" className="hover:text-blue-400 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>My Garage (Fitment Guarantee)</span>
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:text-blue-400 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>Track Orders & Bank Receipts</span>
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-blue-400 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>Multi-Seller Shopping Cart</span>
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-blue-400 transition flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3 text-slate-600" />
                    <span>Privacy Policy & Verification Notice</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Merchant Storefront */}
            <div className="space-y-4">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-200">
                For Auto Merchants
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operate a physical spare parts shop or enterprise in Sri Lanka? Register to sell genuine parts directly across all 25 districts.
              </p>
              <Link
                to="/sellers/register"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-600/20 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-300" />
                <span>Register as Merchant</span>
              </Link>
            </div>
          </div>

          {/* Bottom Bar: Copyright, Payment Badges & Marketplace Note */}
          <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-semibold text-slate-300">
                Sri Lanka Vehicle Spare-Parts Marketplace
              </p>
              <p className="text-[11px] text-slate-500">
                © {new Date().getFullYear()} AutoDock Platform. Certified Sri Lankan Automotive Spare-Parts Network.
              </p>
            </div>

            {/* Payment Method Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 text-[11px] text-slate-400 bg-slate-900/90 px-4 py-2 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-300">Accepted:</span>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>Cash on Delivery</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bank of Ceylon Deposit</span>
              </span>
              <span className="text-slate-700">•</span>
              <span className="inline-flex items-center gap-1 text-slate-300">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                <span>Cards & Online</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
