"use client";

import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { registerChartJs, useChartColors, commonTooltipOptions, baseChartOptions, seriesFill } from "./chartTheme";
import ChartLegend from "./ChartLegend";
import ChartFrame from "./ChartFrame";

registerChartJs();

export type ChartSeries = { name: string; data: number[] };

export default function LineTrendChart({
  title,
  labels,
  series,
  formatValue,
  height = 280,
}: {
  title: string;
  labels: string[];
  series: ChartSeries[];
  formatValue?: (n: number) => string;
  height?: number;
}) {
  const colors = useChartColors();

  const data = useMemo(
    () => ({
      labels,
      datasets: series.map((s, i) => ({
        label: s.name,
        data: s.data,
        borderColor: colors.series[i % colors.series.length],
        backgroundColor: seriesFill(colors.series[i % colors.series.length]),
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5,
        pointBackgroundColor: colors.series[i % colors.series.length],
        pointBorderColor: colors.surface,
        pointBorderWidth: 2,
        fill: series.length === 1,
        tension: 0.25,
      })),
    }),
    [labels, series, colors],
  );

  const options = useMemo(
    () => ({
      ...baseChartOptions(colors),
      plugins: {
        legend: { display: false },
        tooltip: commonTooltipOptions(colors, formatValue),
      },
    }),
    [colors, formatValue],
  );

  return (
    <div>
      <ChartLegend series={series} colors={colors.series} />
      <ChartFrame title={title} height={height}>
        <Line data={data} options={options} aria-hidden="true" />
      </ChartFrame>
    </div>
  );
}
