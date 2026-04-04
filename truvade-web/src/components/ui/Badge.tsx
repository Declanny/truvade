import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "accent" | "success" | "warning" | "error" | "info" | "gray";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "gray", size = "md", icon, children, className = "", ...props }, ref) => {
    const baseStyles = "inline-flex items-center font-medium [border-radius:var(--radius-button)]";
    const variantStyles = {
      primary: "bg-primary/10 text-primary",
      accent: "bg-accent/10 text-accent",
      success: "bg-success/10 text-success",
      warning: "bg-warning/10 text-warning-dark",
      error: "bg-error/10 text-error",
      info: "bg-info/10 text-info",
      gray: "bg-gray-100 text-gray-700",
    };
    const sizeStyles = { sm: "text-xs px-2 py-0.5", md: "text-sm px-2.5 py-1", lg: "text-base px-3 py-1.5" };

    return (
      <span ref={ref} className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`} {...props}>
        {icon && <span className="mr-1.5">{icon}</span>}
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
