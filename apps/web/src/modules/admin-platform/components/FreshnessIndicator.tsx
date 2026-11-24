import React from 'react';
import { Activity, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { SystemModuleHealth } from '../api/adminPlatformApi.js';

interface FreshnessIndicatorProps {
  cachedAt?: string;
  ttlSeconds?: number;
  moduleHealth?: SystemModuleHealth;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const FreshnessIndicator: React.FC<FreshnessIndicatorProps> = ({
  cachedAt,
  ttlSeconds = 60,
  moduleHealth,
  onRefresh,
  isRefreshing = false,
}) => {
  const formattedTime = cachedAt
    ? new Date(cachedAt).toLocaleTimeString('en-LK', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : 'Live';

  return (
    <div className="bg-slate-900 text-slate-200 text-xs rounded-xl p-3 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
      {/* Freshness & Cache Time */}
      <div className="flex items-center gap-2">
        <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="font-semibold text-white">Data Freshness:</span>
        <span className="text-slate-300">
          Last Snapshot {formattedTime} ({ttlSeconds}s TTL Cache)
        </span>
      </div>

      {/* Module Degradation Status Indicators */}
      {moduleHealth && (
        <div className="flex items-center gap-3 text-[11px] font-medium" data-testid="module-health-indicators">
          {(['MOD_01', 'MOD_02', 'MOD_03', 'MOD_04', 'MOD_05'] as const).map((modKey) => {
            const status = moduleHealth[modKey] || 'ONLINE';
            const isOnline = status === 'ONLINE';
            const modLabel = modKey.replace('_', '-');

            return (
              <div
                key={modKey}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                  isOnline
                    ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800'
                    : 'bg-amber-950/60 text-amber-400 border-amber-800'
                }`}
                title={`${modLabel} status: ${status}`}
              >
                {isOnline ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                )}
                <span>{modLabel}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Optional Manual Refresh Trigger */}
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          <span>{isRefreshing ? 'Refreshing...' : 'Force Refresh'}</span>
        </button>
      )}
    </div>
  );
};
