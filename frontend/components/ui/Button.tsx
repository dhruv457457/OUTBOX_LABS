import { type ButtonHTMLAttributes, forwardRef } from "react";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-hover",
  outline: "border border-primary text-primary hover:bg-primary-soft",
  ghost: "text-muted hover:bg-black/5",
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = "primary", className = "", ...props }, ref) => (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium
        transition-colors disabled:opacity-50 disabled:pointer-events-none ${variants[variant]} ${className}`}
      {...props}
    />
  ),
);
Button.displayName = "Button";
