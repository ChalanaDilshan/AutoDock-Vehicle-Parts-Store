import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button */
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost' | 'secondary-dark';
  /** Size of the button */
  size?: 'sm' | 'md' | 'lg';
  /** Shows a loading spinner and disables interaction */
  isLoading?: boolean;
  /** Optional icon rendered before the label */
  leftIcon?: React.ReactNode;
  /** Optional icon rendered after the label */
  rightIcon?: React.ReactNode;
  /** Stretches the button to full container width */
  fullWidth?: boolean;
}

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-[#E11D30] hover:bg-[#BE123C] text-white border border-transparent shadow-xs',
  secondary: 'bg-slate-900 hover:bg-slate-800 text-white border border-slate-900 shadow-xs',
  'secondary-dark': 'bg-[#0B121F] hover:bg-slate-800 text-white border border-slate-700',
  outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-xs',
  danger: 'bg-rose-600 hover:bg-rose-700 text-white border border-transparent shadow-xs',
  ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 border border-transparent',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-sm gap-2',
};

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={isLoading ? 'true' : undefined}
      className={[
        'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-150 select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E11D30] focus-visible:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
      ) : leftIcon ? (
        <span className="shrink-0 flex items-center">{leftIcon}</span>
      ) : null}
      <span>{children}</span>
      {!isLoading && rightIcon ? (
        <span className="shrink-0 flex items-center">{rightIcon}</span>
      ) : null}
    </button>
  );
};
