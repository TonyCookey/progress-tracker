"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AnalyticsFilterBar, { AnalyticsFilterValue, BaseOption } from "@/components/analytics/AnalyticsFilterBar";
import LineTrendChart from "@/components/charts/LineTrendChart";
import BarComparisonChart from "@/components/charts/BarComparisonChart";
import StatTile from "@/components/charts/StatTile";
import { formatMonthLabel } from "@/lib/formatDate";
import Card from "@/components/ui/Card";

type Funnel = {
  trend: { month: string; count: number }[];
  total: number;
  followedUp: number;
  becameTeen: number;
  followUpRate: number | null;
  conversionRate: number | null;
};

function defaultFilter(baseId: string): AnalyticsFilterValue {
  const now = new Date();
  return {
    baseId,
    from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

export default function NewConvertsFunnelChart() {
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const [bases, setBases] = useState<BaseOption[]>([]);
  const [filter, setFilter] = useState<AnalyticsFilterValue>(() => defaultFilter(""));
  const [funnel, setFunnel] = useState<Funnel | null>(null);
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

    setLoading(true);
    fetch(`/api/analytics/new-converts?${params}`)
      .then((r) => r.json())
      .then(setFunnel)
      .finally(() => setLoading(false));
  }, [isSuperAdmin, filter.baseId, filter.from, filter.to]);

  return (
    <div className="space-y-6 mb-8">
      <AnalyticsFilterBar bases={bases} isSuperAdmin={isSuperAdmin} value={filter} onChange={setFilter} />

      {loading && <p className="text-sm text-neutral-500">Loading charts...</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatTile label="New converts" value={funnel?.total ?? 0} />
        <StatTile label="Followed up" value={funnel?.followedUp ?? 0} />
        <StatTile label="Became teen" value={funnel?.becameTeen ?? 0} />
        <StatTile label="Conversion rate" value={funnel?.conversionRate !== null && funnel?.conversionRate !== undefined ? `${funnel.conversionRate}%` : "N/A"} />
      </div>

      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Converts per Month</h3>
        <LineTrendChart
          title="New converts per month"
          labels={(funnel?.trend ?? []).map((p) => formatMonthLabel(p.month))}
          series={[{ name: "New converts", data: (funnel?.trend ?? []).map((p) => p.count) }]}
        />
      </Card>

      <Card>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-3">Funnel</h3>
        <BarComparisonChart
          title="Total, followed up, became teen"
          labels={["Total", "Followed Up", "Became Teen"]}
          series={[{ name: "Converts", data: [funnel?.total ?? 0, funnel?.followedUp ?? 0, funnel?.becameTeen ?? 0] }]}
          horizontal
        />
      </Card>
    </div>
  );
}
