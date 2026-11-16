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
// `kind: "bar"` draws that series as bars inside the same chart (a combo chart, e.g.
// "teens present" bars with a "turnout %" line on the right axis).
export type ChartSeries = {
  name: string;
  data: (number | null)[];
  axis?: "left" | "right";
  kind?: "line" | "bar";
  formatValue?: (n: number) => string;
};

export default function LineTrendChart({
  title,
  labels,
  series,
  formatValue,
  height = 280,
  colorPalette = "default",
  yTitle,
  y1Title,
  tooltipTitles,
  emptyMessage = "No data for this period yet.",
}: {
  title: string;
  labels: string[];
  series: ChartSeries[];
  formatValue?: (n: number) => string;
  height?: number;
  colorPalette?: "default" | "demographic";
  /** Axis captions so a dual-axis chart says what each scale measures. */
  yTitle?: string;
  y1Title?: string;
  /** Per-point tooltip heading (e.g. the activity name) instead of the x label. */
  tooltipTitles?: string[];
  emptyMessage?: string;
}) {
  const colors = useChartColors();
  const hasRightAxis = series.some((s) => s.axis === "right");

  const data = useMemo(
    () => ({
      labels,
      datasets: series.map((s, i) => {
        const seriesColor = getSeriesColor(colors, i, series.length, colorPalette);

        if (s.kind === "bar") {
          return {
            type: "bar" as const,
            label: s.name,
            data: s.data,
            yAxisID: s.axis === "right" ? "y1" : "y",
            backgroundColor: `${seriesColor}cc`,
            borderRadius: 4,
            maxBarThickness: 28,
            order: 2,
          };
        }

        return {
          type: "line" as const,
          order: 1,
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
        y: {
          ...base.scales.y,
          ticks: { ...base.scales.y.ticks, precision: 0 },
          title: yTitle ? { display: true, text: yTitle, color: colors.axisText, font: { size: 11 } } : undefined,
        },
        ...(hasRightAxis
          ? {
            y1: {
              position: "right" as const,
              beginAtZero: true,
              grid: { display: false },
              ticks: { color: colors.axisText },
              title: y1Title ? { display: true, text: y1Title, color: colors.axisText, font: { size: 11 } } : undefined,
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
            title: (items: { dataIndex: number; label: string }[]) =>
              items.length ? (tooltipTitles?.[items[0].dataIndex] ?? items[0].label) : "",
            label: (ctx: { datasetIndex: number; dataset: { label?: string }; parsed: { y?: number } | number }) => {
              const value = typeof ctx.parsed === "number" ? ctx.parsed : (ctx.parsed.y ?? 0);
              const seriesFormat = series[ctx.datasetIndex]?.formatValue ?? formatValue ?? ((n: number) => n.toLocaleString());
              return `${ctx.dataset.label ?? ""}: ${seriesFormat(value)}`;
            },
          },
        },
      },
    };
  }, [colors, formatValue, series, hasRightAxis, yTitle, y1Title, tooltipTitles]);

  const isEmpty = !labels.length || series.every((s) => s.data.every((v) => v === null || v === 0));

  return (
    <div>
      <ChartLegend
        series={series}
        colors={series.length === 2 ? (colorPalette === "demographic" ? colors.demographicSeries : colors.twoSeries) : colors.series}
      />
      <ChartFrame title={title} height={height}>
        {isEmpty ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-50 text-sm text-neutral-500">{emptyMessage}</div>
        ) : (
          <Line data={data as any} options={options} aria-hidden="true" />
        )}
      </ChartFrame>
    </div>
  );
}
