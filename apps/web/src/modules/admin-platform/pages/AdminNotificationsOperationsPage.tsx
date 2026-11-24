import React, { useState, useEffect } from 'react';
import {
  Bell,
  Activity,
  AlertTriangle,
  RotateCcw,
  Loader2,
  CheckCircle2,
  Clock,
  Mail,
  Smartphone,
  ExternalLink,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  adminPlatformApi,
  AdminAlertItem,
  DeliveryHealthLogItem,
  NotificationPagination,
} from '../api/adminPlatformApi.js';

export const AdminNotificationsOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'DELIVERY'>('ALERTS');

  // --- Alerts State ---
  const [alerts, setAlerts] = useState<AdminAlertItem[]>([]);
  const [alertPagination, setAlertPagination] = useState<NotificationPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [isLoadingAlerts, setIsLoadingAlerts] = useState<boolean>(true);

  // --- Delivery Health State ---
  const [deliveries, setDeliveries] = useState<DeliveryHealthLogItem[]>([]);
  const [deliveryPagination, setDeliveryPagination] = useState<NotificationPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [channelFilter, setChannelFilter] = useState<string>('');
  const [isLoadingDeliveries, setIsLoadingDeliveries] = useState<boolean>(true);
  const [retryingIds, setRetryingIds] = useState<Set<string>>(new Set());

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch alerts
  const fetchAlerts = async (page: number = 1, priority: string = selectedPriority) => {
    setIsLoadingAlerts(true);
    setErrorMessage(null);
    try {
      const res = await adminPlatformApi.getAdminOperations({
        page,
        limit: 20,
        priority: (priority as any) || undefined,
      });
      if (res.success && res.data) {
        setAlerts(res.data);
        if (res.meta?.pagination) {
          setAlertPagination(res.meta.pagination);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch operational alerts.');
    } finally {
      setIsLoadingAlerts(false);
    }
  };

  // Fetch delivery health logs
  const fetchDeliveryLogs = async (
    page: number = 1,
    status: string = statusFilter,
    channel: string = channelFilter
  ) => {
    setIsLoadingDeliveries(true);
    setErrorMessage(null);
    try {
      const res = await adminPlatformApi.getDeliveryHealth({
        page,
        limit: 20,
        status: status || undefined,
        channel: channel || undefined,
      });
      if (res.success && res.data) {
        setDeliveries(res.data);
        if (res.meta?.pagination) {
          setDeliveryPagination(res.meta.pagination);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch notification delivery health logs.');
    } finally {
      setIsLoadingDeliveries(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ALERTS') {
      fetchAlerts(1, selectedPriority);
    } else {
      fetchDeliveryLogs(1, statusFilter, channelFilter);
    }
  }, [activeTab, selectedPriority, statusFilter, channelFilter]);

  // Handle manual delivery retry
  const handleRetry = async (deliveryId: string) => {
    if (retryingIds.has(deliveryId)) return;
    setRetryingIds((prev) => new Set(prev).add(deliveryId));
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await adminPlatformApi.retryDelivery(deliveryId);
      if (res.success) {
        setSuccessMessage(`Delivery ${deliveryId} enqueued for immediate retry.`);
        // Refresh delivery logs
        fetchDeliveryLogs(deliveryPagination.page, statusFilter, channelFilter);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || `Failed to retry delivery ${deliveryId}.`);
    } finally {
      setRetryingIds((prev) => {
        const next = new Set(prev);
        next.delete(deliveryId);
        return next;
      });
    }
  };

  const priorityBadges: Record<string, string> = {
    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300',
    HIGH: 'bg-amber-100 text-amber-800 border-amber-300',
    NORMAL: 'bg-blue-100 text-blue-800 border-blue-300',
    LOW: 'bg-slate-100 text-slate-800 border-slate-300',
  };

  const deliveryStatusBadges: Record<string, { label: string; class: string }> = {
    DELIVERED: { label: 'Delivered', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    SENT: { label: 'Provider Accepted', class: 'bg-blue-50 text-blue-700 border-blue-200' },
    PROCESSING: { label: 'Processing', class: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    QUEUED: { label: 'Queued', class: 'bg-slate-100 text-slate-700 border-slate-200' },
    PENDING: { label: 'Pending', class: 'bg-slate-100 text-slate-700 border-slate-200' },
    RETRYING: { label: 'Retrying', class: 'bg-amber-50 text-amber-700 border-amber-200' },
    FAILED: { label: 'Permanent Failure', class: 'bg-rose-50 text-rose-700 border-rose-200' },
    CANCELLED: { label: 'Cancelled', class: 'bg-slate-100 text-slate-600 border-slate-200' },
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Operational Alerts & Delivery Infrastructure
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cross-module system alerts, email/in-app notification delivery telemetry, and safe manual retry queue.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1 bg-slate-200 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab('ALERTS')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'ALERTS'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bell className="w-4 h-4 text-blue-600" />
            <span>Operational Alerts</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('DELIVERY')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === 'DELIVERY'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="w-4 h-4 text-emerald-600" />
            <span>Delivery Health & Retries</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* --- TAB 1: OPERATIONAL ALERTS --- */}
      {activeTab === 'ALERTS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Priority:</span>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
              >
                <option value="">All Priorities</option>
                <option value="CRITICAL">Critical Only</option>
                <option value="HIGH">High Priority</option>
                <option value="NORMAL">Normal Priority</option>
                <option value="LOW">Low Priority</option>
              </select>
            </div>
            <span className="text-xs text-slate-400">
              Showing {alerts.length} of {alertPagination.total} alerts
            </span>
          </div>

          {isLoadingAlerts ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Loading operational alerts...</span>
            </div>
          ) : alerts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900">No operational alerts</h3>
              <p className="text-xs text-slate-400">All administrative pipelines are running cleanly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                          priorityBadges[alert.priority] || 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {alert.priority}
                      </span>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {alert.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        [{alert.category}]
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {alert.message}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(alert.createdAt).toLocaleString('en-LK')}</span>
                      </span>

                      {alert.targetEntityType && (
                        <span>
                          Target: <strong>{alert.targetEntityType}</strong> ({alert.targetEntityId})
                        </span>
                      )}

                      {alert.actionUrl && (
                        <Link
                          to={alert.actionUrl}
                          className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-bold"
                        >
                          <span>Review Workstation</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- TAB 2: NOTIFICATION DELIVERY HEALTH --- */}
      {activeTab === 'DELIVERY' && (
        <div className="space-y-4">
          {/* Informational Guidance */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Delivery Status Invariant</span>
            </div>
            <p>
              In AutoDock, <strong>Provider Accepted (SENT)</strong> indicates successful hand-off to the email/SMS gateway, whereas <strong>Delivered</strong> confirms final recipient receipt where webhooks are enabled. Permanent failures can be manually reinjected into the worker queue below.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="p-4 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">Channel:</span>
                <select
                  value={channelFilter}
                  onChange={(e) => setChannelFilter(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="">All Channels</option>
                  <option value="EMAIL">Email</option>
                  <option value="IN_APP">In-App</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="">All Statuses</option>
                  <option value="FAILED">Failed Only</option>
                  <option value="SENT">Provider Accepted (SENT)</option>
                  <option value="DELIVERED">Delivered</option>
                  <option value="QUEUED">Queued</option>
                  <option value="RETRYING">Retrying</option>
                </select>
              </div>
            </div>

            <span className="text-xs text-slate-400">
              Showing {deliveries.length} of {deliveryPagination.total} dispatches
            </span>
          </div>

          {/* Table */}
          {isLoadingDeliveries ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Fetching delivery health telemetry...</span>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-sm font-bold text-slate-900">No delivery logs recorded</h3>
              <p className="text-xs text-slate-400">No notification dispatches match the selected filter criteria.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-3 px-4">Channel & Event</th>
                      <th className="py-3 px-4">Recipient (Masked)</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Attempts</th>
                      <th className="py-3 px-4">Last Attempt</th>
                      <th className="py-3 px-4">Failure Reason</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {deliveries.map((d) => {
                      const badge = deliveryStatusBadges[d.status] || {
                        label: d.status,
                        class: 'bg-slate-100 text-slate-700',
                      };
                      const canRetry = d.status === 'FAILED' || d.status === 'CANCELLED';

                      return (
                        <tr key={d.deliveryId} className="hover:bg-slate-50/60">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {d.channel === 'EMAIL' ? (
                                <Mail className="w-4 h-4 text-blue-500 shrink-0" />
                              ) : (
                                <Smartphone className="w-4 h-4 text-purple-500 shrink-0" />
                              )}
                              <div>
                                <span className="font-bold text-slate-900 block">
                                  {d.sourceEventName || d.templateId}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Source: {d.sourceModule}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                            {d.recipientAddress}
                          </td>

                          <td className="py-3 px-4">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${badge.class}`}
                            >
                              {badge.label}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-mono font-semibold">
                            {d.attemptCount}
                          </td>

                          <td className="py-3 px-4 text-slate-500 text-[11px]">
                            {d.lastAttemptAt
                              ? new Date(d.lastAttemptAt).toLocaleTimeString('en-LK')
                              : 'Pending'}
                          </td>

                          <td className="py-3 px-4 max-w-[200px]">
                            {d.lastErrorMessage ? (
                              <div className="text-rose-600 truncate text-[11px]" title={d.lastErrorMessage}>
                                <span className="font-bold font-mono">[{d.lastErrorCode || 'ERR'}]</span>{' '}
                                {d.lastErrorMessage}
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            {canRetry ? (
                              <button
                                type="button"
                                onClick={() => handleRetry(d.deliveryId)}
                                disabled={retryingIds.has(d.deliveryId)}
                                className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
                              >
                                {retryingIds.has(d.deliveryId) ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                                )}
                                <span>Retry</span>
                              </button>
                            ) : (
                              <span className="text-slate-400 text-[11px]">Normal</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
