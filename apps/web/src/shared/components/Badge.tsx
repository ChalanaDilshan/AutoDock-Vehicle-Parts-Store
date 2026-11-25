import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Semantic color style for the badge */
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  /** Size of the badge */
  size?: 'sm' | 'md';
  /** Corner style */
  rounded?: 'md' | 'full';
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps['variant']>, string> = {
  default: 'bg-slate-100 text-slate-700 border-slate-200',
  primary: 'bg-blue-50 text-blue-700 border-blue-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-800 border-rose-200',
  info: 'bg-indigo-50 text-indigo-800 border-indigo-200',
};

const SIZE_CLASSES: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'px-2 py-0.5 text-[11px]',
  md: 'px-2.5 py-1 text-xs',
};

/**
 * Reusable Badge component for status tags, condition labels, and fitment indicators.
 */
export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  rounded = 'full',
  className = '',
  children,
  ...rest
}) => {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 font-semibold border leading-none whitespace-nowrap',
        rounded === 'full' ? 'rounded-full' : 'rounded-md',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </span>
  );
};
