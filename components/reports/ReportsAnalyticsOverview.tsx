"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import AnalyticsFilterBar, { AnalyticsFilterValue, BaseOption } from "@/components/analytics/AnalyticsFilterBar";
import BarComparisonChart from "@/components/charts/BarComparisonChart";
import StatTile from "@/components/charts/StatTile";

type AttendancePoint = { date: string; newCount: number; returningCount: number };
type Dropoff = { priorCount: number; currentCount: number; droppedOffCount: number; droppedOffTeens: { id: string; name: string }[] };

function defaultFilter(baseId: string): AnalyticsFilterValue {
  const now = new Date();
  return {
    baseId,
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default function ReportsAnalyticsOverview() {
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const [bases, setBases] = useState<BaseOption[]>([]);
  const [filter, setFilter] = useState<AnalyticsFilterValue>(() => defaultFilter(""));
  const [points, setPoints] = useState<AttendancePoint[]>([]);
  const [summary, setSummary] = useState({ average: 0, total: 0 });
  const [dropoff, setDropoff] = useState<Dropoff | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/bases")
        .then((res) => res.json())
        .then(setBases);
    } else if (user?.baseId) {
      setFilter((f) => ({ ...f, baseId: user.baseId! }));
    }
  }, [isSuperAdmin, user?.baseId]);

  useEffect(() => {
    if (!isSuperAdmin && !filter.baseId) return;
    const params = new URLSearchParams({ from: filter.from, to: filter.to });
    if (filter.baseId) params.set("baseId", filter.baseId);

    const dropoffParams = new URLSearchParams();
    if (filter.baseId) dropoffParams.set("baseId", filter.baseId);
    dropoffParams.set("periodStart", filter.from);
    dropoffParams.set("periodEnd", filter.to);

    setLoading(true);
    Promise.all([
      fetch(`/api/analytics/attendance?${params}`).then((r) => r.json()),
      fetch(`/api/analytics/attendance/dropoff?${dropoffParams}`).then((r) => r.json()),
    ])
      .then(([attendance, dropoffRes]) => {
        setPoints(attendance.points ?? []);
        setSummary(attendance.summary ?? { average: 0, total: 0 });
        setDropoff(dropoffRes);
      })
      .finally(() => setLoading(false));
  }, [isSuperAdmin, filter.baseId, filter.from, filter.to]);

  const totals = useMemo(
    () => points.reduce((acc, p) => ({ newCount: acc.newCount + p.newCount, returningCount: acc.returningCount + p.returningCount }), { newCount: 0, returningCount: 0 }),
    [points],
  );

  const visibleDroppedOff = dropoff?.droppedOffTeens.slice(0, 20) ?? [];
  const extraDroppedOff = Math.max(0, (dropoff?.droppedOffCount ?? 0) - visibleDroppedOff.length);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Analytics Overview</h2>
      <AnalyticsFilterBar bases={bases} isSuperAdmin={isSuperAdmin} value={filter} onChange={setFilter} />

      {loading && <p className="text-sm text-gray-500">Loading charts...</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Average attendance" value={summary.average} />
        <StatTile label="New this period" value={totals.newCount} />
        <StatTile label="Returning this period" value={totals.returningCount} />
        <StatTile label="Dropped off" value={dropoff?.droppedOffCount ?? 0} />
      </div>

      <div className="bg-white border rounded p-6 shadow-sm">
        <h3 className="font-semibold mb-3">New vs Returning Attendance</h3>
        <BarComparisonChart
          title="New vs returning attendance per activity"
          labels={points.map((p) => new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }))}
          series={[
            { name: "New", data: points.map((p) => p.newCount) },
            { name: "Returning", data: points.map((p) => p.returningCount) },
          ]}
        />
      </div>

      <div className="bg-white border rounded p-6 shadow-sm">
        <h3 className="font-semibold mb-3">Dropped Off ({dropoff?.droppedOffCount ?? 0})</h3>
        {visibleDroppedOff.length ? (
          <ul className="flex flex-wrap gap-3 text-sm">
            {visibleDroppedOff.map((teen) => (
              <li key={teen.id}>
                <Link href={`/dashboard/lieutenants/${teen.id}`} className="px-3 py-1 bg-amber-50 text-amber-700 rounded hover:bg-amber-100">
                  {teen.name}
                </Link>
              </li>
            ))}
            {extraDroppedOff > 0 && <li className="px-3 py-1 text-gray-500">+{extraDroppedOff} more</li>}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No drop-off detected for this period.</p>
        )}
      </div>
    </div>
  );
}
