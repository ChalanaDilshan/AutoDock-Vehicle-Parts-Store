import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

export interface AlertProps {
  variant?: 'info' | 'success' | 'warning' | 'danger';
  title?: string;
  children: React.ReactNode;
  className?: string;
  role?: 'alert' | 'status';
}

const STYLES = {
  info: {
    container: 'bg-blue-50/70 border-blue-200 text-blue-900',
    icon: <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />,
  },
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-900',
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-900',
    icon: <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />,
  },
  danger: {
    container: 'bg-rose-50 border-rose-200 text-rose-900',
    icon: <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" aria-hidden="true" />,
  },
};

export const Alert: React.FC<AlertProps> = ({
  variant = 'info',
  title,
  children,
  className = '',
  role,
}) => {
  const s = STYLES[variant];
  const resolvedRole = role || (variant === 'danger' || variant === 'warning' ? 'alert' : 'status');

  return (
    <div
      role={resolvedRole}
      className={`rounded-lg border px-4 py-3 text-sm flex items-start gap-3 ${s.container} ${className}`}
    >
      {s.icon}
      <div className="min-w-0 flex-1 space-y-0.5">
        {title && <div className="font-semibold">{title}</div>}
        <div className="leading-relaxed">{children}</div>
      </div>
    </div>
  );
};
