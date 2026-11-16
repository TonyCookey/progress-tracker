"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import AnalyticsFilterBar, { AnalyticsFilterValue, BaseOption } from "@/components/analytics/AnalyticsFilterBar";
import LineTrendChart from "@/components/charts/LineTrendChart";
import StackedBarChart from "@/components/charts/StackedBarChart";
import BarComparisonChart from "@/components/charts/BarComparisonChart";
import DonutChart from "@/components/charts/DonutChart";
import StatTile from "@/components/charts/StatTile";
import { formatMonthLabel } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatMoney";
import ChartCard from "@/components/charts/ChartCard";

type TrendPoint = { month: string; cash: number; online: number; total: number };
type ByBasePoint = { baseId: string; baseName: string; month: string; cash: number; online: number; total: number };
type ByServicePoint = { service: string; cash: number; online: number; total: number };
type ByTypePoint = { type: string; total: number };
type PerAttendeePoint = { month: string; total: number; sundayAttendance: number; perAttendee: number | null };

function defaultFilter(baseId: string): AnalyticsFilterValue {
  const now = new Date();
  return {
    baseId,
    from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default function OfferingsAnalytics() {
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const [bases, setBases] = useState<BaseOption[]>([]);
  const [filter, setFilter] = useState<AnalyticsFilterValue>(() => defaultFilter(""));
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [byBase, setByBase] = useState<ByBasePoint[]>([]);
  const [byService, setByService] = useState<ByServicePoint[]>([]);
  const [byType, setByType] = useState<ByTypePoint[]>([]);
  const [perAttendee, setPerAttendee] = useState<PerAttendeePoint[]>([]);
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
    const groupByBase = isSuperAdmin && !filter.baseId;
    if (groupByBase) params.set("groupByBase", "true");

    const serviceParams = new URLSearchParams(params);
    serviceParams.set("by", "service");
    const typeParams = new URLSearchParams(params);
    typeParams.set("by", "type");
    const perAttendeeParams = new URLSearchParams(params);
    perAttendeeParams.set("by", "perAttendee");

    setLoading(true);
    Promise.all([
      fetch(`/api/analytics/offerings?${params}`).then((r) => r.json()),
      fetch(`/api/analytics/offerings?${serviceParams}`).then((r) => r.json()),
      fetch(`/api/analytics/offerings?${typeParams}`).then((r) => r.json()),
      fetch(`/api/analytics/offerings?${perAttendeeParams}`).then((r) => r.json()),
    ])
      .then(([monthly, service, type, perAttendeeRes]) => {
        setTrend(monthly.trend ?? []);
        setByBase(monthly.byBase ?? []);
        setByService(service.byService ?? []);
        setByType(type.byType ?? []);
        setPerAttendee(perAttendeeRes.perAttendee ?? []);
      })
      .finally(() => setLoading(false));
  }, [isSuperAdmin, filter.baseId, filter.from, filter.to]);

  const monthOverMonth = useMemo(() => {
    if (trend.length < 2) return null;
    const last = trend[trend.length - 1];
    const prev = trend[trend.length - 2];
    if (!prev.total) return null;
    const change = ((last.total - prev.total) / prev.total) * 100;
    return { value: change, direction: (change >= 0 ? "up" : "down") as "up" | "down" };
  }, [trend]);

  const showBaseComparison = isSuperAdmin && !filter.baseId && byBase.length > 0;
  const baseNames = Array.from(new Set(byBase.map((p) => p.baseName))).sort();

  const latestPerAttendee = perAttendee.length ? perAttendee[perAttendee.length - 1] : null;

  const periodTotal = trend.reduce((sum, p) => sum + p.total, 0);
  const last = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  const otherByMonth = trend.map((p) => Math.max(0, p.total - p.cash - p.online));
  const hasOther = otherByMonth.some((v) => v > 0);
  const baseTotals = baseNames.map((name) => byBase.filter((p) => p.baseName === name).reduce((sum, p) => sum + p.total, 0));

  return (
    <div className="space-y-6">
      <AnalyticsFilterBar bases={bases} isSuperAdmin={isSuperAdmin} value={filter} onChange={setFilter} />

      <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <StatTile label="Total for period" value={formatMoney(periodTotal)} hint={`${trend.length} month${trend.length === 1 ? "" : "s"}`} />
        {last && <StatTile label={formatMonthLabel(last.month)} value={formatMoney(last.total)} hint="Latest month in range" />}
        {monthOverMonth && prev ? (
          <StatTile
            label="Change vs previous month"
            value={`${monthOverMonth.value >= 0 ? "+" : ""}${monthOverMonth.value.toFixed(1)}%`}
            delta={{ value: monthOverMonth.value, direction: monthOverMonth.direction }}
            hint={`Compared with ${formatMonthLabel(prev.month)} (${formatMoney(prev.total)})`}
          />
        ) : (
          <StatTile label="Change vs previous month" value="—" hint="Needs two months with offerings" />
        )}
        <StatTile
          label="Per Sunday attendee"
          value={latestPerAttendee?.perAttendee != null ? formatMoney(latestPerAttendee.perAttendee) : "—"}
          hint={latestPerAttendee ? `${formatMonthLabel(latestPerAttendee.month)}: offerings ÷ teens present at Sunday Services` : undefined}
        />
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 transition-opacity ${loading ? "opacity-60" : ""}`}>
        <ChartCard className="lg:col-span-2" title="Offerings by month" description="Each bar is one month's offerings, split by how they were given.">
          <StackedBarChart
            title="Offerings by month, cash vs transfer"
            labels={trend.map((p) => formatMonthLabel(p.month))}
            series={[
              { name: "Cash", data: trend.map((p) => p.cash) },
              { name: "Transfer", data: trend.map((p) => p.online) },
              ...(hasOther ? [{ name: "Other", data: otherByMonth }] : []),
            ]}
            formatValue={formatMoney}
          />
        </ChartCard>

        <ChartCard title="By service" description="Which services bring in the most. Top 8 shown; the rest are grouped as Other.">
          <BarComparisonChart
            title="Offerings total by service"
            labels={byService.map((p) => p.service)}
            series={[{ name: "Total", data: byService.map((p) => p.total) }]}
            formatValue={formatMoney}
            horizontal
          />
        </ChartCard>

        <ChartCard title="By type" description="Share of the period's total by payment type.">
          <DonutChart
            title="Offerings total by type"
            labels={byType.map((p) => (p.type === "Online" ? "Transfer" : p.type))}
            data={byType.map((p) => p.total)}
            formatValue={formatMoney}
          />
        </ChartCard>

        <ChartCard
          title="Offering per Sunday attendee"
          description="Each month's total offerings divided by the number of teens present at that month's Sunday Services. Gaps mean no Sunday attendance was recorded."
        >
          <LineTrendChart
            title="Offering per Sunday attendee, by month"
            labels={perAttendee.map((p) => formatMonthLabel(p.month))}
            series={[{ name: "Per attendee", data: perAttendee.map((p) => p.perAttendee) }]}
            formatValue={formatMoney}
          />
        </ChartCard>

        {showBaseComparison && (
          <ChartCard title="By base" description="Total offerings per base for the selected period.">
            <BarComparisonChart
              title="Total offerings by base"
              labels={baseNames}
              series={[{ name: "Total", data: baseTotals }]}
              formatValue={formatMoney}
              horizontal
            />
          </ChartCard>
        )}
      </div>
    </div>
  );
}
