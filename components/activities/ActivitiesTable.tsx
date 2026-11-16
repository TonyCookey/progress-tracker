"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import LoadingSpinner from "../common/LoadingSpinner";
import { EyeIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import { TableContainer, Table, TableHead, TableHeaderCell, TableRow, TableCell } from "@/components/ui/Table";
import { formatDateUTC } from "@/lib/formatDate";

type Activity = {
  id: string;
  name: string;
  type: string;
  date: string;
  isCrossBase: boolean;
  baseId: string | null;
  base?: { name: string };
  groups: { id: string; name: string; type: "PLATOON" | "SQUAD" }[];
  _count?: { teenParticipation: number };
};

const PAGE_SIZE = 15;
const filterClass =
  "border border-neutral-300 rounded-lg px-3 py-2 w-full sm:w-auto text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-accent-500 bg-white";

const activityDate = (iso: string) => formatDateUTC(iso, { day: "numeric", month: "short", year: "numeric" });

function GroupsCell({ groups }: { groups: Activity["groups"] }) {
  if (!groups?.length) return <span className="text-neutral-400 text-sm">Everyone</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {groups.map((g) => (
        <Badge key={g.id} tone={g.type === "PLATOON" ? "success" : "neutral"} size="sm">
          {g.name}
        </Badge>
      ))}
    </div>
  );
}

export default function ActivitiesTable() {
  const { data: session } = useSession();
  const isSuperAdmin = session?.user?.role === "SUPERADMIN";
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [baseFilter, setBaseFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function fetchActivities() {
      const res = await fetch("/api/activities");
      const data = await res.json();
      setActivities(Array.isArray(data) ? data : []);
      setLoading(false);
    }
    fetchActivities();
  }, []);

  const types = useMemo(() => Array.from(new Set(activities.map((a) => a.type))).sort(), [activities]);
  const bases = useMemo(
    () => Array.from(new Map(activities.filter((a) => a.baseId && a.base).map((a) => [a.baseId!, a.base!.name])).entries()),
    [activities],
  );

  const filtered = activities.filter(
    (a) =>
      (!search || a.name.toLowerCase().includes(search.toLowerCase())) &&
      (!type || a.type === type) &&
      (!baseFilter || (baseFilter === "cross-base" ? a.isCrossBase : a.baseId === baseFilter)),
  );
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const reset = (fn: (v: string) => void) => (v: string) => {
    fn(v);
    setPage(1);
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center mb-4">
        <input
          type="text"
          placeholder="Search activities..."
          value={search}
          onChange={(e) => reset(setSearch)(e.target.value)}
          className="border border-neutral-300 px-3 py-2 rounded-lg w-full sm:w-64 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-accent-400"
        />
        <select aria-label="Activity type" className={filterClass} value={type} onChange={(e) => reset(setType)(e.target.value)}>
          <option value="">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        {isSuperAdmin && (
          <select aria-label="Base" className={filterClass} value={baseFilter} onChange={(e) => reset(setBaseFilter)(e.target.value)}>
            <option value="">All bases</option>
            {bases.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
            <option value="cross-base">Cross base</option>
          </select>
        )}
        <span className="text-sm text-neutral-500 sm:ml-auto">
          {filtered.length} {filtered.length === 1 ? "activity" : "activities"}
        </span>
      </div>

      {!visible.length ? (
        <EmptyState title="No activities found" description="Try a different search or filter." />
      ) : (
        <>
          <div className="hidden md:block">
            <TableContainer>
              <Table>
                <TableHead>
                  <tr>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Type</TableHeaderCell>
                    <TableHeaderCell>Date</TableHeaderCell>
                    <TableHeaderCell>Base</TableHeaderCell>
                    <TableHeaderCell>For</TableHeaderCell>
                    <TableHeaderCell className="text-right">Present</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </tr>
                </TableHead>
                <tbody>
                  {visible.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-medium">{activity.name}</TableCell>
                      <TableCell>
                        <Badge tone="accent">{activity.type}</Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{activityDate(activity.date)}</TableCell>
                      <TableCell>{activity.isCrossBase ? <Badge tone="accent">Cross Base</Badge> : (activity.base?.name ?? "-")}</TableCell>
                      <TableCell>
                        <GroupsCell groups={activity.groups} />
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {activity._count?.teenParticipation ? activity._count.teenParticipation : <span className="text-xs text-warning-700">Not marked</span>}
                      </TableCell>
                      <TableCell>
                        <Link href={`/dashboard/activities/${activity.id}`} title="View" className="inline-flex p-2 rounded-pill hover:bg-accent-50 transition">
                          <EyeIcon className="w-5 h-5 text-accent-600" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
          </div>
          <div className="md:hidden space-y-4">
            {visible.map((activity) => (
              <Card key={activity.id} padded className="flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Badge tone="accent">{activity.type}</Badge>
                    <span className="block font-medium text-sm break-words leading-snug mt-2">{activity.name}</span>
                  </div>
                  <Link href={`/dashboard/activities/${activity.id}`} title="View" className="p-2 rounded-pill hover:bg-accent-50 transition">
                    <ArrowRightIcon className="w-5 h-5 text-accent-600" />
                  </Link>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-600">
                  <span>{activityDate(activity.date)}</span>
                  <span>{activity.isCrossBase ? "Cross Base" : (activity.base?.name ?? "-")}</span>
                  <span>{activity._count?.teenParticipation ? `${activity._count.teenParticipation} present` : "Not marked"}</span>
                </div>
                <GroupsCell groups={activity.groups} />
              </Card>
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}
