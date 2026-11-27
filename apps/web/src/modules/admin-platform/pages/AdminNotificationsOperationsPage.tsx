import React, { useState, useEffect } from 'react';
import { Bell, Mail, RotateCw } from 'lucide-react';
import {
  adminPlatformApi,
  AdminAlertItem,
  DeliveryHealthLogItem,
} from '../api/adminPlatformApi.js';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  PageHeader,
} from '../../../shared/components/index.js';

export const AdminNotificationsOperationsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ALERTS' | 'DELIVERY'>('ALERTS');
  const [alerts, setAlerts] = useState<AdminAlertItem[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryHealthLogItem[]>([]);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [alertsRes, deliveryRes] = await Promise.all([
        adminPlatformApi.getAdminOperations({
          priority: priorityFilter || undefined,
          limit: 20,
        }),
        adminPlatformApi.getDeliveryHealth({ limit: 25 }),
      ]);
      if (alertsRes.success && Array.isArray(alertsRes.data)) {
        setAlerts(alertsRes.data);
      }
      if (deliveryRes.success && Array.isArray(deliveryRes.data)) {
        setDeliveryLogs(deliveryRes.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load operational alert feeds.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [priorityFilter]);

  const handleRetry = async (deliveryId: string) => {
    setRetryingId(deliveryId);
    setStatusMessage(null);
    try {
      const res = await adminPlatformApi.retryDelivery(deliveryId);
      setStatusMessage(res.message || 'Retry requested.');
      await loadData();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Retry failed.');
    } finally {
      setRetryingId(null);
    }
  };

  const renderDeliveryBadge = (status: DeliveryHealthLogItem['status']) => {
    if (status === 'FAILED') return <Badge variant="danger">Permanent Failure</Badge>;
    if (status === 'SENT' || status === 'DELIVERED')
      return <Badge variant="success">Provider Accepted</Badge>;
    return <Badge variant="warning">{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operational Alerts & Delivery Health"
        subtitle="Monitor platform alert feeds and retry failed notification dispatches"
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
      {statusMessage && <Alert variant="success">{statusMessage}</Alert>}

      <div className="border-b border-slate-200 flex gap-6">
        <button
          type="button"
          onClick={() => setActiveTab('ALERTS')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'ALERTS'
              ? 'border-[#E11D30] text-[#E11D30]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Operational Alerts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('DELIVERY')}
          className={`pb-3 text-sm font-medium border-b-2 transition-colors inline-flex items-center gap-2 ${
            activeTab === 'DELIVERY'
              ? 'border-[#E11D30] text-[#E11D30]'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Delivery Health &amp; Retries</span>
        </button>
      </div>

      {activeTab === 'ALERTS' ? (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg p-3.5 flex flex-wrap gap-2">
            {[
              { value: '', label: 'All Priorities' },
              { value: 'CRITICAL', label: 'Critical' },
              { value: 'HIGH', label: 'High' },
              { value: 'NORMAL', label: 'Normal' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setPriorityFilter(tab.value)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium ${
                  priorityFilter === tab.value
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
          ) : alerts.length === 0 ? (
            <EmptyState
              icon={<Bell className="w-6 h-6" />}
              title="No active operational alerts"
              description="System and queue alerts will appear here when triggered."
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
              {alerts.map((a) => (
                <div key={a.id} className="p-4 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant={
                        a.priority === 'CRITICAL'
                          ? 'danger'
                          : a.priority === 'HIGH'
                            ? 'warning'
                            : 'default'
                      }
                    >
                      {a.priority}
                    </Badge>
                    <span className="text-sm font-semibold text-slate-900">
                      {a.title}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600">{a.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="h-56 bg-white border border-slate-200 rounded-lg" />
      ) : deliveryLogs.length === 0 ? (
        <EmptyState
          icon={<Mail className="w-6 h-6" />}
          title="No dispatch logs recorded"
          description="Outbound notification delivery attempts will appear here."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Event / Template</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {deliveryLogs.map((log) => (
                  <tr key={log.deliveryId}>
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-semibold text-slate-900">
                        {log.sourceEventName}
                      </div>
                      <div className="text-xs text-slate-500">
                        {log.sourceModule} · Attempts: {log.attemptCount}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-700">
                      {log.recipientAddress}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.channel}</td>
                    <td className="py-3 px-4">{renderDeliveryBadge(log.status)}</td>
                    <td className="py-3 px-4 text-right">
                      {log.status === 'FAILED' && (
                        <Button
                          variant="outline"
                          size="sm"
                          isLoading={retryingId === log.deliveryId}
                          leftIcon={<RotateCw className="w-3.5 h-3.5" />}
                          onClick={() => handleRetry(log.deliveryId)}
                        >
                          Retry
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
