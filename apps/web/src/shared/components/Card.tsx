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
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const VARIANT_CLASSES: Record<NonNullable<CardProps['variant']>, string> = {
  default: 'bg-white border border-slate-200 text-slate-900 shadow-xs',
  dark: 'bg-slate-900 border border-slate-800 text-white shadow-sm',
};

export const Card: React.FC<CardProps> = ({
  children,
  padding = 'md',
  variant = 'default',
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={[
        'rounded-lg',
        VARIANT_CLASSES[variant],
        PADDING_CLASSES[padding],
        hoverable ? 'hover:shadow-sm hover:border-slate-300 transition-[box-shadow,border-color] duration-150' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
};
