import React from 'react';
import { X, ShieldCheck, Clock, User, Target, FileText, Lock } from 'lucide-react';
import { AuditDetailItem } from '../api/adminPlatformApi.js';

interface AuditDetailModalProps {
  log: AuditDetailItem | null;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({ log, onClose }) => {
  if (!log) return null;

  const severityBadge = {
    CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300',
    HIGH: 'bg-amber-100 text-amber-800 border-amber-300',
    MEDIUM: 'bg-blue-100 text-blue-800 border-blue-300',
    LOW: 'bg-slate-100 text-slate-800 border-slate-300',
  }[log.severity] || 'bg-slate-100 text-slate-700 border-slate-200';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
    >
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 id="audit-modal-title" className="text-sm font-bold leading-tight">
                Audit Event Detail
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                ID: {log.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${severityBadge}`}
            >
              {log.severity}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close audit log detail"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs text-slate-700">
          {/* Immutability Banner */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-slate-600">
            <Lock className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              This record is an <strong>immutable audit entry</strong> written directly to the security log. Modifications or deletions are cryptographically prohibited.
            </span>
          </div>

          {/* Grid Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                Timestamp
              </span>
              <p className="font-semibold text-slate-900">
                {new Date(log.timestamp).toLocaleString('en-LK', {
                  timeZone: 'Asia/Colombo',
                })}{' '}
                (UTC+5:30)
              </p>
              <p className="text-[10px] text-slate-400 font-mono">
                {log.timestamp}
              </p>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <FileText className="w-3 h-3 text-slate-400" />
                Action & Module
              </span>
              <p className="font-semibold text-slate-900">
                {log.action}
              </p>
              <p className="text-[10px] font-bold text-blue-600">
                Source: {log.sourceModule}
              </p>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                Actor Information
              </span>
              <p className="font-semibold text-slate-900">
                {log.actor.actorRole} ({log.actor.email || log.actor.actorId})
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                IP: {log.actor.ipAddress || 'Internal/Gateway'}
              </p>
            </div>

            <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                <Target className="w-3 h-3 text-slate-400" />
                Target Entity
              </span>
              <p className="font-semibold text-slate-900">
                {log.targetEntity.entityType}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                ID: {log.targetEntity.entityId}
                {log.targetEntity.publicReference ? ` (${log.targetEntity.publicReference})` : ''}
              </p>
            </div>
          </div>

          {/* Reason */}
          {log.reason && (
            <div className="space-y-1">
              <h4 className="text-[10px] uppercase font-bold text-slate-400">
                Administrative Justification / Reason
              </h4>
              <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 font-medium">
                {log.reason}
              </p>
            </div>
          )}

          {/* Delta Changes Before / After */}
          <div className="space-y-2">
            <h4 className="text-[10px] uppercase font-bold text-slate-400">
              Payload Changes (Field Delta)
            </h4>
            {log.delta && log.delta.length > 0 ? (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500">
                    <tr>
                      <th className="py-2 px-3">Field</th>
                      <th className="py-2 px-3">Old Value</th>
                      <th className="py-2 px-3">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[11px] font-mono">
                    {log.delta.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-bold text-slate-800">{d.field}</td>
                        <td className="py-2 px-3 text-rose-700 bg-rose-50/30 max-w-[150px] truncate">
                          {typeof d.oldValue === 'object'
                            ? JSON.stringify(d.oldValue)
                            : String(d.oldValue ?? 'null')}
                        </td>
                        <td className="py-2 px-3 text-emerald-700 bg-emerald-50/30 max-w-[150px] truncate">
                          {typeof d.newValue === 'object'
                            ? JSON.stringify(d.newValue)
                            : String(d.newValue ?? 'null')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
                No payload fields modified in this event.
              </p>
            )}
          </div>

          {/* Correlation / Request Reference */}
          {(log.requestId || log.correlationId) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-100">
              {log.requestId && <div>Request ID: {log.requestId}</div>}
              {log.correlationId && <div>Correlation ID: {log.correlationId}</div>}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
};
