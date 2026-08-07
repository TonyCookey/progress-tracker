import { ReactNode } from "react";
import clsx from "clsx";

export type BadgeTone = "success" | "warning" | "danger" | "neutral" | "accent";

const toneClasses: Record<BadgeTone, string> = {
  success: "bg-success-50 text-success-700",
  warning: "bg-warning-50 text-warning-700",
  danger: "bg-danger-50 text-danger-700",
  neutral: "bg-neutral-100 text-neutral-700",
  accent: "bg-accent-50 text-accent-700",
};

export default function Badge({
  tone = "neutral",
  size = "md",
  children,
  className,
}: {
  tone?: BadgeTone;
  size?: "sm" | "md";
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-pill font-semibold whitespace-nowrap",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
