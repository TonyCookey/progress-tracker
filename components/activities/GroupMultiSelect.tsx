"use client";

import { useEffect } from "react";
import Select from "react-select";
import { selectStyles } from "@/components/ui/Select";

export type GroupLite = { id: string; name: string; baseId: string; base?: { name: string } | null };
type Option = { value: string; label: string };

// Multi-select for the platoons or squads an activity is for. Only offers groups from
// the activity's base (a cross-base activity can pick from every base, labelled).
export default function GroupMultiSelect({
  id,
  label,
  hint,
  groups,
  baseId,
  value,
  onChange,
  onBlur,
}: {
  id: string;
  label: string;
  hint?: string;
  groups: GroupLite[];
  baseId: string;
  value: string[] | undefined;
  onChange: (ids: string[]) => void;
  onBlur?: () => void;
}) {
  const crossBase = !baseId || baseId === "cross-base";
  const options: Option[] = groups
    .filter((g) => crossBase || g.baseId === baseId)
    .map((g) => ({ value: g.id, label: crossBase && g.base?.name ? `${g.name} · ${g.base.name}` : g.name }));

  // Switching the activity's base drops groups from the old base (the API would reject them).
  useEffect(() => {
    if (crossBase || !groups.length || !value?.length) return;
    const kept = value.filter((id) => groups.find((g) => g.id === id)?.baseId === baseId);
    if (kept.length !== value.length) onChange(kept);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseId, groups]);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>
      <Select<Option, true>
        inputId={id}
        instanceId={id}
        isMulti
        options={options}
        placeholder="Open to everyone"
        className="react-select-container"
        classNamePrefix="react-select"
        styles={selectStyles}
        value={options.filter((opt) => value?.includes(opt.value))}
        onChange={(selected) => onChange(selected.map((opt) => opt.value))}
        onBlur={onBlur}
        noOptionsMessage={() => (crossBase ? "No groups found" : "No groups in this base")}
      />
      {hint && <p className="mt-1 text-xs text-neutral-400">{hint}</p>}
    </div>
  );
}
