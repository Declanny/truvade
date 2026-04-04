import React from "react";

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "2xl" | "full";
}

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ size = "2xl", children, className = "", ...props }, ref) => {
    const sizeStyles = {
      sm: "max-w-3xl", md: "max-w-5xl", lg: "max-w-6xl", xl: "max-w-7xl",
      "2xl": "max-w-[1760px]", full: "max-w-full",
    };

    return (
      <div ref={ref} className={`mx-auto px-3 sm:px-5 lg:px-10 ${sizeStyles[size]} ${className}`} {...props}>
        {children}
      </div>
    );
  }
);

Container.displayName = "Container";
