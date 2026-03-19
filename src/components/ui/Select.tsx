"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
  className?: string;
  value?: string;
  onChange?: (e: { target: { value: string } }) => void;
  id?: string;
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, fullWidth = false, className = "", value = "", onChange, id }, ref) => {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const hasError = Boolean(error);

    const selectedOption = options.find((o) => o.value === value);
    const displayLabel = selectedOption?.label || placeholder || "Select...";

    useEffect(() => {
      if (!open) return;
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    useEffect(() => {
      if (!open) return;
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("keydown", handler);
      return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const handleSelect = (optionValue: string) => {
      onChange?.({ target: { value: optionValue } });
      setOpen(false);
    };

    return (
      <div ref={ref} className={`${fullWidth ? "w-full" : ""} ${className}`}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1.5">
            {label}
          </label>
        )}
        <div ref={containerRef} className="relative">
          <button
            id={selectId}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`flex items-center justify-between w-full bg-white border rounded-xl px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 cursor-pointer ${
              hasError
                ? "border-error focus:border-error focus:ring-error"
                : open
                ? "border-[#0B3D2C] ring-2 ring-[#0B3D2C]/10"
                : "border-gray-200 hover:border-gray-300 focus:border-[#0B3D2C] focus:ring-[#0B3D2C]/10"
            }`}
          >
            <span className={selectedOption ? "text-gray-900" : "text-gray-400"}>
              {displayLabel}
            </span>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute z-50 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg py-1 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150">
              {placeholder && (
                <button
                  type="button"
                  onClick={() => handleSelect("")}
                  className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-left transition-colors ${
                    value === "" ? "text-[#0B3D2C] bg-[#0B3D2C]/5 font-medium" : "text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {placeholder}
                  {value === "" && <Check className="w-4 h-4 text-[#0B3D2C]" />}
                </button>
              )}
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  disabled={option.disabled}
                  onClick={() => handleSelect(option.value)}
                  className={`flex items-center justify-between w-full px-4 py-2.5 text-sm text-left transition-colors ${
                    option.disabled
                      ? "text-gray-300 cursor-not-allowed"
                      : value === option.value
                      ? "text-[#0B3D2C] bg-[#0B3D2C]/5 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {option.label}
                  {value === option.value && <Check className="w-4 h-4 text-[#0B3D2C]" />}
                </button>
              ))}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-error">{error}</p>}
        {helperText && !error && <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
