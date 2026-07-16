import { HTMLAttributes, ReactNode, TableHTMLAttributes } from "react";
import clsx from "clsx";

export function TableContainer({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("border border-neutral-200 rounded-card shadow-soft bg-white overflow-x-auto", className)}>{children}</div>;
}

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return <table className={clsx("w-full table-auto text-sm", className)} {...props} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={clsx("bg-neutral-50", className)} {...props} />;
}

export function TableHeaderCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={clsx("px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500", className)}
      {...props}
    />
  );
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={clsx("border-t border-neutral-100 transition-colors hover:bg-accent-50/40", className)} {...props} />;
}

export function TableCell({ className, ...props }: HTMLAttributes<HTMLTableCellElement>) {
  return <td className={clsx("px-4 py-3 text-neutral-700", className)} {...props} />;
}
