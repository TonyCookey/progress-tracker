import { ReactNode } from "react";
import Card from "@/components/ui/Card";

export default function StatTile({
  label,
  value,
  delta,
  sparkline,
  hint,
}: {
  label: string;
  value: string | number;
  delta?: { value: number; direction: "up" | "down"; goodDirection?: "up" | "down" };
  sparkline?: ReactNode;
  /** One short line explaining how the number is worked out. */
  hint?: string;
}) {
  const deltaGood = delta && delta.direction === (delta.goodDirection ?? "up");
  return (
    <Card padded className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-2xl font-bold text-neutral-900 mt-1 tabular-nums">{value}</p>
      {delta && (
        <p className={`text-xs mt-1 font-medium ${deltaGood ? "text-success-700" : "text-warning-700"}`}>
          {delta.direction === "up" ? "▲" : "▼"} {Math.abs(delta.value).toFixed(1)}%
        </p>
      )}
      {hint && <p className="text-xs text-neutral-400 mt-1 leading-snug">{hint}</p>}
      {sparkline && <div className="mt-2">{sparkline}</div>}
    </Card>
  );
}
