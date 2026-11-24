import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Wrench,
  LayoutDashboard,
  ShieldCheck,
  Layers,
  Package,
  Truck,
  MessageSquare,
  FileBarChart,
  History,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../identity/context/AuthContext.js';
import { NotificationBell } from './NotificationBell.js';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  module: string;
}

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navGroups: { group: string; items: NavItem[] }[] = [
    {
      group: 'Overview & Operations',
      items: [
        {
          name: 'Executive Dashboard',
          href: '/admin/dashboard',
          icon: LayoutDashboard,
          module: 'MOD-05',
        },
        {
          name: 'Operations & Alerts',
          href: '/admin/notifications',
          icon: Bell,
          module: 'MOD-05',
        },
      ],
    },
    {
      group: 'Governance & Verification',
      items: [
        {
          name: 'Seller Verification',
          href: '/admin/sellers/verification',
          icon: ShieldCheck,
          module: 'MOD-01',
        },
        {
          name: 'Catalogue Taxonomy',
          href: '/admin/catalogue',
          icon: Layers,
          module: 'MOD-02',
        },
        {
          name: 'Customer Reviews',
          href: '/admin/reviews',
          icon: MessageSquare,
          module: 'MOD-02',
        },
      ],
    },
    {
      group: 'Orders & Logistics',
      items: [
        {
          name: 'Marketplace Orders',
          href: '/admin/orders',
          icon: Package,
          module: 'MOD-03',
        },
        {
          name: 'Delivery Proposals',
          href: '/admin/delivery-proposals',
          icon: Truck,
          module: 'MOD-03',
        },
      ],
    },
    {
      group: 'Auditing & Intelligence',
      items: [
        {
          name: 'Security Audit Logs',
          href: '/admin/audit-logs',
          icon: History,
          module: 'MOD-05',
        },
        {
          name: 'Platform Reports',
          href: '/admin/reports',
          icon: FileBarChart,
          module: 'MOD-05',
        },
      ],
    },
  ];

  // Helper to determine active link
  const isActive = (href: string) => {
    if (href === '/admin/dashboard' && (location.pathname === '/admin' || location.pathname === '/admin/dashboard')) {
      return true;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-900 selection:bg-blue-600 selection:text-white">
      {/* Top Admin Navigation Header */}
      <header className="bg-slate-950 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand & Mobile Hamburger */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl lg:hidden transition"
              aria-label="Toggle navigation drawer"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link to="/admin/dashboard" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Wrench className="w-4 h-4 text-white" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="text-base font-black tracking-tight text-white">AUTODOCK</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    Console
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-widest font-bold text-slate-400">
                  Administration Platform
                </span>
              </div>
            </Link>
          </div>

          {/* Right Header: Notification Bell, Customer Store link, Profile, Sign Out */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition border border-slate-800"
              title="Switch to customer marketplace storefront"
            >
              <span>Marketplace Store</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </Link>

            <NotificationBell />

            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold ring-2 ring-blue-500/30">
                  {user.firstName?.charAt(0) || 'A'}
                </div>
                <div className="hidden md:flex flex-col text-left">
                  <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold tracking-wider uppercase">
                    Platform Administrator
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                  title="Sign Out of Admin Console"
                  aria-label="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar */}
      <div className="flex-1 flex max-w-full">
        {/* Desktop Sidebar Navigation */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-slate-200/80 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:block pt-16 lg:pt-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-full flex flex-col justify-between p-4 overflow-y-auto">
            <div className="space-y-6">
              {navGroups.map((group, groupIdx) => (
                <div key={groupIdx} className="space-y-1.5">
                  <h3 className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400">
                    {group.group}
                  </h3>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.href}
                          to={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition group ${
                            active
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon
                              className={`w-4 h-4 transition ${
                                active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600'
                              }`}
                            />
                            <span>{item.name}</span>
                          </div>
                          <span
                            className={`text-[9px] uppercase font-bold px-1.5 py-0.5 rounded ${
                              active
                                ? 'bg-blue-700/60 text-blue-100'
                                : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                            }`}
                          >
                            {item.module}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Footer Badge */}
            <div className="pt-6 border-t border-slate-100">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
                  AutoDock Engine v1.0
                </span>
                <p className="text-[10px] text-slate-400">
                  MOD-01 • MOD-02 • MOD-03 • MOD-04 • MOD-05
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Backdrop */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-slate-950/50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Content Viewport */}
        <main className="flex-1 w-full min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
            <Link to="/admin/dashboard" className="hover:text-blue-600 transition">
              Admin Platform
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-700 capitalize">
              {location.pathname.replace('/admin/', '').replace('/', ' / ') || 'Dashboard'}
            </span>
          </div>

          <Outlet />
        </main>
      </div>
    </div>
  );
};
