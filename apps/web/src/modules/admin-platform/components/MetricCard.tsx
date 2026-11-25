import React from 'react';
import { Link } from 'react-router-dom';
import { LucideIcon, ArrowRight, AlertTriangle } from 'lucide-react';
import { Badge } from '../../../shared/components/index.js';

interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColor?: string;
  badge?: {
    text: string;
    variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info';
  };
  linkTo?: string;
  isDegraded?: boolean;
  timeContext?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  iconColor = 'text-slate-500',
  badge,
  linkTo,
  isDegraded = false,
  timeContext,
}) => {
  const badgeVariantMap = {
    neutral: 'default',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'primary',
  } as const;

  const content = (
    <div
      className={`bg-white border rounded-lg p-5 h-full flex flex-col justify-between gap-3 transition-colors ${
        isDegraded
          ? 'border-amber-300 bg-amber-50/30'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-medium text-slate-500">{label}</span>
          <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} aria-hidden="true" />
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">
            {isDegraded ? '—' : value}
          </span>
          {isDegraded ? (
            <Badge variant="warning">
              <AlertTriangle className="w-3 h-3" />
              <span>Source Unavailable</span>
            </Badge>
          ) : badge ? (
            <Badge variant={badgeVariantMap[badge.variant]}>{badge.text}</Badge>
          ) : null}
        </div>
      </div>

      {(subtext || timeContext || linkTo) && (
        <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-500">
          <span className="truncate">{subtext || timeContext}</span>
          {linkTo && (
            <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block h-full">
        {content}
      </Link>
    );
  }

  return content;
};
