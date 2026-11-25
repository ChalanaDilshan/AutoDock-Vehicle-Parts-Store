import React from 'react';
import { AuditDetailItem } from '../api/adminPlatformApi.js';
import { Badge, Button, Modal } from '../../../shared/components/index.js';

interface AuditDetailModalProps {
  log: AuditDetailItem | null;
  onClose: () => void;
}

export const AuditDetailModal: React.FC<AuditDetailModalProps> = ({
  log,
  onClose,
}) => {
  if (!log) return null;

  const severityVariant =
    log.severity === 'CRITICAL'
      ? 'danger'
      : log.severity === 'HIGH'
        ? 'warning'
        : log.severity === 'MEDIUM'
          ? 'primary'
          : 'default';

  return (
    <Modal
      isOpen={Boolean(log)}
      onClose={onClose}
      title="Audit Event Detail"
      subtitle={`Immutable audit entry · ${log.id}`}
      size="lg"
      footer={
        <Button variant="outline" onClick={onClose}>
          Close Detail
        </Button>
      }
    >
      <div className="space-y-5">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-xs text-slate-500 block">Action</span>
            <span className="font-mono font-semibold text-slate-900">
              {log.action}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Severity &amp; Module</span>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant={severityVariant}>{log.severity}</Badge>
              <Badge variant="default">{log.sourceModule}</Badge>
            </div>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Actor</span>
            <span className="text-slate-900 font-medium">
              {log.actor.email || log.actor.actorId} ({log.actor.actorRole})
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-500 block">Target Entity</span>
            <span className="font-mono text-xs text-slate-800">
              {log.targetEntity.entityType} ·{' '}
              {log.targetEntity.publicReference || log.targetEntity.entityId}
            </span>
          </div>
        </div>

        {log.reason && (
          <div className="text-sm">
            <span className="text-xs font-medium text-slate-500 block mb-1">
              Recorded Reason
            </span>
            <p className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800">
              {log.reason}
            </p>
          </div>
        )}

        {log.delta && log.delta.length > 0 && (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
              Recorded Field Changes
            </div>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs text-slate-500">
                  <th className="py-2 px-4">Field</th>
                  <th className="py-2 px-4">Before</th>
                  <th className="py-2 px-4">After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {log.delta.map((d) => (
                  <tr key={d.field}>
                    <td className="py-2.5 px-4 font-mono text-xs font-medium text-slate-900">
                      {d.field}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs text-slate-600">
                      {String(d.oldValue)}
                    </td>
                    <td className="py-2.5 px-4 font-mono text-xs font-semibold text-emerald-700">
                      {String(d.newValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Modal>
  );
};
