"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { AcademicCapIcon, ArrowUturnLeftIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import EmptyState from "@/components/ui/EmptyState";
import Pagination from "@/components/ui/Pagination";
import PageHeader from "@/components/ui/PageHeader";
import StatTile from "@/components/charts/StatTile";
import Avatar from "@/components/ui/Avatar";
import PersonAvatar from "@/components/ui/PersonAvatar";
import ActionMenu from "@/components/ui/ActionMenu";
import { Table, TableCell, TableContainer, TableHead, TableHeaderCell, TableRow } from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { formatDateUTC } from "@/lib/formatDate";
import { calculateAge } from "@/lib/calculateAge";
import GraduateTeensModal from "./GraduateTeensModal";

type Graduand = {
  id: string;
  name: string;
  gender: string;
  rank: string;
  dateOfBirth: string | null;
  dateJoined: string | null;
  createdAt: string;
  graduatedAt: string | null;
  graduationNote: string | null;
  imageKey: string | null;
  base: { id: string; name: string };
  platoon: { id: string; name: string } | null;
};

type Response = { data: Graduand[]; total: number; totalAllTime: number; years: { year: number; count: number }[]; totalPages: number };

const DATE_FMT: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

const yearsWithUs = (g: Graduand) => {
  if (!g.graduatedAt) return null;
  const start = new Date(g.dateJoined ?? g.createdAt).getTime();
  const years = (new Date(g.graduatedAt).getTime() - start) / (365.25 * 86_400_000);
  return years >= 1 ? `${Math.floor(years)} yr${Math.floor(years) === 1 ? "" : "s"}` : "< 1 yr";
};

export default function GraduandsView() {
  const toast = useToast();
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const canManage = isSuperAdmin || session?.user?.role === "GENERAL";

  const [year, setYear] = useState<number | null>(null);
  const [baseId, setBaseId] = useState("");
  const [bases, setBases] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<Response | null>(null);
  const [loading, setLoading] = useState(true);
  const [graduateOpen, setGraduateOpen] = useState(false);
  const [undoTarget, setUndoTarget] = useState<Graduand | null>(null);

  useEffect(() => {
    if (!isSuperAdmin) return;
    fetch("/api/bases")
      .then((r) => (r.ok ? r.json() : []))
      .then(setBases);
  }, [isSuperAdmin]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (year) params.set("year", String(year));
      if (baseId) params.set("baseId", baseId);
      if (search.trim()) params.set("search", search.trim());
      const res = await fetch(`/api/graduands?${params}`);
      if (res.ok) setResult(await res.json());
    } finally {
      setLoading(false);
    }
  }, [page, year, baseId, search]);

  useEffect(() => {
    const t = setTimeout(load, search ? 250 : 0);
    return () => clearTimeout(t);
  }, [load, search]);

  const undo = async (g: Graduand) => {
    setUndoTarget(null);
    const res = await fetch("/api/graduands/undo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teenIds: [g.id] }),
    });
    if (!res.ok) return void toast.error("Couldn't undo the graduation");
    toast.success(`${g.name} is back on the roster`);
    load();
  };

  const thisYear = new Date().getUTCFullYear();
  const thisYearCount = result?.years.find((y) => y.year === thisYear)?.count ?? 0;
  const latestClass = result?.years[0];

  const filterChip = (label: string, active: boolean, onClick: () => void, count?: number) => (
    <button
      key={label}
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-sm font-medium transition-colors min-h-9",
        active ? "bg-accent-500 text-white shadow-soft" : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50",
      )}
    >
      {label}
      {count !== undefined && <span className={clsx("text-xs tabular-nums", active ? "text-white/80" : "text-neutral-400")}>{count}</span>}
    </button>
  );

  const rowMenu = (g: Graduand) =>
    canManage ? (
      <ActionMenu
        label={`Actions for ${g.name}`}
        items={[{ label: "Undo graduation", description: "Put back on the roster as Active", icon: ArrowUturnLeftIcon, onClick: () => setUndoTarget(g) }]}
      />
    ) : null;

  const personCell = (g: Graduand) => (
    <Link href={`/dashboard/lieutenants/${g.id}`} className="flex min-w-0 items-center gap-3 hover:underline">
      {g.imageKey ? <PersonAvatar imageKey={g.imageKey} alt={g.name} size={36} /> : <Avatar name={g.name} size="sm" />}
      <span className="min-w-0">
        <span className="block truncate font-medium text-neutral-900">{g.name}</span>
        <span className="block truncate text-xs text-neutral-500">{[g.base.name, g.platoon?.name].filter(Boolean).join(" · ")}</span>
      </span>
    </Link>
  );

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title="Graduands"
        description="Teens who have graduated out of the teens ministry. They no longer count on the active roster."
        actions={
          canManage ? (
            <Button leftIcon={<AcademicCapIcon className="h-4 w-4" />} onClick={() => setGraduateOpen(true)}>
              Graduate teens
            </Button>
          ) : undefined
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="All-time graduands" value={result?.totalAllTime ?? "-"} />
        <StatTile label={`Graduated in ${thisYear}`} value={result ? thisYearCount : "-"} />
        <StatTile label="Latest class" value={latestClass ? latestClass.year : "-"} hint={latestClass ? `${latestClass.count} graduand${latestClass.count === 1 ? "" : "s"}` : undefined} />
        <StatTile label="Showing" value={result?.total ?? "-"} hint={year ? `Class of ${year}` : "All years"} />
      </div>

      <Card padded={false} className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterChip("All years", year === null, () => (setYear(null), setPage(1)), result?.totalAllTime)}
            {result?.years.map((y) => filterChip(String(y.year), year === y.year, () => (setYear(y.year), setPage(1)), y.count))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {isSuperAdmin && (
              <select
                value={baseId}
                onChange={(e) => (setBaseId(e.target.value), setPage(1))}
                className="rounded-pill border border-neutral-300 bg-white px-3 py-2 text-sm min-h-11 md:min-h-0"
                aria-label="Base"
              >
                <option value="">All bases</option>
                {bases.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
              <input
                value={search}
                onChange={(e) => (setSearch(e.target.value), setPage(1))}
                placeholder="Search by name"
                className="w-full rounded-pill border border-neutral-300 py-2 pl-9 pr-3 text-sm sm:w-56 min-h-11 md:min-h-0 focus:outline-none focus:ring-2 focus:ring-accent-400"
              />
            </div>
          </div>
        </div>

        {loading && !result ? (
          <p className="p-6 text-sm text-neutral-500">Loading...</p>
        ) : !result?.data.length ? (
          <EmptyState
            icon={<AcademicCapIcon className="h-10 w-10" />}
            title={result?.totalAllTime ? "No graduands match these filters" : "No graduands yet"}
            description={result?.totalAllTime ? "Try another year or clear the search." : "When teens age out of the ministry, graduate them here to keep the roster numbers accurate."}
            action={
              canManage && !result?.totalAllTime ? (
                <Button onClick={() => setGraduateOpen(true)} leftIcon={<AcademicCapIcon className="h-4 w-4" />}>
                  Graduate teens
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <TableContainer className="hidden md:block rounded-none border-0 shadow-none">
              <Table>
                <TableHead>
                  <TableRow className="hover:bg-transparent">
                    <TableHeaderCell>Graduand</TableHeaderCell>
                    <TableHeaderCell>Graduated</TableHeaderCell>
                    <TableHeaderCell className="hidden lg:table-cell">Age then</TableHeaderCell>
                    <TableHeaderCell className="hidden lg:table-cell">With us</TableHeaderCell>
                    <TableHeaderCell className="hidden xl:table-cell">Note</TableHeaderCell>
                    <TableHeaderCell className="w-px" />
                  </TableRow>
                </TableHead>
                <tbody>
                  {result.data.map((g) => (
                    <TableRow key={g.id}>
                      <TableCell className="max-w-[16rem]">{personCell(g)}</TableCell>
                      <TableCell className="whitespace-nowrap">{g.graduatedAt ? formatDateUTC(g.graduatedAt, DATE_FMT) : "-"}</TableCell>
                      <TableCell className="hidden lg:table-cell tabular-nums">
                        {g.dateOfBirth && g.graduatedAt ? `${ageAt(g.dateOfBirth, g.graduatedAt)} yrs` : "-"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{yearsWithUs(g) ?? "-"}</TableCell>
                      <TableCell className="hidden xl:table-cell max-w-xs truncate text-neutral-500" title={g.graduationNote ?? undefined}>
                        {g.graduationNote || "-"}
                      </TableCell>
                      <TableCell className="text-right">{rowMenu(g)}</TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </TableContainer>

            <ul className="divide-y divide-neutral-100 md:hidden">
              {result.data.map((g) => (
                <li key={g.id} className="flex items-start gap-3 p-4">
                  <div className="min-w-0 flex-1 space-y-1">
                    {personCell(g)}
                    <p className="pl-12 text-xs text-neutral-500">
                      Graduated {g.graduatedAt ? formatDateUTC(g.graduatedAt, DATE_FMT) : "-"}
                      {g.dateOfBirth ? ` · now ${calculateAge(g.dateOfBirth)} yrs` : ""}
                    </p>
                    {g.graduationNote && <p className="pl-12 text-xs text-neutral-600">{g.graduationNote}</p>}
                  </div>
                  {rowMenu(g)}
                </li>
              ))}
            </ul>
          </>
        )}
        {result && result.totalPages > 1 && (
          <div className="border-t border-neutral-100 px-4 pb-4">
            <Pagination page={page} totalPages={result.totalPages} onChange={setPage} />
          </div>
        )}
      </Card>

      <GraduateTeensModal isOpen={graduateOpen} onClose={() => setGraduateOpen(false)} onDone={load} baseId={baseId || undefined} />

      <Modal isOpen={!!undoTarget} onClose={() => setUndoTarget(null)} title="Undo graduation?" size="sm">
        <p className="mb-4 text-sm text-neutral-600">
          <strong>{undoTarget?.name}</strong> will go back on the roster as Active and count in membership and attendance again.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setUndoTarget(null)}>
            Cancel
          </Button>
          <Button onClick={() => undoTarget && undo(undoTarget)}>Undo graduation</Button>
        </div>
      </Modal>
    </div>
  );
}

function ageAt(dob: string, at: string) {
  const b = new Date(dob);
  const d = new Date(at);
  let age = d.getUTCFullYear() - b.getUTCFullYear();
  if (d.getUTCMonth() < b.getUTCMonth() || (d.getUTCMonth() === b.getUTCMonth() && d.getUTCDate() < b.getUTCDate())) age--;
  return age;
}
