"use client";

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { registerChartJs, useChartColors, commonTooltipOptions, baseChartOptions, getSeriesColor } from "./chartTheme";
import ChartLegend from "./ChartLegend";
import ChartFrame from "./ChartFrame";
import type { ChartSeries } from "./LineTrendChart";

registerChartJs();

export default function StackedBarChart({
  title,
  labels,
  series,
  formatValue,
  height = 280,
  colorPalette = "default",
}: {
  title: string;
  labels: string[];
  series: ChartSeries[];
  formatValue?: (n: number) => string;
  height?: number;
  colorPalette?: "default" | "demographic";
}) {
  const colors = useChartColors();

  const data = useMemo(
    () => ({
      labels,
      datasets: series.map((s, i) => ({
        label: s.name,
        data: s.data,
        backgroundColor: getSeriesColor(colors, i, series.length, colorPalette),
        maxBarThickness: 24,
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      })),
    }),
    [labels, series, colors, colorPalette],
  );

  const options = useMemo(
    () => ({
      ...baseChartOptions(colors),
      scales: {
        x: { ...baseChartOptions(colors).scales.x, stacked: true },
        y: { ...baseChartOptions(colors).scales.y, stacked: true },
      },
      plugins: {
        legend: { display: false },
        tooltip: commonTooltipOptions(colors, formatValue),
      },
    }),
    [colors, formatValue],
  );

  return (
    <div>
      <ChartLegend
        series={series}
        colors={series.length === 2 ? (colorPalette === "demographic" ? colors.demographicSeries : colors.twoSeries) : colors.series}
      />
      <ChartFrame title={title} height={height}>
        <Bar data={data} options={options} aria-hidden="true" />
      </ChartFrame>
    </div>
  );
}
