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
import Card from "@/components/ui/Card";

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
  const baseMonths = Array.from(new Set(byBase.map((p) => p.month))).sort();

  const latestPerAttendee = perAttendee.length ? perAttendee[perAttendee.length - 1] : null;

  return (
    <div className="space-y-6">
      <AnalyticsFilterBar bases={bases} isSuperAdmin={isSuperAdmin} value={filter} onChange={setFilter} />

      {loading && <p className="text-sm text-neutral-500">Loading charts...</p>}

      {monthOverMonth && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            label="Month-over-month change"
            value={`${monthOverMonth.value >= 0 ? "+" : ""}${monthOverMonth.value.toFixed(1)}%`}
            delta={{ value: monthOverMonth.value, direction: monthOverMonth.direction }}
          />
          <StatTile label="This month's total" value={formatMoney(trend[trend.length - 1]?.total ?? 0)} />
          <StatTile label="Last month's total" value={formatMoney(trend[trend.length - 2]?.total ?? 0)} />
        </div>
      )}

      {latestPerAttendee && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatTile
            label={`Offering per attendee (${formatMonthLabel(latestPerAttendee.month)})`}
            value={latestPerAttendee.perAttendee !== null ? formatMoney(latestPerAttendee.perAttendee) : "N/A"}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Monthly Totals</h3>
          <LineTrendChart
            title="Offerings monthly totals, cash vs transfer"
            labels={trend.map((p) => formatMonthLabel(p.month))}
            series={[
              { name: "Cash", data: trend.map((p) => p.cash) },
              { name: "Transfer", data: trend.map((p) => p.online) },
            ]}
            formatValue={formatMoney}
          />
        </Card>

        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Cash vs Transfer Split</h3>
          <StackedBarChart
            title="Offerings split, cash vs transfer, by month"
            labels={trend.map((p) => formatMonthLabel(p.month))}
            series={[
              { name: "Cash", data: trend.map((p) => p.cash) },
              { name: "Transfer", data: trend.map((p) => p.online) },
            ]}
            formatValue={formatMoney}
          />
        </Card>

        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">By Service</h3>
          <BarComparisonChart
            title="Offerings total by service"
            labels={byService.map((p) => p.service)}
            series={[{ name: "Total", data: byService.map((p) => p.total) }]}
            formatValue={formatMoney}
            horizontal
          />
        </Card>

        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">By Type</h3>
          <DonutChart
            title="Offerings total by type"
            labels={byType.map((p) => p.type)}
            data={byType.map((p) => p.total)}
            formatValue={formatMoney}
          />
        </Card>

        <Card>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Offering per Attendee</h3>
          <LineTrendChart
            title="Offering per Sunday attendee, by month"
            labels={perAttendee.map((p) => formatMonthLabel(p.month))}
            series={[{ name: "Per attendee", data: perAttendee.map((p) => p.perAttendee) }]}
            formatValue={formatMoney}
          />
        </Card>

        {showBaseComparison && (
          <Card>
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Base Comparison</h3>
            <BarComparisonChart
              title="Total offerings by base, by month"
              labels={baseMonths.map(formatMonthLabel)}
              series={baseNames.map((baseName) => ({
                name: baseName,
                data: baseMonths.map((month) => byBase.find((p) => p.baseName === baseName && p.month === month)?.total ?? 0),
              }))}
              formatValue={formatMoney}
            />
          </Card>
        )}
      </div>
    </div>
  );
}
