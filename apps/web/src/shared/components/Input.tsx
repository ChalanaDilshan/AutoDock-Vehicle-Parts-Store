import React, { useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional label displayed above the input */
  label?: string;
  /** Error message displayed below the input */
  error?: string;
  /** Helpful hint displayed below the input when there is no error */
  helperText?: string;
  /** Optional icon placed inside the left side of the input */
  leftIcon?: React.ReactNode;
  /** Optional icon or element placed inside the right side of the input */
  rightIcon?: React.ReactNode;
  /** Stretches the input wrapper to full container width */
  fullWidth?: boolean;
}

/**
 * Reusable accessible Input component with label, icons, helper text, and error state.
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      id,
      className = '',
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const messageId = error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined;

    return (
      <div className={fullWidth ? 'w-full' : 'inline-block'}>
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span
              className="absolute left-3 text-slate-400 pointer-events-none inline-flex items-center"
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={messageId}
            className={[
              'w-full rounded-md border bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400',
              'py-2 transition-colors outline-none',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              leftIcon ? 'pl-9' : 'pl-3',
              rightIcon ? 'pr-9' : 'pr-3',
              error
                ? 'border-rose-500 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...rest}
          />

          {rightIcon && (
            <span className="absolute right-3 text-slate-400 inline-flex items-center">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={messageId} role="alert" className="mt-1 text-xs text-rose-600 font-medium">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={messageId} className="mt-1 text-xs text-slate-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
