import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldCheck,
  Calendar,
  Loader2,
  AlertCircle,
  Eye,
  Lock,
} from 'lucide-react';
import {
  adminPlatformApi,
  AuditLogItem,
  AuditDetailItem,
  NotificationPagination,
} from '../api/adminPlatformApi.js';
import { AuditDetailModal } from '../components/AuditDetailModal.js';

export const AdminAuditExplorerPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [pagination, setPagination] = useState<NotificationPagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });

  // Filters
  const [sourceModule, setSourceModule] = useState<string>('');
  const [severity, setSeverity] = useState<string>('');
  const [actorRole, setActorRole] = useState<string>('');
  const [actionSearch, setActionSearch] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<AuditDetailItem | null>(null);
  const [loadingDetailId, setLoadingDetailId] = useState<string | null>(null);

  const fetchLogs = async (page: number = 1) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await adminPlatformApi.searchAuditLogs({
        page,
        limit: 20,
        sourceModule: sourceModule || undefined,
        severity: severity || undefined,
        actorRole: actorRole || undefined,
        action: actionSearch.trim() || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });

      if (res.success && res.data) {
        setLogs(res.data);
        if (res.meta?.pagination) {
          setPagination(res.meta.pagination);
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to search security audit logs.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(1);
  }, [sourceModule, severity, actorRole]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs(1);
  };

  const handleResetFilters = () => {
    setSourceModule('');
    setSeverity('');
    setActorRole('');
    setActionSearch('');
    setStartDate('');
    setEndDate('');
    fetchLogs(1);
  };

  const openLogDetail = async (id: string) => {
    setLoadingDetailId(id);
    try {
      const res = await adminPlatformApi.getAuditLogById(id);
      if (res.success && res.data) {
        setSelectedLog(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to retrieve audit log details.');
    } finally {
      setLoadingDetailId(null);
    }
  };

  const severityBadges: Record<string, string> = {
    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300',
    HIGH: 'bg-amber-100 text-amber-800 border-amber-300',
    MEDIUM: 'bg-blue-100 text-blue-800 border-blue-300',
    LOW: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Security & Compliance Audit Explorer
            </h1>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-emerald-400 px-2 py-0.5 rounded-full border border-slate-800">
              <Lock className="w-3 h-3" />
              <span>Read-Only</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cryptographically sealed cross-module administrative trail for verification, logistics, reviews, and finance mutations.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Workstation */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Action Search */}
          <div className="lg:col-span-2 relative flex items-center">
            <input
              type="text"
              placeholder="Search action code (e.g. SELLER_APPROVED, REPORT_EXPORTED)..."
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
          </div>

          {/* Module Filter */}
          <div>
            <select
              value={sourceModule}
              onChange={(e) => setSourceModule(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
            >
              <option value="">All Source Modules</option>
              <option value="MOD-01">MOD-01 (Identity & KYC)</option>
              <option value="MOD-02">MOD-02 (Catalogue & Reviews)</option>
              <option value="MOD-03">MOD-03 (Orders & Rates)</option>
              <option value="MOD-04">MOD-04 (Finance & Promos)</option>
              <option value="MOD-05">MOD-05 (Admin & Reports)</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
            >
              <option value="">All Severities</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Severity</option>
              <option value="MEDIUM">Medium Severity</option>
              <option value="LOW">Low Severity</option>
            </select>
          </div>

          {/* Actor Role Filter */}
          <div>
            <select
              value={actorRole}
              onChange={(e) => setActorRole(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:bg-white focus:outline-none"
            >
              <option value="">All Actor Roles</option>
              <option value="ADMIN">Platform Admins</option>
              <option value="SELLER">Merchants</option>
              <option value="CUSTOMER">Customers</option>
              <option value="SYSTEM">Automated System</option>
            </select>
          </div>

          {/* Search & Reset Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Search
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
            >
              Reset
            </button>
          </div>
        </form>

        {/* Date Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="font-semibold">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2 py-1"
            />
          </div>

          <span className="text-[11px] text-slate-400 ml-auto">
            Showing {logs.length} of {pagination.total} audit records
          </span>
        </div>
      </div>

      {/* Audit Log Table */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span className="text-xs font-medium">Querying immutable audit trail...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-900">No audit events found</h3>
          <p className="text-xs text-slate-400">No events matched the chosen filters.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                <tr>
                  <th className="py-3 px-4">Timestamp (Colombo)</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Target Entity</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => {
                  const badgeStyle = severityBadges[log.severity] || 'bg-slate-100 text-slate-700';

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString('en-LK', {
                          timeZone: 'Asia/Colombo',
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>

                      <td className="py-3 px-4 font-bold text-blue-600">
                        {log.sourceModule}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {log.action}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${badgeStyle}`}
                        >
                          {log.severity}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-900">
                          {log.actor.actorRole}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          {log.actor.email || log.actor.actorId}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800">
                          {log.targetEntity.entityType}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono truncate max-w-[140px]">
                          {log.targetEntity.entityId}
                          {log.targetEntity.publicReference ? ` (${log.targetEntity.publicReference})` : ''}
                        </div>
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => openLogDetail(log.id)}
                          disabled={loadingDetailId === log.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition disabled:opacity-50"
                        >
                          {loadingDetailId === log.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Eye className="w-3.5 h-3.5" />
                          )}
                          <span>View</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200/80 text-xs">
          <span className="text-slate-500">
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} Records)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => fetchLogs(pagination.page - 1)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => fetchLogs(pagination.page + 1)}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg font-bold disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Audit Detail Modal */}
      <AuditDetailModal
        log={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
};
