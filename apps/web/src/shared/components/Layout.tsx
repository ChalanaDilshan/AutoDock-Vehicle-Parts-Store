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
  Tag,
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
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Notification / Trust Bar */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2 text-[11px] font-medium text-slate-300">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Verified Merchants</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>Sri Lanka Vehicle Spare-Parts Marketplace</span>
            <span className="text-slate-600">•</span>
            <span>Island-wide delivery across all 25 Sri Lankan districts</span>
          </div>

          <div className="hidden lg:flex items-center gap-4 text-[11px] text-slate-400">
            <span className="flex items-center gap-1 hover:text-slate-200 transition">
              <Phone className="w-3 h-3 text-blue-400" />
              <span>Hotline: +94 11 234 5678</span>
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-slate-300">
              <Building2 className="w-3 h-3 text-amber-400" />
              <span>Direct Bank Deposit & COD Supported</span>
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-3 sm:gap-6">
          {/* Brand Wordmark & Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black tracking-tight leading-none text-slate-900 flex items-center">
                <span>AUTO</span>
                <span className="text-blue-600">DOCK</span>
                <span className="text-amber-500 font-black">.</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-slate-400">
                Spare Parts LK
              </span>
            </div>
          </Link>

          {/* Integrated Desktop Global Search Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 max-w-md mx-2 relative items-center"
          >
            <input
              type="text"
              placeholder="Search spare parts, OEM numbers, or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-16 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <button
              type="submit"
              className="absolute right-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition shadow-xs"
            >
              Search
            </button>
          </form>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-700">
            <Link
              to="/products"
              className="hover:text-blue-600 py-1 transition flex items-center gap-1"
            >
              <span>Parts Catalog</span>
            </Link>

            <Link
              to="/garage"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/60 hover:bg-amber-100/80 transition"
              title="Access your saved vehicles for guaranteed fitment"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-600" />
              <span>My Garage</span>
            </Link>

            {/* Role-Specific Navigation */}
            {user?.role === 'ADMIN' ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <span className="text-[10px] font-black uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                  Admin Platform
                </span>
                <Link
                  to="/admin/sellers/verification"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <Shield className="w-3.5 h-3.5 text-blue-600" />
                  <span>Sellers</span>
                </Link>
                <Link
                  to="/admin/catalogue"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Catalogue</span>
                </Link>
                <Link
                  to="/admin/orders"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Orders</span>
                </Link>
                <Link
                  to="/admin/delivery-proposals"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rates</span>
                </Link>
                <Link
                  to="/admin/reviews"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  <span>Reviews</span>
                </Link>
                <Link
                  to="/admin/finance"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Finance</span>
                </Link>
              </div>
            ) : user?.role === 'SELLER' ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <Link
                  to="/seller/dashboard"
                  className="flex items-center gap-1.5 text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/70 transition"
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
                <Link
                  to="/seller/orders"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>Orders</span>
                </Link>
                <Link
                  to="/seller/delivery-rates"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <Truck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Delivery Rates</span>
                </Link>
                <Link
                  to="/seller/finance"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  <span>Finance</span>
                </Link>
                <Link
                  to="/seller/promotions"
                  className="flex items-center gap-1 hover:text-blue-600 text-slate-700 transition"
                >
                  <Tag className="w-3.5 h-3.5 text-blue-600" />
                  <span>Promos</span>
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {isAuthenticated && (
                  <Link
                    to="/orders"
                    className="flex items-center gap-1 text-slate-700 hover:text-blue-600 transition"
                  >
                    <Package className="w-3.5 h-3.5 text-blue-600" />
                    <span>My Orders</span>
                  </Link>
                )}
                <Link
                  to="/sellers/register"
                  className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Sell on AutoDock</span>
                </Link>
              </div>
            )}
          </div>

          {/* User & Cart Action Icons */}
          <div className="flex items-center gap-2">
            <Link
              to="/wishlist"
              className="p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition"
              title="Saved Wishlist"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5" />
            </Link>

            <Link
              to="/cart"
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl relative transition"
              aria-label="Shopping Cart"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
            </Link>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/account/profile"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 transition"
                  title={`${user.firstName} ${user.lastName} (${user.role})`}
                >
                  <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
                    {user.firstName.charAt(0)}
                  </div>
                  <span className="max-w-[90px] truncate hidden sm:inline">{user.firstName}</span>
                  <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-800 rounded font-bold uppercase">
                    {user.role}
                  </span>
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
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
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
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-5 space-y-4 shadow-xl animate-fadeIn">
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
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 hover:bg-blue-50 hover:text-blue-700"
              >
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Parts Catalog</span>
              </Link>
              <Link
                to="/garage"
                className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900 hover:bg-amber-100"
              >
                <Wrench className="w-4 h-4 text-amber-600" />
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
                      My Account & Addresses
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

      {/* Shared Modern Footer */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-auto pt-12 pb-8">
        <div className="max-w-7xl mx-auto px-4 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Column 1: Brand & Purpose */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">
                  <Wrench className="w-4 h-4 text-white" />
                </div>
                <span className="text-lg font-black tracking-tight text-white">
                  AutoDock<span className="text-amber-500">.</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sri Lanka's dedicated multi-vendor marketplace for automotive spare parts. Eliminating fitment mismatch with virtual garages and connecting vehicle owners directly with verified local merchants.
              </p>
              <div className="pt-1 flex items-center gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>25 Sri Lankan Districts Covered</span>
              </div>
            </div>

            {/* Column 2: Parts Categories */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Popular Categories
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/products?category=engine-and-drivetrain" className="hover:text-blue-400 transition">
                    Engine & Drivetrain Components
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=brakes-and-suspension" className="hover:text-blue-400 transition">
                    Brake Pads, Rotors & Suspension
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=filters-and-fluids" className="hover:text-blue-400 transition">
                    Filters, Spark Plugs & Lubricants
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=electrical-and-lighting" className="hover:text-blue-400 transition">
                    Electrical, Sensors & Headlamps
                  </Link>
                </li>
                <li>
                  <Link to="/products?category=transmission" className="hover:text-blue-400 transition">
                    Transmission & Clutch Kits
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Customer Care & Services */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Customer Services
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link to="/garage" className="hover:text-blue-400 transition">
                    My Garage (Fitment Guarantee)
                  </Link>
                </li>
                <li>
                  <Link to="/orders" className="hover:text-blue-400 transition">
                    Track Orders & Bank Receipts
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="hover:text-blue-400 transition">
                    Multi-Seller Shopping Cart
                  </Link>
                </li>
                <li>
                  <Link to="/privacy-policy" className="hover:text-blue-400 transition">
                    Privacy Policy & Verification Notice (v1.2)
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 4: Merchant Storefront */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                For Auto Merchants
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Operate a physical spare parts shop or online enterprise? Register to sell genuine parts directly across Sri Lanka.
              </p>
              <Link
                to="/sellers/register"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Register as Merchant</span>
              </Link>
            </div>
          </div>

          {/* Bottom Bar: Copyright, Payment Badges & Project Acknowledgement */}
          <div className="pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="space-y-1 text-center sm:text-left">
              <p className="font-medium text-slate-400">
                AutoDock — Sri Lanka Vehicle Spare-Parts Marketplace
              </p>
              <p>© {new Date().getFullYear()} AutoDock Platform. Developed for University Undergraduate Project.</p>
            </div>

            {/* Payment Method Trust Badges */}
            <div className="flex items-center gap-3 text-[11px] text-slate-400 bg-slate-950/60 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="font-semibold text-slate-300">Accepted:</span>
              <span className="inline-flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-400" />
                <span>Cash on Delivery</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Direct Bank Transfer</span>
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-purple-400" />
                <span>Cards (Sandbox)</span>
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
