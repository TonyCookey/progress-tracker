"use client";

import BarComparisonChart from "./BarComparisonChart";

// Teen count per platoon/squad is a single-entity magnitude comparison, not identity -
// one sequential-blue series, horizontal so long group names stay readable.
export default function GroupBreakdownChart({
  title,
  labels,
  data,
  height,
}: {
  title: string;
  labels: string[];
  data: number[];
  height?: number;
}) {
  return (
    <BarComparisonChart title={title} labels={labels} series={[{ name: "Teens", data }]} height={height} horizontal />
  );
}
