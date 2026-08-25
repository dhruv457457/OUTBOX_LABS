import { type InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm
        placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 ${className}`}
      {...props}
    />
  ),
);
Input.displayName = "Input";
