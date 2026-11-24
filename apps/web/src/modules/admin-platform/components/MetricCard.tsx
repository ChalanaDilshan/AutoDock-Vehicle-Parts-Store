import React from 'react';
import { LucideIcon, ArrowUpRight, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  iconColor = 'text-blue-600',
  badge,
  linkTo,
  isDegraded = false,
  timeContext = 'All-time snapshot',
}) => {
  const badgeColors = {
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const CardContent = (
    <div
      className={`bg-white rounded-xl p-5 border transition shadow-xs hover:shadow-sm ${
        isDegraded ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div className="flex flex-col items-end gap-1">
          {badge && (
            <span
              className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                badgeColors[badge.variant]
              }`}
            >
              {badge.text}
            </span>
          )}
          {timeContext && (
            <span className="text-[10px] text-slate-400 font-medium">
              {timeContext}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          {label}
        </h3>

        {isDegraded ? (
          <div className="flex items-center gap-1.5 text-amber-600 py-1" title="Data source temporarily degraded">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-semibold">Source Unavailable</span>
          </div>
        ) : (
          <div className="text-2xl font-black tracking-tight text-slate-900">
            {value}
          </div>
        )}

        {subtext && (
          <p className="text-xs text-slate-500 leading-relaxed pt-0.5">
            {subtext}
          </p>
        )}
      </div>

      {linkTo && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 transition">
          <span>View Detailed Breakdown</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="block group">
        {CardContent}
      </Link>
    );
  }

  return CardContent;
};
