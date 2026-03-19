import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "default", padding = "md", hover = false, children, className = "", ...props }, ref) => {
    const hasCustomBg = className.includes("bg-");
    const baseStyles = `${hasCustomBg ? "" : "bg-white"} [border-radius:var(--radius-button)] transition-all duration-200`;
    const variantStyles = {
      default: "shadow-sm",
      bordered: "border border-gray-200",
      elevated: "shadow-lg",
    };
    const paddingStyles = { none: "", sm: "p-3", md: "p-4", lg: "p-6" };
    const hoverStyles = hover ? "hover:shadow-xl hover:-translate-y-1 cursor-pointer" : "";

    return (
      <div ref={ref} className={`${baseStyles} ${variantStyles[variant]} ${paddingStyles[padding]} ${hoverStyles} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`pb-3 border-b border-gray-100 ${className}`} {...props}>{children}</div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`py-3 ${className}`} {...props}>{children}</div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className = "", ...props }) => (
  <div className={`pt-3 border-t border-gray-100 ${className}`} {...props}>{children}</div>
);
