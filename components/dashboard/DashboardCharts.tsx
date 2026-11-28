"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import AnalyticsFilterBar, { AnalyticsFilterValue, BaseOption, filterToParams, hasGroupFilter } from "@/components/analytics/AnalyticsFilterBar";
import LineTrendChart from "@/components/charts/LineTrendChart";
import BarComparisonChart from "@/components/charts/BarComparisonChart";
import StackedBarChart from "@/components/charts/StackedBarChart";
import DonutChart from "@/components/charts/DonutChart";
import StatTile from "@/components/charts/StatTile";
import ChartCard from "@/components/charts/ChartCard";
import Badge from "@/components/ui/Badge";
import { formatMonthLabel, formatDateUTC } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatMoney";

type OfferingsTrendPoint = { month: string; cash: number; online: number; total: number };
type OfferingsByBasePoint = { baseId: string; baseName: string; month: string; cash: number; online: number; total: number };
type AttendancePoint = { activityId: string; name: string; type: string; date: string; attended: number; expected: number; recorded: boolean; rate: number | null };
type AttendanceSummary = { average: number; total: number; averageRate: number | null; recordedActivities: number; uniqueAttendees: number };
type GrowthPoint = { month: string; added: number; graduated: number; total: number };
type Engagement = { buckets: { bucket: string; count: number }[]; totalActive: number; notSeen: { id: string; name: string }[] };
type Dropoff = { droppedOffCount: number; droppedOffTeens: { id: string; name: string; lastAttended: string | null; missed: number }[]; minMissed: number };

const EMPTY_SUMMARY: AttendanceSummary = { average: 0, total: 0, averageRate: null, recordedActivities: 0, uniqueAttendees: 0 };

function defaultFilter(baseId: string): AnalyticsFilterValue {
  const now = new Date();
  return {
    baseId,
    from: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1)).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
    platoonIds: [],
    squadIds: [],
    activityType: "",
  };
}

const shortDate = (iso: string) => formatDateUTC(iso, { month: "short", day: "numeric" });

export default function DashboardCharts() {
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const [bases, setBases] = useState<BaseOption[]>([]);
  const [filter, setFilter] = useState<AnalyticsFilterValue>(() => defaultFilter(""));
  const [loading, setLoading] = useState(false);
  const [offeringsTrend, setOfferingsTrend] = useState<OfferingsTrendPoint[]>([]);
  const [offeringsByBase, setOfferingsByBase] = useState<OfferingsByBasePoint[]>([]);
  const [attendance, setAttendance] = useState<AttendancePoint[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary>(EMPTY_SUMMARY);
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);
  const [engagement, setEngagement] = useState<Engagement | null>(null);
  const [dropoff, setDropoff] = useState<Dropoff | null>(null);

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
    const attendanceParams = filterToParams(filter);
    const growthParams = filterToParams(filter, { activityType: false });
    const offeringParams = filterToParams(filter, { groups: false, activityType: false });
    if (isSuperAdmin && !filter.baseId) offeringParams.set("groupByBase", "true");
    const dropoffParams = filterToParams(filter);
    dropoffParams.delete("from");
    dropoffParams.delete("to");
    dropoffParams.set("periodStart", filter.from);
    dropoffParams.set("periodEnd", filter.to);

    const json = (r: Response): Promise<any> => (r.ok ? r.json() : Promise.resolve({}));
    setLoading(true);
    Promise.all([
      fetch(`/api/analytics/offerings?${offeringParams}`).then(json),
      fetch(`/api/analytics/attendance?${attendanceParams}`).then(json),
      fetch(`/api/analytics/growth?${growthParams}`).then(json),
      fetch(`/api/analytics/engagement?${attendanceParams}`).then(json),
      fetch(`/api/analytics/attendance/dropoff?${dropoffParams}`).then(json),
    ])
      .then(([offerings, attendanceRes, growthRes, engagementRes, dropoffRes]) => {
        setOfferingsTrend(offerings.trend ?? []);
        setOfferingsByBase(offerings.byBase ?? []);
        setAttendance(attendanceRes.points ?? []);
        setSummary(attendanceRes.summary ?? EMPTY_SUMMARY);
        setGrowth(growthRes.trend ?? []);
        setEngagement(engagementRes.buckets ? engagementRes : null);
        setDropoff(dropoffRes.droppedOffTeens ? dropoffRes : null);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, isSuperAdmin, filterKey]);

  const groupFiltered = hasGroupFilter(filter);
  const showBaseComparison = isSuperAdmin && !filter.baseId && offeringsByBase.length > 0;
  const baseTotals = Array.from(
    offeringsByBase.reduce((acc, p) => acc.set(p.baseName, (acc.get(p.baseName) ?? 0) + p.total), new Map<string, number>()),
  ).sort((a, b) => a[0].localeCompare(b[0]));

  const recorded = attendance.filter((p) => p.recorded);
  const unrecorded = attendance.length - recorded.length;
  const currentMembers = growth.length ? growth[growth.length - 1].total : null;
  const joinedInPeriod = growth.reduce((s, p) => s + p.added, 0);
  const offeringsTotal = offeringsTrend.reduce((s, p) => s + p.total, 0);
  const otherOfferings = offeringsTrend.map((p) => Math.max(0, p.total - p.cash - p.online));
  const hasOtherOfferings = otherOfferings.some((v) => v > 0);

  const notMarkedTitle = unrecorded > 0 ? `${unrecorded} activit${unrecorded === 1 ? "y has" : "ies have"} no attendance marked yet and ${unrecorded === 1 ? "is" : "are"} left out.` : null;

  return (
    <section className="space-y-6 mt-10" aria-labelledby="dashboard-insights">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="dashboard-insights" className="text-lg font-semibold text-neutral-900">
            Insights
          </h2>
          <p className="text-sm text-neutral-500">Attendance, engagement, growth and giving for the selected period.</p>
        </div>
        {loading && <span className="text-xs text-neutral-400 animate-pulse">Updating…</span>}
      </div>

      <div className="lg:sticky lg:top-16 z-10">
        <AnalyticsFilterBar
          bases={bases}
          isSuperAdmin={isSuperAdmin}
          value={filter}
          onChange={setFilter}
          showGroups
          showActivityType
          userBaseId={user?.baseId}
        />
      </div>

      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <StatTile
          label="Average turnout"
          value={summary.averageRate !== null ? `${summary.averageRate}%` : "—"}
          hint="Share of expected teens who were present, averaged per activity"
        />
        <StatTile label="Avg present" value={summary.average} hint="Teens present per activity" />
        <StatTile label="Teens reached" value={summary.uniqueAttendees} hint={`Different teens who attended at least once (${summary.recordedActivities} activities)`} />
        <StatTile
          label="Members"
          value={currentMembers ?? "—"}
          hint={`On the roster (not Left)${joinedInPeriod ? ` · +${joinedInPeriod} joined this period` : ""}`}
        />
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <ChartCard
          className="lg:col-span-2"
          title="Attendance per activity"
          description="Bars show how many teens were present. The line shows turnout: present ÷ expected, where expected = active teens of that base (or only the platoons/squads the activity is for)."
          footnote={notMarkedTitle}
        >
          <LineTrendChart
            title="Teens present and turnout per activity"
            labels={recorded.map((p) => shortDate(p.date))}
            tooltipTitles={recorded.map((p) => `${p.name} · ${p.type} · ${shortDate(p.date)}`)}
            series={[
              { name: "Teens present", kind: "bar", data: recorded.map((p) => p.attended) },
              { name: "Turnout %", axis: "right", data: recorded.map((p) => p.rate), formatValue: (n) => `${n}%` },
            ]}
            yTitle="Teens present"
            y1Title="Turnout %"
            height={300}
            emptyMessage="No attendance has been marked for this period yet."
          />
        </ChartCard>

        <ChartCard
          title="Engagement"
          description="Active teens grouped by how often they came to activities they were expected at. Regular ≥ 75%, Occasional 25–74%, Rarely under 25%."
        >
          {engagement && engagement.totalActive > 0 ? (
            <DonutChart title="Teens by engagement level" labels={engagement.buckets.map((b) => b.bucket)} data={engagement.buckets.map((b) => b.count)} height={240} />
          ) : (
            <p className="text-sm text-neutral-500">No active teens match these filters.</p>
          )}
        </ChartCard>

        <ChartCard
          className="lg:col-span-2"
          title="Membership growth"
          description="Line: members on the books at the end of each month (teens marked Left aren't counted; graduands count until the month they graduate). Bars: joiners and graduates each month."
        >
          <LineTrendChart
            title="Total members and new joiners by month"
            labels={growth.map((p) => formatMonthLabel(p.month))}
            series={[
              { name: "Total members", data: growth.map((p) => p.total) },
              { name: "Joined that month", kind: "bar", data: growth.map((p) => p.added) },
              ...(growth.some((p) => p.graduated > 0) ? [{ name: "Graduated that month", kind: "bar" as const, data: growth.map((p) => p.graduated) }] : []),
            ]}
            yTitle="Teens"
          />
        </ChartCard>

        <ChartCard
          title="Needs follow-up"
          description={`Teens who have come before but missed their last ${dropoff?.minMissed ?? 3}+ activities in a row (up to the end of the period). Unmarked activities are ignored.`}
          actions={dropoff && dropoff.droppedOffCount > 0 ? <Badge tone="warning">{dropoff.droppedOffCount}</Badge> : undefined}
        >
          {dropoff && dropoff.droppedOffTeens.length ? (
            <ul className="divide-y divide-neutral-100 max-h-64 overflow-y-auto -mx-2">
              {dropoff.droppedOffTeens.map((teen) => (
                <li key={teen.id}>
                  <Link href={`/dashboard/lieutenants/${teen.id}`} className="flex items-center justify-between gap-3 px-2 py-2 rounded-lg hover:bg-neutral-50">
                    <span className="text-sm font-medium text-neutral-900">{teen.name}</span>
                    <span className="text-xs text-neutral-500 whitespace-nowrap">
                      {teen.lastAttended ? `last seen ${shortDate(teen.lastAttended)}` : ""} · missed {teen.missed}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-500">Nobody has dropped off in this period. 🎉</p>
          )}
        </ChartCard>

        <ChartCard
          className={showBaseComparison ? "lg:col-span-2" : "lg:col-span-3"}
          title="Offerings by month"
          description={`Cash and transfer offerings recorded in the app. Total for the period: ${formatMoney(offeringsTotal)}.`}
          actions={groupFiltered ? <Badge tone="neutral">Base-level only</Badge> : undefined}
          footnote={groupFiltered ? "Offerings are recorded per base, not per platoon or squad, so the platoon/squad filters don't apply here." : undefined}
        >
          <StackedBarChart
            title="Offerings by month, cash vs transfer"
            labels={offeringsTrend.map((p) => formatMonthLabel(p.month))}
            series={[
              { name: "Cash", data: offeringsTrend.map((p) => p.cash) },
              { name: "Transfer", data: offeringsTrend.map((p) => p.online) },
              ...(hasOtherOfferings ? [{ name: "Other", data: otherOfferings }] : []),
            ]}
            formatValue={formatMoney}
          />
        </ChartCard>

        {showBaseComparison && (
          <ChartCard title="Offerings by base" description="Total offerings per base for the selected period.">
            <BarComparisonChart
              title="Total offerings by base"
              labels={baseTotals.map(([name]) => name)}
              series={[{ name: "Total", data: baseTotals.map(([, total]) => total) }]}
              formatValue={formatMoney}
              horizontal
            />
          </ChartCard>
        )}
      </div>
    </section>
  );
}
