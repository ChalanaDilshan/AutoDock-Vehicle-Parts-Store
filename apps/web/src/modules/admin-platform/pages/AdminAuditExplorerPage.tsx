import React, { useState, useEffect } from 'react';
import { ShieldAlert, Eye } from 'lucide-react';
import {
  adminPlatformApi,
  AuditLogItem,
  AuditDetailItem,
} from '../api/adminPlatformApi.js';
import { AuditDetailModal } from '../components/AuditDetailModal.js';
import {
  Alert,
  Badge,
  Button,
  EmptyState,
  PageHeader,
  Select,
} from '../../../shared/components/index.js';

export const AdminAuditExplorerPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [sourceModule, setSourceModule] = useState('');
  const [severity, setSeverity] = useState('');
  const [actionSearch, setActionSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditDetailItem | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminPlatformApi.searchAuditLogs({
        sourceModule: sourceModule || undefined,
        severity: severity || undefined,
        action: actionSearch.trim() || undefined,
        limit: 20,
      });
      if (res.success && Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to load security audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [sourceModule, severity]);

  const handleOpenDetail = async (id: string) => {
    try {
      const res = await adminPlatformApi.getAuditLogById(id);
      if (res.success && res.data) {
        setSelectedLog(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to inspect audit event.');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Security & Compliance Audit Explorer"
        subtitle="Inspect chronological system changes, approvals, and administrative decisions"
        badge={<Badge variant="primary">Read-Only</Badge>}
      />

      {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          loadLogs();
        }}
        className="bg-white border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end"
      >
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            Action Keyword
          </label>
          <input
            type="text"
            value={actionSearch}
            onChange={(e) => setActionSearch(e.target.value)}
            placeholder="e.g. SELLER_VERIFICATION"
            className="w-full h-9 rounded-lg border border-slate-300 px-3 text-sm text-slate-900"
          />
        </div>

        <Select
          label="Source Service"
          value={sourceModule}
          onChange={(e) => setSourceModule(e.target.value)}
          placeholder="All Services"
          options={[
            { value: 'MOD-01', label: 'MOD-01 Identity' },
            { value: 'MOD-02', label: 'MOD-02 Catalogue' },
            { value: 'MOD-03', label: 'MOD-03 Orders' },
            { value: 'MOD-04', label: 'MOD-04 Finance' },
            { value: 'MOD-05', label: 'MOD-05 Platform' },
          ]}
        />

        <Select
          label="Severity"
          value={severity}
          onChange={(e) => setSeverity(e.target.value)}
          placeholder="All Levels"
          options={[
            { value: 'CRITICAL', label: 'Critical' },
            { value: 'HIGH', label: 'High' },
            { value: 'MEDIUM', label: 'Medium' },
            { value: 'LOW', label: 'Low' },
          ]}
        />

        <Button type="submit" variant="secondary">
          Filter Logs
        </Button>
      </form>

      {isLoading ? (
        <div className="h-64 bg-white border border-slate-200 rounded-lg" />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<ShieldAlert className="w-6 h-6" />}
          title="No audit events found"
          description="Security and administrative audit logs matching your filters will appear here."
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 text-xs text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono text-xs font-semibold text-slate-900">
                      {log.action}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="default">{log.sourceModule}</Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          log.severity === 'CRITICAL'
                            ? 'danger'
                            : log.severity === 'HIGH'
                              ? 'warning'
                              : 'primary'
                        }
                      >
                        {log.severity}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-slate-700 text-xs">
                      {log.actor.email || log.actor.actorRole}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                        onClick={() => handleOpenDetail(log.id)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <AuditDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
    </div>
  );
};
