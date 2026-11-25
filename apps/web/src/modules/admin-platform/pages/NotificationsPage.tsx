import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  ExternalLink,
  Loader2,
  AlertCircle,
  Clock,
  ShieldAlert,
  CreditCard,
  Package,
  Wrench,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminPlatformApi, NotificationItem, NotificationPagination } from '../api/adminPlatformApi.js';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [pagination, setPagination] = useState<NotificationPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Filters
  const [filterUnreadOnly, setFilterUnreadOnly] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isMarkingAll, setIsMarkingAll] = useState<boolean>(false);
  const [pendingReadIds, setPendingReadIds] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchNotifications = async (
    page: number = 1,
    unreadOnly: boolean = filterUnreadOnly,
    category: string = selectedCategory
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminPlatformApi.getMyNotifications({
        page,
        limit: 20,
        isRead: unreadOnly ? false : undefined,
        category: category || undefined,
      });

      if (res.success && res.data) {
        setNotifications(res.data);
        if (res.meta) {
          setUnreadCount(res.meta.unreadCount);
          setPagination(res.meta.pagination);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to retrieve your notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, filterUnreadOnly, selectedCategory);
  }, [filterUnreadOnly, selectedCategory]);

  const handleMarkAsRead = async (id: string) => {
    if (pendingReadIds.has(id)) return;
    setPendingReadIds((prev) => new Set(prev).add(id));

    try {
      await adminPlatformApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Error handled silently
    } finally {
      setPendingReadIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await adminPlatformApi.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to mark all notifications as read.');
    } finally {
      setIsMarkingAll(false);
    }
  };

  const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    ORDER: Package,
    PAYMENT: CreditCard,
    VERIFICATION: ShieldAlert,
    FINANCE: CreditCard,
    SYSTEM: Wrench,
    SECURITY: ShieldAlert,
  };

  const categoryBadges: Record<string, string> = {
    ORDER: 'bg-blue-50 text-blue-700 border-blue-200',
    PAYMENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    VERIFICATION: 'bg-amber-50 text-amber-700 border-amber-200',
    FINANCE: 'bg-purple-50 text-purple-700 border-purple-200',
    SYSTEM: 'bg-slate-100 text-slate-700 border-slate-200',
    SECURITY: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header & Mark All Read */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                Notification Centre
              </h1>
              {unreadCount > 0 && (
                <span className="text-xs font-black uppercase tracking-wider bg-rose-600 text-white px-2.5 py-0.5 rounded-full">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Updates regarding vehicle spare-part orders, bank slips, verifications, and system events.
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            disabled={isMarkingAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs disabled:opacity-50 shrink-0"
          >
            {isMarkingAll ? (
              <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
            ) : (
              <CheckCheck className="w-4 h-4 text-emerald-400" />
            )}
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Tabs & Category Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Read / Unread Tabs */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(false)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                !filterUnreadOnly
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Notifications
            </button>
            <button
              type="button"
              onClick={() => setFilterUnreadOnly(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterUnreadOnly
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Unread Only ({unreadCount})
            </button>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All Categories</option>
              <option value="ORDER">Orders & Shipments</option>
              <option value="PAYMENT">Payments & Slips</option>
              <option value="VERIFICATION">Seller Verification</option>
              <option value="FINANCE">Invoices & Fees</option>
              <option value="SYSTEM">System Notices</option>
              <option value="SECURITY">Security Alerts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notification Stream */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Fetching notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200 space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-900">
              No notifications found
            </h3>
            <p className="text-xs text-slate-400">
              {filterUnreadOnly
                ? 'You have zero unread notifications.'
                : 'No alerts match the selected criteria.'}
            </p>
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = categoryIcons[n.category] || Bell;
            const badgeStyle = categoryBadges[n.category] || 'bg-slate-100 text-slate-700';

            return (
              <div
                key={n.id}
                className={`p-5 rounded-2xl border transition shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4 ${
                  n.isRead
                    ? 'bg-white border-slate-200/80 hover:border-slate-300'
                    : 'bg-blue-50/30 border-blue-200 hover:border-blue-300 ring-1 ring-blue-500/10'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                      n.isRead
                        ? 'bg-slate-50 border-slate-200 text-slate-500'
                        : 'bg-blue-600 border-blue-600 text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {n.title}
                      </span>
                      <span
                        className={`text-[9px] uppercase font-black px-2 py-0.5 rounded-full border ${badgeStyle}`}
                      >
                        {n.category}
                      </span>
                      {!n.isRead && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 block shrink-0" title="Unread" />
                      )}
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {n.message}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>
                          {new Date(n.createdAt).toLocaleString('en-LK', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </span>
                      </span>

                      {n.actionUrl && (
                        <Link
                          to={n.actionUrl}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold transition"
                        >
                          <span>Open Related Item</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mark as read button */}
                {!n.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkAsRead(n.id)}
                    disabled={pendingReadIds.has(n.id)}
                    className="shrink-0 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition disabled:opacity-50 flex items-center gap-1.5 self-end sm:self-auto"
                  >
                    {pendingReadIds.has(n.id) ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>Mark Read</span>
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80 text-xs">
          <span className="text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} Total)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => fetchNotifications(pagination.page - 1)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchNotifications(pagination.page + 1)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
