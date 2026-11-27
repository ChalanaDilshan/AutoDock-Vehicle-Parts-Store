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

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      helperText,
      fullWidth = true,
      className = '',
      id,
      required,
      children,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    return (
      <div className={fullWidth ? 'w-full' : 'inline-block'}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-slate-700 mb-1.5"
          >
            {label}
            {required && (
              <span className="text-rose-600 ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            required={required}
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={[
              'block w-full appearance-none rounded-lg border bg-white text-sm text-slate-900 transition-colors',
              'py-2 pl-3 pr-9',
              error
                ? 'border-rose-300 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20'
                : 'border-slate-300 hover:border-slate-400 focus:border-[#E11D30] focus:outline-none focus:ring-2 focus:ring-[#E11D30]/15',
              'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          >
            {placeholder && (
              <option value="">{placeholder}</option>
            )}
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
            {children}
          </select>

          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500">
            <ChevronDown className="w-4 h-4" aria-hidden="true" />
          </div>
        </div>

        {error ? (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-rose-600">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1.5 text-xs text-slate-500">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
