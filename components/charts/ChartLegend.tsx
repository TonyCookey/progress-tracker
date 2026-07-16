"use client";

// A legend is always present for 2+ series (never for a single series - the chart's
// own title already names it). Custom HTML rather than chart.js's built-in legend so
// labels render as text, not canvas, and stay reachable by assistive tech.
export default function ChartLegend({ series, colors }: { series: { name: string }[]; colors: string[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-4 mb-2 text-sm text-neutral-600">
      {series.map((s, i) => (
        <li key={s.name} className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: colors[i % colors.length] }} />
          {s.name}
        </li>
      ))}
    </ul>
  );
}
