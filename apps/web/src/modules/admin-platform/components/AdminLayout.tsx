import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Tags,
  MessageSquare,
  ShoppingCart,
  Truck,
  Landmark,
  Receipt,
  CreditCard,
  Percent,
  Bell,
  ShieldAlert,
  FileSpreadsheet,
  Wrench,
  Menu,
  X,
  LogOut,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../identity/context/AuthContext.js';
import { NotificationBell } from './NotificationBell.js';

interface NavGroup {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ReactNode;
    matchPrefix?: string;
  }[];
}

export const AdminLayout: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navGroups: NavGroup[] = [
    {
      title: 'Overview',
      items: [
        {
          label: 'Executive Dashboard',
          href: '/admin/dashboard',
          icon: <LayoutDashboard className="w-4 h-4" />,
        },
        {
          label: 'Operational Alerts',
          href: '/admin/notifications',
          icon: <Bell className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'Marketplace Operations',
      items: [
        {
          label: 'Seller Verification',
          href: '/admin/sellers/verification',
          matchPrefix: '/admin/sellers',
          icon: <Users className="w-4 h-4" />,
        },
        {
          label: 'Catalogue Taxonomy',
          href: '/admin/catalogue',
          icon: <Tags className="w-4 h-4" />,
        },
        {
          label: 'Review Moderation',
          href: '/admin/reviews',
          icon: <MessageSquare className="w-4 h-4" />,
        },
        {
          label: 'Marketplace Orders',
          href: '/admin/orders',
          icon: <ShoppingCart className="w-4 h-4" />,
        },
        {
          label: 'Delivery Rates',
          href: '/admin/delivery-proposals',
          icon: <Truck className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'Finance & Promotions',
      items: [
        {
          label: 'Finance Overview',
          href: '/admin/finance',
          icon: <Landmark className="w-4 h-4" />,
        },
        {
          label: 'Payment Queue',
          href: '/admin/finance/verification-queue',
          icon: <CreditCard className="w-4 h-4" />,
        },
        {
          label: 'Commission Invoices',
          href: '/admin/finance/invoices',
          icon: <Receipt className="w-4 h-4" />,
        },
        {
          label: 'Commission & Rates',
          href: '/admin/finance/commission-rate',
          icon: <Percent className="w-4 h-4" />,
        },
      ],
    },
    {
      title: 'Governance & Reports',
      items: [
        {
          label: 'Security Audit Logs',
          href: '/admin/audit-logs',
          icon: <ShieldAlert className="w-4 h-4" />,
        },
        {
          label: 'Platform Reports',
          href: '/admin/reports',
          icon: <FileSpreadsheet className="w-4 h-4" />,
        },
      ],
    },
  ];

  const isActive = (item: { href: string; matchPrefix?: string }) => {
    if (item.href === '/admin/dashboard') {
      return location.pathname === '/admin' || location.pathname === '/admin/dashboard';
    }
    if (item.href === '/admin/finance') {
      return location.pathname === '/admin/finance';
    }
    if (item.matchPrefix && location.pathname.startsWith(item.matchPrefix)) {
      return true;
    }
    return location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
  };

  const renderNavLinks = () => (
    <div className="space-y-6">
      {navGroups.map((group) => (
        <div key={group.title} className="space-y-1">
          <div className="px-3 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {group.title}
          </div>
          <nav className="space-y-0.5">
            {group.items.map((item) => {
              const active = isActive(item);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-red-50 text-[#E11D30]'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <span className={active ? 'text-[#E11D30]' : 'text-slate-500'}>
                    {item.icon}
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Unified Navigation Sidebar (Desktop pinned / Mobile slide-over) */}
      <aside
        className={
          sidebarOpen
            ? 'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white border-r border-slate-200 shadow-md flex flex-col'
            : 'hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-slate-200 sticky top-0 h-screen'
        }
      >
        <div className="h-16 px-4 border-b border-slate-200 flex items-center justify-between gap-2.5 shrink-0">
          <Link to="/admin/dashboard" className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-md bg-[#E11D30] text-white flex items-center justify-center shrink-0">
              <Wrench className="w-4 h-4" aria-hidden="true" />
            </span>
            <div className="leading-none">
              <span className="text-base font-bold tracking-tight text-slate-900">
                AUTODOCK
              </span>
              <span className="ml-1.5 text-xs font-medium text-[#E11D30] bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                Console
              </span>
            </div>
          </Link>
          {sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close navigation drawer"
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-5">
          {renderNavLinks()}
        </div>

        <div className="p-3 border-t border-slate-200 bg-slate-50/70">
          <Link
            to="/"
            onClick={() => setSidebarOpen(false)}
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-white hover:text-slate-900 border border-slate-200 transition-colors"
          >
            <span>Return to Storefront</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Toggle navigation drawer"
              className="lg:hidden inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 shrink-0"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="text-sm text-slate-500 truncate">
              <Link to="/admin/dashboard" className="hover:text-slate-900 transition-colors">
                Admin
              </Link>
              <span className="mx-1.5 text-slate-300">/</span>
              <span className="font-medium text-slate-900 capitalize">
                {location.pathname.replace(/^\/admin\/?/, '').replace(/\//g, ' · ') || 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <NotificationBell />
            <div className="hidden sm:flex items-center gap-2.5 pl-2 border-l border-slate-200">
              <div className="text-right leading-tight">
                <div className="text-xs font-semibold text-slate-900">
                  {user?.firstName} {user?.lastName}
                </div>
                <div className="text-[11px] text-slate-500">
                  Platform Administrator
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Sign Out"
                aria-label="Sign Out"
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
