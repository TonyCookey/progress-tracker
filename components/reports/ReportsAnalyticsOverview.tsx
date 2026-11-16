"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import AnalyticsFilterBar, { AnalyticsFilterValue, BaseOption, filterToParams } from "@/components/analytics/AnalyticsFilterBar";
import BarComparisonChart from "@/components/charts/BarComparisonChart";
import StackedBarChart from "@/components/charts/StackedBarChart";
import DonutChart from "@/components/charts/DonutChart";
import StatTile from "@/components/charts/StatTile";
import ChartCard from "@/components/charts/ChartCard";
import Badge from "@/components/ui/Badge";
import { formatDateUTC } from "@/lib/formatDate";

type AttendancePoint = { name: string; type: string; date: string; newCount: number; returningCount: number; attended: number; recorded: boolean; rate: number | null };
type Summary = { average: number; total: number; averageRate: number | null; recordedActivities: number; uniqueAttendees: number };
type Dropoff = {
  priorCount: number;
  currentCount: number;
  droppedOffCount: number;
  droppedOffTeens: { id: string; name: string; lastAttended: string | null; missed: number }[];
  minMissed: number;
  currentRecordedActivities: number;
};
type GroupBreakdown = {
  platoons: { groupId: string; name: string; teenCount: number }[];
  squads: { groupId: string; name: string; teenCount: number }[];
  attendanceByPlatoon: { groupId: string; name: string; attended: number; rate: number | null }[];
  teachingRates: { userId: string; name: string; taught: number; scheduled: number; rate: number }[];
};
type AttendanceByType = { type: string; average: number; activityCount: number; averageRate: number | null };
type Demographics = { genderBreakdown: { gender: string; count: number }[]; ageBreakdown: { bucket: string; count: number }[]; totalActive: number };

const EMPTY_SUMMARY: Summary = { average: 0, total: 0, averageRate: null, recordedActivities: 0, uniqueAttendees: 0 };
const shortDate = (iso: string) => formatDateUTC(iso, { month: "short", day: "numeric" });

function defaultFilter(baseId: string): AnalyticsFilterValue {
  const now = new Date();
  return {
    baseId,
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
    platoonIds: [],
    squadIds: [],
    activityType: "",
  };
}

export default function ReportsAnalyticsOverview() {
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const [bases, setBases] = useState<BaseOption[]>([]);
  const [filter, setFilter] = useState<AnalyticsFilterValue>(() => defaultFilter(""));
  const [points, setPoints] = useState<AttendancePoint[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
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

  const filterKey = JSON.stringify(filter);
  useEffect(() => {
    if (!user || (!isSuperAdmin && !filter.baseId)) return;
    const params = filterToParams(filter);
    const groupsParams = filterToParams(filter, { groups: false, activityType: false });
    const demographicsParams = filterToParams(filter, { activityType: false });
    const dropoffParams = filterToParams(filter);
    dropoffParams.delete("from");
    dropoffParams.delete("to");
    dropoffParams.set("periodStart", filter.from);
    dropoffParams.set("periodEnd", filter.to);

    const json = (r: Response): Promise<any> => (r.ok ? r.json() : Promise.resolve({}));
    setLoading(true);
    Promise.all([
      fetch(`/api/analytics/attendance?${params}`).then(json),
      fetch(`/api/analytics/attendance/dropoff?${dropoffParams}`).then(json),
      fetch(`/api/analytics/groups?${groupsParams}`).then(json),
      fetch(`/api/analytics/demographics?${demographicsParams}`).then(json),
    ])
      .then(([attendance, dropoffRes, groupsRes, demographicsRes]) => {
        setPoints(attendance.points ?? []);
        setSummary(attendance.summary ?? EMPTY_SUMMARY);
        setByType(attendance.byType ?? []);
        setDropoff(dropoffRes.droppedOffTeens ? dropoffRes : null);
        setGroups(groupsRes.platoons ? groupsRes : null);
        setDemographics(demographicsRes.genderBreakdown ? demographicsRes : null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isSuperAdmin, filterKey]);

  const recorded = points.filter((p) => p.recorded);
  const totals = useMemo(
    () => recorded.reduce((acc, p) => ({ newCount: acc.newCount + p.newCount, returningCount: acc.returningCount + p.returningCount }), { newCount: 0, returningCount: 0 }),
    [recorded],
  );
  const ratedPlatoons = groups?.attendanceByPlatoon.filter((p) => p.rate !== null) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Attendance analytics</h2>
          <p className="text-sm text-neutral-500">Who is coming, who is new, and who needs a follow-up.</p>
        </div>
        {loading && <span className="text-xs text-neutral-400 animate-pulse">Updating…</span>}
      </div>
      <AnalyticsFilterBar bases={bases} isSuperAdmin={isSuperAdmin} value={filter} onChange={setFilter} showGroups showActivityType userBaseId={user?.baseId} />

      <div className={`grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <StatTile label="Avg present" value={summary.average} hint={`Teens per activity, over ${summary.recordedActivities} recorded activities`} />
        <StatTile label="Average turnout" value={summary.averageRate !== null ? `${summary.averageRate}%` : "—"} hint="Present ÷ expected, averaged" />
        <StatTile label="First-timers" value={totals.newCount} hint="Attended for the very first time" />
        <StatTile label="Returning" value={totals.returningCount} hint="Visits by teens who had come before" />
        <StatTile label="Needs follow-up" value={dropoff?.droppedOffCount ?? 0} hint={`Missed ${dropoff?.minMissed ?? 3}+ activities in a row`} />
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <ChartCard
          className="lg:col-span-2"
          title="First-timers vs returning, per activity"
          description="Each bar is one activity. The full bar is everyone present; the split shows who was attending for the first time ever."
        >
          <StackedBarChart
            title="First-timers vs returning attendance per activity"
            labels={recorded.map((p) => shortDate(p.date))}
            series={[
              { name: "Returning", data: recorded.map((p) => p.returningCount) },
              { name: "First-timers", data: recorded.map((p) => p.newCount) },
            ]}
          />
        </ChartCard>

        {byType.length > 0 && (
          <ChartCard title="Attendance by activity type" description="Average number of teens present at each kind of activity.">
            <BarComparisonChart
              title="Average attendance per activity type"
              labels={byType.map((t) => `${t.type} (${t.activityCount})`)}
              series={[{ name: "Avg present", data: byType.map((t) => t.average) }]}
              horizontal
            />
          </ChartCard>
        )}

        {ratedPlatoons.length > 0 && (
          <ChartCard
            title="Turnout by platoon"
            description="Of the activities each platoon's teens were expected at, the share they actually attended. Fair across platoons of different sizes."
            footnote="Uses base + date filters only."
          >
            <BarComparisonChart
              title="Turnout percentage by platoon"
              labels={ratedPlatoons.map((g) => g.name)}
              series={[{ name: "Turnout", data: ratedPlatoons.map((g) => g.rate) }]}
              formatValue={(n) => `${n}%`}
              horizontal
            />
          </ChartCard>
        )}

        {demographics && demographics.totalActive > 0 && (
          <ChartCard className="lg:col-span-2" title={`Who our teens are · ${demographics.totalActive} active`} description="Gender and age of active teens matching the filters.">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <DonutChart
                title="Gender split"
                labels={demographics.genderBreakdown.map((g) => g.gender)}
                data={demographics.genderBreakdown.map((g) => g.count)}
                colorPalette="demographic"
              />
              <BarComparisonChart
                title="Age distribution"
                labels={demographics.ageBreakdown.map((a) => a.bucket)}
                series={[{ name: "Teens", data: demographics.ageBreakdown.map((a) => a.count) }]}
              />
            </div>
          </ChartCard>
        )}

        {groups && groups.platoons.length > 0 && (
          <ChartCard title="Platoon sizes" description="Active teens in each platoon." footnote="Uses base filter only.">
            <BarComparisonChart
              title="Active teens per platoon"
              labels={groups.platoons.map((g) => g.name)}
              series={[{ name: "Teens", data: groups.platoons.map((g) => g.teenCount) }]}
              horizontal
            />
          </ChartCard>
        )}

        {groups && groups.teachingRates.length > 0 && (
          <ChartCard
            title="Teaching attendance by general"
            description="Of the activities a general was scheduled to teach, the share they showed up for."
          >
            <BarComparisonChart
              title="Teaching attendance rate by general"
              labels={groups.teachingRates.map((g) => `${g.name} (${g.taught}/${g.scheduled})`)}
              series={[{ name: "Showed up", data: groups.teachingRates.map((g) => g.rate) }]}
              formatValue={(n) => `${n}%`}
              horizontal
            />
          </ChartCard>
        )}

        <ChartCard
          className="lg:col-span-2"
          title="Needs follow-up"
          description={`Teens who have come before but missed their last ${dropoff?.minMissed ?? 3}+ activities in a row that they were expected at, up to the end of the period. Activities with no attendance marked are ignored, so an unmarked Sunday won't flag everyone.`}
          actions={dropoff && dropoff.droppedOffCount > 0 ? <Badge tone="warning">{dropoff.droppedOffCount}</Badge> : undefined}
        >
          {dropoff && dropoff.droppedOffTeens.length ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {dropoff.droppedOffTeens.map((teen) => (
                <li key={teen.id}>
                  <Link
                    href={`/dashboard/lieutenants/${teen.id}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-warning-50 hover:bg-warning-50/70 transition-colors"
                  >
                    <span className="text-sm font-medium text-neutral-900 truncate">{teen.name}</span>
                    <span className="text-xs text-warning-700 whitespace-nowrap">
                      {teen.lastAttended ? `last ${shortDate(teen.lastAttended)}` : ""} · missed {teen.missed}
                    </span>
                  </Link>
                </li>
              ))}
              {dropoff.droppedOffCount > dropoff.droppedOffTeens.length && (
                <li className="px-3 py-2 text-sm text-neutral-500">+{dropoff.droppedOffCount - dropoff.droppedOffTeens.length} more</li>
              )}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">
              {dropoff && dropoff.currentRecordedActivities === 0
                ? "Not enough activities have been recorded in this period to judge drop-off yet."
                : "Nobody has dropped off in this period."}
            </p>
          )}
        </ChartCard>
      </div>
    </div>
  );
}
