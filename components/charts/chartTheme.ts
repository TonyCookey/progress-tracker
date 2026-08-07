"use client";

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
  demographicSeries: string[];
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
//
// The app has no dark mode (every surface is hardcoded `bg-white`, no `dark:` classes,
// no theme toggle) - there is only one palette. Do not reintroduce OS-driven color
// switching here without adding real dark-mode support everywhere else first; it
// previously caused charts to silently switch to a dark palette (including a
// near-black border) while sitting on a white card.
const COLORS: ChartColors = {
  series: ["#4a8f43", "#1baf7a", "#eda100", "#008300", "#4a3aa7", "#e34948", "#e87ba4", "#eb6834"],
  // Generic two-series comparisons (cash vs transfer, new vs returning, count vs rate) -
  // never gender. Blue + amber: distinct from the green-heavy `series` palette above,
  // distinct from the pink/blue `demographicSeries`, and carries no red "negative" or
  // green "positive" connotation since these pairs are neutral comparisons.
  twoSeries: ["#2563eb", "#d97706"],
  // Gender split specifically - blue/pink is the expected convention, not a
  // positive/negative signal.
  demographicSeries: ["#2563eb", "#ec4899"],
  grid: "#e1e0d9",
  axisText: "#898781",
  tooltipBg: "#fcfcfb",
  tooltipText: "#0b0b0b",
  tooltipBorder: "rgba(11,11,11,0.10)",
  surface: "#fcfcfb",
};

export function getSeriesColor(colors: ChartColors, index: number, totalSeries: number, palette: "default" | "demographic" = "default") {
  if (totalSeries === 2) {
    if (palette === "demographic") {
      return colors.demographicSeries[index % colors.demographicSeries.length];
    }
    return colors.twoSeries[index % colors.twoSeries.length];
  }

  return colors.series[index % colors.series.length];
}

export function useChartColors(): ChartColors {
  return COLORS;
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
