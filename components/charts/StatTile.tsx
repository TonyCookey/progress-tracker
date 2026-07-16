import { ReactNode } from "react";
import Card from "@/components/ui/Card";

export default function StatTile({
  label,
  value,
  delta,
  sparkline,
}: {
  label: string;
  value: string | number;
  delta?: { value: number; direction: "up" | "down"; goodDirection?: "up" | "down" };
  sparkline?: ReactNode;
}) {
  const deltaGood = delta && delta.direction === (delta.goodDirection ?? "up");
  return (
    <Card padded className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="text-xl font-bold text-neutral-900 mt-1">{value}</p>
      {delta && (
        <p className={`text-xs mt-1 font-medium ${deltaGood ? "text-success-700" : "text-warning-700"}`}>
          {delta.direction === "up" ? "▲" : "▼"} {Math.abs(delta.value).toFixed(1)}%
        </p>
      )}
      {sparkline && <div className="mt-2">{sparkline}</div>}
    </Card>
  );
}
