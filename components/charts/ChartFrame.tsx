"use client";

import { ReactNode } from "react";

// Fixed-height wrapper every chart canvas sits in, with the accessible name a <canvas>
// can't otherwise carry (chart.js renders to a bitmap, invisible to screen readers).
export default function ChartFrame({ title, height = 280, children }: { title: string; height?: number; children: ReactNode }) {
  return (
    <div role="img" aria-label={title} style={{ position: "relative", height }}>
      {children}
    </div>
  );
}
