"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

let registered = false;

// Called once per chart component module load; chart.js dedupes re-registration
// but centralizing avoids drift between chart components on which elements they need.
export function registerChartJs() {
  if (registered) return;
  ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler);
  registered = true;
}

export type ChartColors = {
  series: string[];
  twoSeries: string[];
  grid: string;
  axisText: string;
  tooltipBg: string;
  tooltipText: string;
  tooltipBorder: string;
  surface: string;
};

// Fixed-order 8-hue categorical palette from the dataviz skill's reference palette.
// Never reassign by index dynamically - series identity must map to a known label
// (e.g. "Cash" is always slot 1), not array position from the API response.
const LIGHT: ChartColors = {
  series: ["#4a8f43", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"],
  twoSeries: ["#2563eb", "#ef4444"],
  grid: "#e1e0d9",
  axisText: "#898781",
  tooltipBg: "#fcfcfb",
  tooltipText: "#0b0b0b",
  tooltipBorder: "rgba(11,11,11,0.10)",
  surface: "#fcfcfb",
};

const DARK: ChartColors = {
  series: ["#6fae66", "#199e70", "#c98500", "#008300", "#9085e9", "#e66767", "#d55181", "#d95926"],
  twoSeries: ["#60a5fa", "#f87171"],
  grid: "#2c2c2a",
  axisText: "#898781",
  tooltipBg: "#1a1a19",
  tooltipText: "#ffffff",
  tooltipBorder: "rgba(255,255,255,0.10)",
  surface: "#1a1a19",
};

export function getSeriesColor(colors: ChartColors, index: number, totalSeries: number) {
  if (totalSeries === 2) {
    return colors.twoSeries[index % colors.twoSeries.length];
  }

  return colors.series[index % colors.series.length];
}

export function useChartColors(): ChartColors {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    setIsDark(mq.matches);
    const listener = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, []);

  return isDark ? DARK : LIGHT;
}

// A wash - never a saturated block - for area fills under a line.
export function seriesFill(hex: string) {
  const alpha = "1a"; // ~10% opacity
  return `${hex}${alpha}`;
}

export function commonTooltipOptions(colors: ChartColors, formatValue: (n: number) => string = (n) => n.toLocaleString()) {
  return {
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
      label: (ctx: { dataset: { label?: string }; parsed: { y?: number } | number }) => {
        const value = typeof ctx.parsed === "number" ? ctx.parsed : (ctx.parsed.y ?? 0);
        return `${ctx.dataset.label ?? ""}: ${formatValue(value)}`;
      },
    },
  };
}

export function baseChartOptions(colors: ChartColors) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index" as const, intersect: false },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: colors.axisText },
      },
      y: {
        beginAtZero: true,
        grid: { color: colors.grid, drawTicks: false },
        ticks: { color: colors.axisText },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };
}
