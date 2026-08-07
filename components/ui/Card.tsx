import { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export default function Card({ children, padded = true, className, ...props }: CardProps) {
  const hasPaddingOverride = className ? /(^|\s)p[trblxy]?-/.test(className) : false;
  return (
    <div
      className={clsx(
        "bg-white border border-neutral-200 rounded-card shadow-soft",
        padded && !hasPaddingOverride && "p-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
