"use client";

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import { registerChartJs, useChartColors, commonTooltipOptions, baseChartOptions, getSeriesColor, compactTick } from "./chartTheme";
import ChartLegend from "./ChartLegend";
import ChartFrame from "./ChartFrame";
import type { ChartSeries } from "./LineTrendChart";

registerChartJs();

export default function BarComparisonChart({
  title,
  labels,
  series,
  formatValue,
  height = 280,
  horizontal = false,
  colorPalette = "default",
}: {
  title: string;
  labels: string[];
  series: ChartSeries[];
  formatValue?: (n: number) => string;
  height?: number;
  horizontal?: boolean;
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
        borderRadius: 4,
        borderSkipped: horizontal ? ("left" as const) : ("bottom" as const),
        maxBarThickness: 24,
        categoryPercentage: 0.7,
        barPercentage: 0.9,
      })),
    }),
    [labels, series, colors, horizontal, colorPalette],
  );

  const options = useMemo(
    () => ({
      ...baseChartOptions(colors),
      ...(horizontal
        ? {
            // Horizontal: the value axis is x, the category axis is y - swap tick handling.
            scales: {
              x: { beginAtZero: true, grid: { color: colors.grid, drawTicks: false }, ticks: { color: colors.axisText, callback: compactTick, maxTicksLimit: 5 } },
              y: { grid: { display: false }, ticks: { color: colors.axisText } },
            },
          }
        : {}),
      indexAxis: horizontal ? ("y" as const) : ("x" as const),
      plugins: {
        legend: { display: false },
        tooltip: commonTooltipOptions(colors, formatValue),
      },
    }),
    [colors, formatValue, horizontal],
  );

  return (
    <div>
      <ChartLegend
        series={series}
        colors={series.length === 2 ? (colorPalette === "demographic" ? colors.demographicSeries : colors.twoSeries) : colors.series}
      />
      <ChartFrame title={title} height={height}>
        {!labels.length || series.every((s) => s.data.every((v) => v === null || v === 0)) ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-50 text-sm text-neutral-500">No data for this period yet.</div>
        ) : (
          <Bar data={data} options={options} aria-hidden="true" />
        )}
      </ChartFrame>
    </div>
  );
}
