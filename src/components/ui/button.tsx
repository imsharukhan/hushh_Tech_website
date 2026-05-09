import React from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: [
    "bg-black text-white border border-black",
    "shadow-lg hover:shadow-xl hover:bg-black/90",
    "active:scale-[0.98] transition-all",
  ].join(" "),
  secondary: [
    "bg-white text-black border border-black",
    "hover:bg-gray-50",
    "active:scale-[0.98] transition-colors",
  ].join(" "),
  ghost: [
    "bg-transparent text-black border border-transparent",
    "hover:bg-gray-100",
    "active:scale-[0.98] transition-colors",
  ].join(" "),
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-12 px-5 text-sm",
  lg: "h-14 px-6 text-sm",
  icon: "h-10 w-10 p-0",
};

const BASE_CLASSES = [
  "inline-flex items-center justify-center gap-2",
  "font-semibold tracking-wide",
  "cursor-pointer",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black",
].join(" ");

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      type = "button",
      variant = "primary",
      size = "md",
      className = "",
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      className={`${BASE_CLASSES} ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    />
  )
);

Button.displayName = "Button";
