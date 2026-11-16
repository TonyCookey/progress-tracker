"use client";

import { useEffect, useMemo, useState } from "react";
import Select from "react-select";
import clsx from "clsx";
import { selectStyles } from "@/components/ui/Select";

export type AnalyticsFilterValue = {
  baseId: string;
  from: string;
  to: string;
  platoonIds?: string[];
  squadIds?: string[];
  activityType?: string;
};
export type BaseOption = { id: string; name: string; label?: string | null };

type GroupOption = { id: string; name: string; baseId: string; base?: { name: string } | null };
type Option = { value: string; label: string };
type PresetKind = "month" | "3months" | "ytd" | "year";

function toISODate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function preset(kind: PresetKind): { from: string; to: string } {
  const now = new Date();
  const to = toISODate(now);
  if (kind === "month") return { from: toISODate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))), to };
  if (kind === "3months") return { from: toISODate(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1))), to };
  if (kind === "ytd") return { from: toISODate(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))), to };
  return { from: toISODate(new Date(Date.UTC(now.getUTCFullYear(), 0, 1))), to: toISODate(new Date(Date.UTC(now.getUTCFullYear(), 11, 31))) };
}

const PRESETS: [string, PresetKind][] = [
  ["This month", "month"],
  ["Last 3 months", "3months"],
  ["Year to date", "ytd"],
  ["This year", "year"],
];

// Query-string form of a filter, shared by every analytics consumer so the params
// (and their comma-joined id lists) are spelled the same way everywhere.
export function filterToParams(value: AnalyticsFilterValue, opts: { groups?: boolean; activityType?: boolean } = {}) {
  const params = new URLSearchParams({ from: value.from, to: value.to });
  if (value.baseId) params.set("baseId", value.baseId);
  if (opts.groups !== false) {
    if (value.platoonIds?.length) params.set("platoonIds", value.platoonIds.join(","));
    if (value.squadIds?.length) params.set("squadIds", value.squadIds.join(","));
  }
  if (opts.activityType !== false && value.activityType) params.set("activityType", value.activityType);
  return params;
}

export function hasGroupFilter(value: AnalyticsFilterValue) {
  return !!(value.platoonIds?.length || value.squadIds?.length);
}

const inputClass =
  "w-full min-w-0 sm:w-auto border border-neutral-300 rounded-lg px-3 py-2 text-sm text-neutral-900 bg-white focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500";

export default function AnalyticsFilterBar({
  bases,
  isSuperAdmin,
  value,
  onChange,
  presets = true,
  showGroups = false,
  showActivityType = false,
  userBaseId,
}: {
  bases: BaseOption[];
  isSuperAdmin: boolean;
  value: AnalyticsFilterValue;
  onChange: (next: AnalyticsFilterValue) => void;
  presets?: boolean;
  showGroups?: boolean;
  showActivityType?: boolean;
  userBaseId?: string;
}) {
  const [platoons, setPlatoons] = useState<GroupOption[]>([]);
  const [squads, setSquads] = useState<GroupOption[]>([]);
  const [activityTypes, setActivityTypes] = useState<{ key: string; label: string }[]>([]);
  // Phones: platoon/squad/type filters fold away behind a toggle so charts start on screen.
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    if (!showGroups) return;
    Promise.all([
      fetch("/api/groups?type=PLATOON").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/groups?type=SQUAD").then((r) => (r.ok ? r.json() : [])),
    ]).then(([p, s]) => {
      setPlatoons(p);
      setSquads(s);
    });
  }, [showGroups]);

  useEffect(() => {
    if (!showActivityType) return;
    fetch("/api/refdata?category=activity_type")
      .then((r) => (r.ok ? r.json() : []))
      .then(setActivityTypes);
  }, [showActivityType]);

  // Groups belong to a base, so only offer the ones in the base being viewed.
  const scopeBaseId = isSuperAdmin ? value.baseId : (userBaseId ?? value.baseId);
  const groupLabel = (g: GroupOption) => (!scopeBaseId && g.base?.name ? `${g.name} · ${g.base.name}` : g.name);
  const platoonOptions: Option[] = useMemo(
    () => platoons.filter((g) => !scopeBaseId || g.baseId === scopeBaseId).map((g) => ({ value: g.id, label: groupLabel(g) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [platoons, scopeBaseId],
  );
  const squadOptions: Option[] = useMemo(
    () => squads.filter((g) => !scopeBaseId || g.baseId === scopeBaseId).map((g) => ({ value: g.id, label: groupLabel(g) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [squads, scopeBaseId],
  );

  const changeBase = (baseId: string) => {
    // Drop selected groups that don't belong to the newly selected base.
    const keep = (ids: string[] | undefined, list: GroupOption[]) => (ids ?? []).filter((id) => !baseId || list.find((g) => g.id === id)?.baseId === baseId);
    onChange({ ...value, baseId, platoonIds: keep(value.platoonIds, platoons), squadIds: keep(value.squadIds, squads) });
  };

  const activePreset = PRESETS.find(([, kind]) => {
    const p = preset(kind);
    return p.from === value.from && p.to === value.to;
  })?.[1];

  const hasExtraFilters = hasGroupFilter(value) || !!value.activityType;
  const extraCount = (value.platoonIds?.length ?? 0) + (value.squadIds?.length ?? 0) + (value.activityType ? 1 : 0);

  return (
    <div className="bg-white border border-neutral-200 rounded-card p-4 shadow-soft space-y-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:flex-wrap">
        {isSuperAdmin && (
          <select value={value.baseId} onChange={(e) => changeBase(e.target.value)} className={inputClass} aria-label="Base">
            <option value="">All bases</option>
            {bases.map((base) => (
              <option key={base.id} value={base.id}>
                {base.label ? `${base.name} (${base.label})` : base.name}
              </option>
            ))}
          </select>
        )}
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:flex items-center gap-2">
          <input type="date" value={value.from} onChange={(e) => onChange({ ...value, from: e.target.value })} className={inputClass} aria-label="From date" />
          <span className="text-neutral-400 text-sm">to</span>
          <input type="date" value={value.to} onChange={(e) => onChange({ ...value, to: e.target.value })} className={inputClass} aria-label="To date" />
        </div>
        {presets && (
          <div className="flex flex-wrap gap-2">
            {PRESETS.map(([label, kind]) => (
              <button
                key={kind}
                type="button"
                onClick={() => onChange({ ...value, ...preset(kind) })}
                aria-pressed={activePreset === kind}
                className={clsx(
                  "text-sm px-3 py-1.5 rounded-pill font-medium transition-colors",
                  activePreset === kind ? "bg-accent-600 text-white" : "bg-accent-50 text-accent-700 hover:bg-accent-100",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {(showGroups || showActivityType) && (
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
          className="md:hidden w-full flex items-center justify-between border-t border-neutral-100 pt-3 text-sm font-medium text-neutral-700"
        >
          <span>
            {showGroups ? "Platoons, squads & type" : "Activity type"}
            {extraCount > 0 && <span className="ml-2 rounded-pill bg-accent-600 px-2 py-0.5 text-xs text-white">{extraCount}</span>}
          </span>
          <span className="text-neutral-400">{moreOpen ? "Hide" : "Show"}</span>
        </button>
      )}

      {(showGroups || showActivityType) && (
        <div
          className={clsx(
            "flex-col gap-3 md:flex md:flex-row md:items-center md:flex-wrap md:border-t md:border-neutral-100 md:pt-3",
            moreOpen ? "flex" : "hidden",
          )}
        >
          {showActivityType && (
            <select
              value={value.activityType ?? ""}
              onChange={(e) => onChange({ ...value, activityType: e.target.value })}
              className={inputClass}
              aria-label="Activity type"
            >
              <option value="">All activity types</option>
              {activityTypes.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label}
                </option>
              ))}
            </select>
          )}
          {showGroups && (
            <>
              <div className="w-full md:w-64">
                <Select<Option, true>
                  isMulti
                  instanceId="filter-platoons"
                  placeholder="All platoons"
                  aria-label="Platoons"
                  options={platoonOptions}
                  styles={selectStyles}
                  value={platoonOptions.filter((o) => value.platoonIds?.includes(o.value))}
                  onChange={(selected) => onChange({ ...value, platoonIds: selected.map((o) => o.value) })}
                  noOptionsMessage={() => "No platoons in this base"}
                />
              </div>
              <div className="w-full md:w-64">
                <Select<Option, true>
                  isMulti
                  instanceId="filter-squads"
                  placeholder="All squads"
                  aria-label="Squads"
                  options={squadOptions}
                  styles={selectStyles}
                  value={squadOptions.filter((o) => value.squadIds?.includes(o.value))}
                  onChange={(selected) => onChange({ ...value, squadIds: selected.map((o) => o.value) })}
                  noOptionsMessage={() => "No squads in this base"}
                />
              </div>
            </>
          )}
          {hasExtraFilters && (
            <button
              type="button"
              onClick={() => onChange({ ...value, platoonIds: [], squadIds: [], activityType: "" })}
              className="text-sm text-neutral-500 hover:text-neutral-800 underline-offset-2 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
