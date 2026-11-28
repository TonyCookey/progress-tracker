"use client";

import { useEffect, useMemo, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { calculateAge } from "@/lib/calculateAge";

type Candidate = { id: string; name: string; dateOfBirth: string | null; base: { name: string }; platoon: { name: string } | null };

const today = () => new Date().toISOString().slice(0, 10);

// Pick teens to graduate. Oldest first, with a one-click "select everyone aged N+" so
// a yearly graduation is a few clicks; `preselected` is used from a teen's own profile.
export default function GraduateTeensModal({
  isOpen,
  onClose,
  onDone,
  baseId,
  preselected,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDone: () => void;
  baseId?: string;
  preselected?: { id: string; name: string };
}) {
  const toast = useToast();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [minAge, setMinAge] = useState(18);
  const [date, setDate] = useState(today());
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelected(new Set(preselected ? [preselected.id] : []));
    setDate(today());
    setNote("");
    setSearch("");
    if (preselected) return;
    setLoading(true);
    fetch(`/api/graduands/candidates${baseId ? `?baseId=${baseId}` : ""}`)
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((d) => setCandidates(d.data ?? []))
      .finally(() => setLoading(false));
  }, [isOpen, baseId, preselected]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? candidates.filter((c) => c.name.toLowerCase().includes(q)) : candidates;
  }, [candidates, search]);

  const eligible = candidates.filter((c) => c.dateOfBirth && calculateAge(c.dateOfBirth) >= minAge);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const submit = async () => {
    if (!selected.size) return;
    setSaving(true);
    try {
      const res = await fetch("/api/graduands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teenIds: Array.from(selected), graduatedAt: date, note: note || null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return void toast.error(data.message || "Couldn't graduate these teens");
      toast.success(`${data.graduated} teen${data.graduated === 1 ? "" : "s"} graduated 🎓`);
      onDone();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={preselected ? `Graduate ${preselected.name}` : "Graduate teens"} size="lg">
      <div className="space-y-5">
        <p className="text-sm text-neutral-600">
          Graduands leave the current roster: they stop counting towards membership, attendance registers and group sizes from the graduation date. Their
          history stays, and they&apos;re listed on the Graduands page. You can undo this later.
        </p>

        {!preselected && (
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search teens"
                  className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm min-h-11 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <span className="whitespace-nowrap">Aged</span>
                <input
                  type="number"
                  min={10}
                  max={30}
                  value={minAge}
                  onChange={(e) => setMinAge(Number(e.target.value) || 0)}
                  className="w-16 rounded-lg border border-neutral-300 px-2 py-2 text-sm min-h-11 md:min-h-0"
                  aria-label="Minimum age"
                />
                <span className="whitespace-nowrap">+</span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!eligible.length}
                  onClick={() => setSelected(new Set(eligible.map((c) => c.id)))}
                  className="whitespace-nowrap"
                >
                  Select {eligible.length}
                </Button>
              </div>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-xl border border-neutral-200 divide-y divide-neutral-100">
              {loading ? (
                <p className="p-4 text-sm text-neutral-500">Loading roster...</p>
              ) : visible.length === 0 ? (
                <p className="p-4 text-sm text-neutral-500">No teens match.</p>
              ) : (
                visible.map((c) => {
                  const age = c.dateOfBirth ? calculateAge(c.dateOfBirth) : null;
                  const checked = selected.has(c.id);
                  return (
                    <label
                      key={c.id}
                      className={clsx("flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm hover:bg-neutral-50", checked && "bg-accent-50/60")}
                    >
                      <input type="checkbox" checked={checked} onChange={() => toggle(c.id)} className="h-4 w-4 rounded border-neutral-300 text-accent-600" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-neutral-900">{c.name}</span>
                        <span className="block truncate text-xs text-neutral-500">
                          {[c.base.name, c.platoon?.name].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span className={clsx("shrink-0 tabular-nums text-xs", age !== null && age >= minAge ? "font-semibold text-accent-700" : "text-neutral-500")}>
                        {age !== null ? `${age} yrs` : "No DOB"}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-600">
                <strong className="text-neutral-900">{selected.size}</strong> selected
              </span>
              {selected.size > 0 && (
                <button type="button" onClick={() => setSelected(new Set())} className="text-neutral-500 hover:text-neutral-800">
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="graduation-date" label="Graduation date" type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} required />
          <div className="sm:col-span-2">
            <Textarea
              id="graduation-note"
              label="Note (optional)"
              placeholder="e.g. Class of 2026 - moving to the young adults' church"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} isLoading={saving} disabled={!selected.size || !date}>
            Graduate {selected.size || ""} {selected.size === 1 ? "teen" : "teens"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
