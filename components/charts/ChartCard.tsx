import { ReactNode } from "react";
import clsx from "clsx";
import Card from "@/components/ui/Card";

// Standard wrapper for every analytics chart: a title, a one-line plain-language
// explanation of what is being measured (so nobody has to guess what "rate" means),
// optional header actions/badges, and a footnote slot for caveats.
export default function ChartCard({
  title,
  description,
  actions,
  footnote,
  className,
  children,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  footnote?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Card className={clsx("flex flex-col", className)}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
          {description && <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{description}</p>}
        </div>
        {actions && <div className="shrink-0">{actions}</div>}
      </div>
      <div className="flex-1">{children}</div>
      {footnote && <p className="text-xs text-neutral-400 mt-3 pt-3 border-t border-neutral-100">{footnote}</p>}
    </Card>
  );
}
