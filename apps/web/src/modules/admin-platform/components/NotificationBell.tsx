import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { adminPlatformApi, NotificationItem } from '../api/adminPlatformApi.js';
import { useAuth } from '../../identity/context/AuthContext.js';

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await adminPlatformApi.getUnreadCount();
      if (res?.success && res.data) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch {
      // Silently fail in background badge polling
    }
  };

  useEffect(() => {
    fetchUnreadCount();
  }, [isAuthenticated]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  const handleToggle = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && isAuthenticated) {
      setIsLoading(true);
      try {
        const res = await adminPlatformApi.getMyNotifications({ limit: 5 });
        if (res?.success && Array.isArray(res.data)) {
          setRecentNotifications(res.data);
          if (res.meta?.unreadCount !== undefined) {
            setUnreadCount(res.meta.unreadCount);
          }
        }
      } catch {
        // Ignore dropdown fetch failures
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleMarkAll = async () => {
    setIsMarkingAll(true);
    try {
      await adminPlatformApi.markAllAsRead();
      setUnreadCount(0);
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } finally {
      setIsMarkingAll(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={handleToggle}
        aria-label="Notifications"
        className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
      >
        <Bell className="w-4 h-4" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            data-testid="unread-notification-count"
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-blue-700 text-white text-[10px] font-semibold flex items-center justify-center leading-none"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white border border-slate-200 rounded-lg shadow-md z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                disabled={isMarkingAll}
                onClick={handleMarkAll}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-4 text-center text-xs text-slate-500">
                Loading notifications...
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No notifications right now.
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 text-xs space-y-1 ${
                    !n.isRead ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{n.title}</div>
                  <p className="text-slate-600 line-clamp-2">{n.message}</p>
                </div>
              ))
            )}
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-medium text-blue-700 hover:underline"
            >
              Open Notification Centre
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
