import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
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

  // Fetch unread count on mount and when authenticated
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    try {
      const res = await adminPlatformApi.getUnreadCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Quiet fail if network temporarily unavailable
    }
  };

  const loadRecentNotifications = async () => {
    setIsLoading(true);
    try {
      const res = await adminPlatformApi.getMyNotifications({ limit: 5 });
      if (res.success && res.data) {
        setRecentNotifications(res.data);
        if (res.meta?.unreadCount !== undefined) {
          setUnreadCount(res.meta.unreadCount);
        }
      }
    } catch {
      // Keep existing
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
    }
  }, [isAuthenticated]);

  // When opening dropdown, load latest
  useEffect(() => {
    if (isOpen) {
      loadRecentNotifications();
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await adminPlatformApi.markAsRead(id);
      setRecentNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Error handled silently
    }
  };

  const handleMarkAllRead = async () => {
    if (isMarkingAll || unreadCount === 0) return;
    setIsMarkingAll(true);
    try {
      await adminPlatformApi.markAllAsRead();
      setRecentNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Error handled
    } finally {
      setIsMarkingAll(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl relative transition focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label={`Notifications (${unreadCount} unread)`}
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-[18px] h-[18px] bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 shadow-xs animate-pulse"
            data-testid="unread-notification-count"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-fadeIn"
          data-testid="notification-dropdown"
        >
          {/* Header */}
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="text-[10px] font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                  {unreadCount} New
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={isMarkingAll}
                className="text-[11px] font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {isLoading ? (
              <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                <span className="text-xs">Loading alerts...</span>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 space-y-1">
                <AlertCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold text-slate-600">No recent notifications</p>
                <p className="text-[11px] text-slate-400">You're completely up to date.</p>
              </div>
            ) : (
              recentNotifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 text-xs transition flex gap-3 items-start ${
                    n.isRead ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/40 hover:bg-blue-50/80'
                  }`}
                >
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 truncate">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-slate-600 line-clamp-2 leading-relaxed">
                      {n.message}
                    </p>
                    {n.actionUrl && (
                      <Link
                        to={n.actionUrl}
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 pt-1"
                      >
                        <span>View Details</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>

                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      title="Mark as read"
                      className="p-1 hover:bg-blue-100 text-blue-600 rounded-lg transition shrink-0"
                    >
                      <span className="w-2 h-2 bg-blue-600 rounded-full block"></span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer Link */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 block py-1"
            >
              Open Full Notification Centre →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
