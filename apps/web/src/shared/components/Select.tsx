import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  /** Optional label displayed above the select dropdown */
  label?: string;
  /** Array of options (can be used instead of or alongside children) */
  options?: SelectOption[];
  /** Optional placeholder option shown when value is empty */
  placeholder?: string;
  /** Error message displayed below the select */
  error?: string;
  /** Helpful hint displayed below the select when there is no error */
  helperText?: string;
  /** Stretches the select wrapper to full container width */
  fullWidth?: boolean;
}

/**
 * Reusable accessible Select dropdown component matching AutoDock's form controls.
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      helperText,
      fullWidth = true,
      id,
      className = '',
      children,
      ...rest
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const messageId = error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined;

    return (
      <div className={fullWidth ? 'w-full' : 'inline-block'}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-slate-700 mb-1.5"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={messageId}
            className={[
              'w-full appearance-none rounded-md border bg-white text-xs sm:text-sm text-slate-900',
              'pl-3 pr-9 py-2 transition-colors outline-none',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              error
                ? 'border-rose-500 focus:border-rose-600 focus:ring-1 focus:ring-rose-500'
                : 'border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...rest}
          >
            {placeholder !== undefined && (
              <option value="">{placeholder}</option>
            )}
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>

          <ChevronDown
            className="w-4 h-4 text-slate-400 absolute right-3 pointer-events-none"
            aria-hidden="true"
          />
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

Select.displayName = 'Select';
