"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import AnalyticsFilterBar, { AnalyticsFilterValue, BaseOption } from "@/components/analytics/AnalyticsFilterBar";
import LineTrendChart from "@/components/charts/LineTrendChart";
import BarComparisonChart from "@/components/charts/BarComparisonChart";
import { formatMonthLabel } from "@/lib/formatDate";
import { formatMoney } from "@/lib/formatMoney";

type OfferingsTrendPoint = { month: string; cash: number; online: number; total: number };
type OfferingsByBasePoint = { baseId: string; baseName: string; month: string; cash: number; online: number; total: number };
type AttendancePoint = { date: string; attended: number };
type GrowthPoint = { month: string; added: number };

function defaultFilter(baseId: string): AnalyticsFilterValue {
  const now = new Date();
  return {
    baseId,
    from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)).toISOString().slice(0, 10),
    to: now.toISOString().slice(0, 10),
  };
}

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
  const [growth, setGrowth] = useState<GrowthPoint[]>([]);

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

    setLoading(true);
    Promise.all([
      fetch(`/api/analytics/offerings?${params}`).then((r) => r.json()),
      fetch(`/api/analytics/attendance?${params}`).then((r) => r.json()),
      fetch(`/api/analytics/growth?${params}`).then((r) => r.json()),
    ])
      .then(([offerings, attendanceRes, growthRes]) => {
        setOfferingsTrend(offerings.trend ?? []);
        setOfferingsByBase(offerings.byBase ?? []);
        setAttendance((attendanceRes.points ?? []).map((p: { date: string; attended: number }) => ({ date: p.date, attended: p.attended })));
        setGrowth(growthRes.trend ?? []);
      })
      .finally(() => setLoading(false));
  }, [isSuperAdmin, filter.baseId, filter.from, filter.to]);

  const showBaseComparison = isSuperAdmin && !filter.baseId && offeringsByBase.length > 0;
  const baseNames = Array.from(new Set(offeringsByBase.map((p) => p.baseName))).sort();
  const baseComparisonMonths = Array.from(new Set(offeringsByBase.map((p) => p.month))).sort();

  return (
    <div className="space-y-6 mt-6">
      <AnalyticsFilterBar bases={bases} isSuperAdmin={isSuperAdmin} value={filter} onChange={setFilter} />

      {loading && <p className="text-sm text-gray-500">Loading charts...</p>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border rounded p-6 shadow-sm">
          <h3 className="font-semibold mb-3">Offerings Trend</h3>
          <LineTrendChart
            title="Offerings trend, cash vs transfer, by month"
            labels={offeringsTrend.map((p) => formatMonthLabel(p.month))}
            series={[
              { name: "Cash", data: offeringsTrend.map((p) => p.cash) },
              { name: "Transfer", data: offeringsTrend.map((p) => p.online) },
            ]}
            formatValue={formatMoney}
          />
        </div>

        <div className="bg-white border rounded p-6 shadow-sm">
          <h3 className="font-semibold mb-3">Attendance Trend</h3>
          <LineTrendChart
            title="Attendance per activity"
            labels={attendance.map((p) => new Date(p.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }))}
            series={[{ name: "Attended", data: attendance.map((p) => p.attended) }]}
          />
        </div>

        <div className="bg-white border rounded p-6 shadow-sm">
          <h3 className="font-semibold mb-3">Membership Growth</h3>
          <LineTrendChart
            title="Teens added per month"
            labels={growth.map((p) => formatMonthLabel(p.month))}
            series={[{ name: "Added", data: growth.map((p) => p.added) }]}
          />
        </div>

        {showBaseComparison && (
          <div className="bg-white border rounded p-6 shadow-sm">
            <h3 className="font-semibold mb-3">Base Comparison (Offerings)</h3>
            <BarComparisonChart
              title="Total offerings by base, by month"
              labels={baseComparisonMonths.map(formatMonthLabel)}
              series={baseNames.map((baseName) => ({
                name: baseName,
                data: baseComparisonMonths.map(
                  (month) => offeringsByBase.find((p) => p.baseName === baseName && p.month === month)?.total ?? 0,
                ),
              }))}
              formatValue={formatMoney}
            />
          </div>
        )}
      </div>
    </div>
  );
}
