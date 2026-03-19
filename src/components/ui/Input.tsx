import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, fullWidth = false, className = "", id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);
    const baseStyles = "block w-full bg-white border rounded-[var(--radius-button)] px-4 py-2.5 text-gray-900 placeholder-gray-400 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1";
    const stateStyles = hasError
      ? "border-error focus:border-error focus:ring-error"
      : "border-gray-300 focus:border-primary focus:ring-primary";
    const iconPaddingLeft = leftIcon ? "pl-11" : "";
    const iconPaddingRight = rightIcon ? "pr-11" : "";
    const widthStyle = fullWidth ? "w-full" : "";

    return (
      <div className={`${widthStyle} ${className}`}>
        {label && <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>}
        <div className="relative">
          {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{leftIcon}</div>}
          <input ref={ref} id={inputId} className={`${baseStyles} ${stateStyles} ${iconPaddingLeft} ${iconPaddingRight}`} {...props} />
          {rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{rightIcon}</div>}
        </div>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
