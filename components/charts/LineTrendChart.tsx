"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { registerChartJs, useChartColors, baseChartOptions, seriesFill, getSeriesColor } from "./chartTheme";
import ChartLegend from "./ChartLegend";
import ChartFrame from "./ChartFrame";

registerChartJs();

// `axis: "right"` puts a series on a secondary y-scale (e.g. a % rate alongside a
// raw count) - each series may carry its own formatValue since the two axes mean
// different things and a single global formatter can't express both.
export type ChartSeries = { name: string; data: (number | null)[]; axis?: "left" | "right"; formatValue?: (n: number) => string };

export default function LineTrendChart({
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
  const hasRightAxis = series.some((s) => s.axis === "right");

  const data = useMemo(
    () => ({
      labels,
      datasets: series.map((s, i) => {
        const seriesColor = getSeriesColor(colors, i, series.length, colorPalette);

        return {
          label: s.name,
          data: s.data,
          yAxisID: s.axis === "right" ? "y1" : "y",
          borderColor: seriesColor,
          backgroundColor: seriesFill(seriesColor),
          borderWidth: 2,
          pointRadius: 4,
          pointHoverRadius: 5,
          pointBackgroundColor: seriesColor,
          pointBorderColor: colors.surface,
          pointBorderWidth: 2,
          fill: series.length === 1,
          tension: 0.25,
          spanGaps: true,
        };
      }),
    }),
    [labels, series, colors, colorPalette],
  );

  const options = useMemo(() => {
    const base = baseChartOptions(colors);
    return {
      ...base,
      scales: {
        ...base.scales,
        ...(hasRightAxis
          ? {
            y1: {
              position: "right" as const,
              beginAtZero: true,
              grid: { display: false },
              ticks: { color: colors.axisText },
            },
          }
          : {}),
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          mode: "index" as const,
          intersect: false,
          backgroundColor: colors.tooltipBg,
          titleColor: colors.tooltipText,
          bodyColor: colors.tooltipText,
          borderColor: colors.tooltipBorder,
          borderWidth: 1,
          padding: 10,
          callbacks: {
            label: (ctx: { datasetIndex: number; dataset: { label?: string }; parsed: { y?: number } | number }) => {
              const value = typeof ctx.parsed === "number" ? ctx.parsed : (ctx.parsed.y ?? 0);
              const seriesFormat = series[ctx.datasetIndex]?.formatValue ?? formatValue ?? ((n: number) => n.toLocaleString());
              return `${ctx.dataset.label ?? ""}: ${seriesFormat(value)}`;
            },
          },
        },
      },
    };
  }, [colors, formatValue, series, hasRightAxis]);

  return (
    <div>
      <ChartLegend
        series={series}
        colors={series.length === 2 ? (colorPalette === "demographic" ? colors.demographicSeries : colors.twoSeries) : colors.series}
      />
      <ChartFrame title={title} height={height}>
        <Line data={data} options={options} aria-hidden="true" />
      </ChartFrame>
    </div>
  );
}
