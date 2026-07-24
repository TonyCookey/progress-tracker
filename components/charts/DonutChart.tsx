"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { registerChartJs, useChartColors, commonTooltipOptions } from "./chartTheme";
import ChartLegend from "./ChartLegend";
import ChartFrame from "./ChartFrame";

registerChartJs();

export default function DonutChart({
  title,
  labels,
  data,
  formatValue,
  height = 220,
}: {
  title: string;
  labels: string[];
  data: number[];
  formatValue?: (n: number) => string;
  height?: number;
}) {
  const colors = useChartColors();

  const chartData = useMemo(
    () => ({
      labels,
      datasets: [
        {
          data,
          backgroundColor: labels.map((_, i) => colors.series[i % colors.series.length]),
          borderColor: colors.surface,
          borderWidth: 2,
        },
      ],
    }),
    [labels, data, colors],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: commonTooltipOptions(colors, formatValue),
      },
    }),
    [colors, formatValue],
  );

  return (
    <div>
      <ChartLegend series={labels.map((name) => ({ name }))} colors={colors.series} />
      <ChartFrame title={title} height={height}>
        <Doughnut data={chartData} options={options} aria-hidden="true" />
      </ChartFrame>
    </div>
  );
}
