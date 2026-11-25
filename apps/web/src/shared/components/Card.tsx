import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Inner spacing preset */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Surface theme */
  variant?: 'default' | 'dark';
  /** Adds subtle hover elevation and border transition */
  hoverable?: boolean;
}

const PADDING_CLASSES: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3 sm:p-4',
  md: 'p-4 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const VARIANT_CLASSES: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-white border-slate-200 text-slate-900',
  dark: 'bg-slate-900 border-slate-800 text-white',
};

/**
 * Reusable Card container component with consistent borders, rounding, and spacing.
 */
export const Card: React.FC<CardProps> = ({
  padding = 'md',
  variant = 'default',
  hoverable = false,
  className = '',
  children,
  ...rest
}) => {
  return (
    <div
      className={[
        'rounded-lg border shadow-xs',
        VARIANT_CLASSES[variant],
        PADDING_CLASSES[padding],
        hoverable
          ? 'transition-all duration-150 hover:border-slate-300 hover:shadow-sm'
          : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
};
