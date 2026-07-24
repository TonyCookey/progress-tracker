"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import AnalyticsFilterBar, { AnalyticsFilterValue, BaseOption } from "@/components/analytics/AnalyticsFilterBar";
import BarComparisonChart from "@/components/charts/BarComparisonChart";
import LineTrendChart from "@/components/charts/LineTrendChart";
import GroupBreakdownChart from "@/components/charts/GroupBreakdownChart";
import DonutChart from "@/components/charts/DonutChart";
import StatTile from "@/components/charts/StatTile";
import Card from "@/components/ui/Card";

type AttendancePoint = { date: string; newCount: number; returningCount: number; attended: number; rate: number | null };
type Dropoff = { priorCount: number; currentCount: number; droppedOffCount: number; droppedOffTeens: { id: string; name: string }[] };
type GroupBreakdown = {
  platoons: { groupId: string; name: string; teenCount: number }[];
  squads: { groupId: string; name: string; teenCount: number }[];
  attendanceByPlatoon: { groupId: string; name: string; attended: number }[];
  teachingRates: { userId: string; name: string; taught: number; scheduled: number; rate: number }[];
};
type AttendanceByType = { type: string; average: number; activityCount: number };
type Demographics = { genderBreakdown: { gender: string; count: number }[]; ageBreakdown: { bucket: string; count: number }[]; totalActive: number };

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
  const [summary, setSummary] = useState<{ average: number; total: number; averageRate: number | null }>({ average: 0, total: 0, averageRate: null });
  const [dropoff, setDropoff] = useState<Dropoff | null>(null);
  const [groups, setGroups] = useState<GroupBreakdown | null>(null);
  const [byType, setByType] = useState<AttendanceByType[]>([]);
  const [demographics, setDemographics] = useState<Demographics | null>(null);
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

    const demographicsParams = new URLSearchParams();
    if (filter.baseId) demographicsParams.set("baseId", filter.baseId);

    setLoading(true);
    Promise.all([
      fetch(`/api/analytics/attendance?${params}`).then((r) => r.json()),
      fetch(`/api/analytics/attendance/dropoff?${dropoffParams}`).then((r) => r.json()),
      fetch(`/api/analytics/groups?${params}`).then((r) => r.json()),
      fetch(`/api/analytics/demographics?${demographicsParams}`).then((r) => r.json()),
    ])
      .then(([attendance, dropoffRes, groupsRes, demographicsRes]) => {
        setPoints(attendance.points ?? []);
        setSummary(attendance.summary ?? { average: 0, total: 0, averageRate: null });
        setByType(attendance.byType ?? []);
        setDropoff(dropoffRes);
        setGroups(groupsRes);
        setDemographics(demographicsRes);
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
      <h2 className="text-lg font-semibold text-neutral-900">Analytics Overview</h2>
      <AnalyticsFilterBar bases={bases} isSuperAdmin={isSuperAdmin} value={filter} onChange={setFilter} />

      {loading && <p className="text-sm text-neutral-500">Loading charts...</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="Average attendance" value={summary.average} />
        <StatTile label="Avg attendance rate" value={summary.averageRate !== null ? `${summary.averageRate}%` : "N/A"} />
        <StatTile label="New this period" value={totals.newCount} />
        <StatTile label="Returning this period" value={totals.returningCount} />
        <StatTile label="Dropped off" value={dropoff?.droppedOffCount ?? 0} />
      </div>

      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">New vs Returning Attendance</h3>
        <BarComparisonChart
          title="New vs returning attendance per activity"
          labels={points.map((p) => new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }))}
          series={[
            { name: "New", data: points.map((p) => p.newCount) },
            { name: "Returning", data: points.map((p) => p.returningCount) },
          ]}
        />
      </Card>

      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Attendance Count vs Rate</h3>
        <LineTrendChart
          title="Attendance per activity, count and rate"
          labels={points.map((p) => new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }))}
          series={[
            { name: "Attended", data: points.map((p) => p.attended) },
            { name: "Rate", data: points.map((p) => p.rate), axis: "right", formatValue: (n) => `${n}%` },
          ]}
        />
      </Card>

      {byType.length > 0 && (
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Attendance by Activity Type</h3>
          <BarComparisonChart
            title="Average attendance per activity type"
            labels={byType.map((t) => t.type)}
            series={[{ name: "Average attendance", data: byType.map((t) => t.average) }]}
            horizontal
          />
        </Card>
      )}

      {demographics && demographics.totalActive > 0 && (
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Teen Demographics ({demographics.totalActive} active)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DonutChart
              title="Gender split"
              labels={demographics.genderBreakdown.map((g) => g.gender)}
              data={demographics.genderBreakdown.map((g) => g.count)}
            />
            <BarComparisonChart
              title="Age distribution"
              labels={demographics.ageBreakdown.map((a) => a.bucket)}
              series={[{ name: "Teens", data: demographics.ageBreakdown.map((a) => a.count) }]}
            />
          </div>
        </Card>
      )}

      {groups && (groups.platoons.length > 0 || groups.squads.length > 0) && (
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Groups</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <GroupBreakdownChart
              title="Platoon roster sizes"
              labels={groups.platoons.map((g) => g.name)}
              data={groups.platoons.map((g) => g.teenCount)}
            />
            <GroupBreakdownChart
              title="Attendance by platoon"
              labels={groups.attendanceByPlatoon.map((g) => g.name)}
              data={groups.attendanceByPlatoon.map((g) => g.attended)}
            />
          </div>
          {groups.teachingRates.length > 0 && (
            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Teaching Rate by General</h4>
              <BarComparisonChart
                title="Teaching attendance rate by general"
                labels={groups.teachingRates.map((g) => g.name)}
                series={[{ name: "Teaching rate", data: groups.teachingRates.map((g) => g.rate) }]}
                formatValue={(n) => `${n}%`}
                horizontal
              />
            </div>
          )}
        </Card>
      )}

      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Dropped Off ({dropoff?.droppedOffCount ?? 0})</h3>
        {visibleDroppedOff.length ? (
          <ul className="flex flex-wrap gap-3 text-sm">
            {visibleDroppedOff.map((teen) => (
              <li key={teen.id}>
                <Link href={`/dashboard/lieutenants/${teen.id}`} className="px-3 py-1 bg-warning-50 text-warning-700 rounded-pill hover:bg-warning-50/70 transition-colors">
                  {teen.name}
                </Link>
              </li>
            ))}
            {extraDroppedOff > 0 && <li className="px-3 py-1 text-neutral-500">+{extraDroppedOff} more</li>}
          </ul>
        ) : (
          <p className="text-sm text-neutral-500">No drop-off detected for this period.</p>
        )}
      </Card>
    </div>
  );
}
