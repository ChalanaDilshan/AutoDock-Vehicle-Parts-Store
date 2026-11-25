import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import {
  adminPlatformApi,
  NotificationItem,
} from '../api/adminPlatformApi.js';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  PageHeader,
} from '../../../shared/components/index.js';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadNotifications = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminPlatformApi.getMyNotifications({
        category: categoryFilter || undefined,
        limit: 20,
      });
      if (res.success && Array.isArray(res.data)) {
        setNotifications(res.data);
        setUnreadCount(res.meta?.unreadCount ?? 0);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [categoryFilter]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await adminPlatformApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to update notification.');
    }
  };

  const handleMarkAll = async () => {
    try {
      await adminPlatformApi.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to mark notifications read.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title="Notification Centre"
        subtitle="Stay updated on orders, verification updates, and commission statements"
        badge={<Badge variant="primary">{unreadCount} Unread</Badge>}
        actions={
          <Button
            variant="outline"
            size="sm"
            disabled={unreadCount === 0}
            leftIcon={<CheckCheck className="w-4 h-4" />}
            onClick={handleMarkAll}
          >
            Mark All as Read
          </Button>
        }
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap gap-2">
        {[
          { value: '', label: 'All' },
          { value: 'ORDER', label: 'Orders' },
          { value: 'PAYMENT', label: 'Payments' },
          { value: 'VERIFICATION', label: 'Verification' },
          { value: 'FINANCE', label: 'Finance' },
          { value: 'SYSTEM', label: 'System' },
        ].map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCategoryFilter(tab.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              categoryFilter === tab.value
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-56 bg-white border border-slate-200 rounded-lg" />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-6 h-6" />}
          title="No notifications"
          description="You are all caught up."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                !n.isRead ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="space-y-1.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={!n.isRead ? 'primary' : 'default'}>
                    {n.category}
                  </Badge>
                  <h2 className="text-sm font-semibold text-slate-900">
                    {n.title}
                  </h2>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {n.message}
                </p>
                <p className="text-xs text-slate-400">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {n.actionUrl && (
                  <Link
                    to={n.actionUrl}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <span>Open Related Item</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                )}
                {!n.isRead && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMarkAsRead(n.id)}
                  >
                    Mark Read
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
