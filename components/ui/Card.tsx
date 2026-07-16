import { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padded?: boolean;
}

export default function Card({ children, padded = true, className, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white border border-neutral-200 rounded-card shadow-soft",
        padded && "p-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
