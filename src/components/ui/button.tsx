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
  ].join(" "),
  secondary: [
    "bg-white text-black border border-black",
    "hover:bg-gray-50",
  ].join(" "),
  ghost: [
    "bg-transparent text-black border border-transparent",
    "hover:bg-gray-100",
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
  "transition-all duration-200 ease-out",
  "hover:-translate-y-px active:translate-y-0 active:scale-[0.98]",
  "disabled:opacity-50 disabled:cursor-not-allowed",
  "disabled:hover:translate-y-0 disabled:active:scale-100",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2",
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
