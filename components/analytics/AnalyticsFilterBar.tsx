"use client";

export type AnalyticsFilterValue = { baseId: string; from: string; to: string };
export type BaseOption = { id: string; name: string; label?: string | null };

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function preset(kind: "month" | "3months" | "ytd" | "year"): { from: string; to: string } {
  const now = new Date();
  const to = toISODate(now);
  if (kind === "month") return { from: toISODate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))), to };
  if (kind === "3months") return { from: toISODate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1))), to };
  if (kind === "ytd") return { from: toISODate(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))), to };
  return { from: toISODate(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))), to: toISODate(new Date(Date.UTC(now.getUTCFullYear(), 11, 31))) };
}

export default function AnalyticsFilterBar({
  bases,
  isSuperAdmin,
  value,
  onChange,
  presets = true,
}: {
  bases: BaseOption[];
  isSuperAdmin: boolean;
  value: AnalyticsFilterValue;
  onChange: (next: AnalyticsFilterValue) => void;
  presets?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap bg-white border border-neutral-200 rounded-card p-4 shadow-soft">
      {isSuperAdmin && (
        <select
          value={value.baseId}
          onChange={(e) => onChange({ ...value, baseId: e.target.value })}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500"
        >
          <option value="">All bases</option>
          {bases.map((base) => (
            <option key={base.id} value={base.id}>
              {base.label ?? base.name}
            </option>
          ))}
        </select>
      )}
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={value.from}
          onChange={(e) => onChange({ ...value, from: e.target.value })}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500"
          aria-label="From date"
        />
        <span className="text-neutral-400">to</span>
        <input
          type="date"
          value={value.to}
          onChange={(e) => onChange({ ...value, to: e.target.value })}
          className="border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500"
          aria-label="To date"
        />
      </div>
      {presets && (
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["This Month", "month"],
              ["Last 3 Months", "3months"],
              ["Year to Date", "ytd"],
              ["This Year", "year"],
            ] as const
          ).map(([label, kind]) => (
            <button
              key={kind}
              type="button"
              onClick={() => onChange({ ...value, ...preset(kind) })}
              className="text-sm px-3 py-1.5 bg-accent-50 text-accent-700 rounded-pill hover:bg-accent-100 font-medium transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
