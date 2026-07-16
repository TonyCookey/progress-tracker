import Link from "next/link";
import { ComponentProps, forwardRef, ReactNode } from "react";
import clsx from "clsx";
import type { ButtonSize, ButtonVariant } from "./Button";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent-500 text-white hover:bg-accent-600 shadow-soft",
  secondary: "bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50",
  ghost: "bg-transparent text-neutral-600 hover:bg-neutral-100",
  danger: "bg-danger-500 text-white hover:bg-danger-700 shadow-soft",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

export interface LinkButtonProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ variant = "primary", size = "md", leftIcon, rightIcon, className, children, ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center rounded-pill font-medium transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-1",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {leftIcon}
        {children}
        {rightIcon}
      </Link>
    );
  },
);
LinkButton.displayName = "LinkButton";

export default LinkButton;
