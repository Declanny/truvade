import React from "react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, fullWidth = false, className = "", id, ...props }, ref) => {
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    const baseStyles = "block w-full bg-white border rounded-[var(--radius-button)] px-4 py-2.5 text-gray-900 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer";
    const stateStyles = hasError ? "border-error focus:border-error focus:ring-error" : "border-gray-300 focus:border-primary focus:ring-primary";
    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <div className={`${widthStyle} ${className}`}>
        {label && <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
        <div className="relative">
          <select ref={ref} id={selectId} className={`${baseStyles} ${stateStyles} appearance-none pr-10`} {...props}>
            {placeholder && <option value="" disabled>{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
