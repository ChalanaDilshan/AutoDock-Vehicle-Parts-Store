import React from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { SystemModuleHealth } from '../api/adminPlatformApi.js';
import { Button } from '../../../shared/components/index.js';

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
    : 'Just now';

  const modules = moduleHealth
    ? [
        { code: 'MOD-01', name: 'Identity', status: moduleHealth.MOD_01 },
        { code: 'MOD-02', name: 'Catalog', status: moduleHealth.MOD_02 },
        { code: 'MOD-03', name: 'Orders', status: moduleHealth.MOD_03 },
        { code: 'MOD-04', name: 'Finance', status: moduleHealth.MOD_04 },
        { code: 'MOD-05', name: 'Platform', status: moduleHealth.MOD_05 },
      ]
    : [];

  return (
    <div className="bg-white border border-slate-200 rounded-lg px-4 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
      <div
        data-testid="module-health-indicators"
        className="flex flex-wrap items-center gap-2"
      >
        <span className="text-xs font-medium text-slate-500 mr-1">
          Services:
        </span>
        {modules.map((mod) => {
          const online = mod.status === 'ONLINE';
          return (
            <span
              key={mod.code}
              title={`${mod.name}: ${mod.status}`}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded border text-xs font-medium whitespace-nowrap ${
                online
                  ? 'bg-slate-50 border-slate-200 text-slate-700'
                  : 'bg-amber-50 border-amber-200 text-amber-800'
              }`}
            >
              {online ? (
                <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
              )}
              <span>{mod.code}</span>
            </span>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between lg:justify-end">
        <span className="text-xs text-slate-500">
          Updated {formattedTime} (TTL {ttlSeconds}s)
        </span>
        {onRefresh && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            leftIcon={
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
            }
          >
            Force Refresh
          </Button>
        )}
      </div>
    </div>
  );
};
