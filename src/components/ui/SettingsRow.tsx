"use client";

import { useState } from "react";

export interface SettingsRowProps {
  label: string;
  value?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  editable?: boolean;
  children?: React.ReactNode;
}

export const SettingsRow: React.FC<SettingsRowProps> = ({
  label,
  value,
  description,
  actionLabel,
  onAction,
  editable = false,
  children,
}) => {
  const [expanded, setExpanded] = useState(false);

  const handleAction = () => {
    if (editable) {
      setExpanded((v) => !v);
    }
    onAction?.();
  };

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <div className="flex items-start justify-between py-6">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900">{label}</p>
          {value && (
            <p className="text-sm text-gray-500 mt-0.5">{value}</p>
          )}
          {description && !value && (
            <p className="text-sm text-gray-500 mt-0.5">{description}</p>
          )}
        </div>
        {actionLabel && (
          <button
            onClick={handleAction}
            className="text-sm font-semibold text-gray-900 underline hover:text-gray-600 transition-colors ml-4 flex-shrink-0"
          >
            {expanded ? "Cancel" : actionLabel}
          </button>
        )}
      </div>
      {expanded && children && (
        <div className="pb-6 -mt-2">{children}</div>
      )}
    </div>
  );
};
