"use client";

import { useState } from "react";
import SegmentedToggle from "@/components/ui/SegmentedToggle";
import MonthlyReportBuilder, { ReportSelection } from "@/components/reports/MonthlyReportBuilder";
import ReportHistory from "@/components/reports/ReportHistory";
import ReportsAnalyticsOverview from "@/components/reports/ReportsAnalyticsOverview";

type Tab = "builder" | "history" | "analytics";

export default function ReportsWorkspace({ canBuild }: { canBuild: boolean }) {
  const [tab, setTab] = useState<Tab>(canBuild ? "builder" : "analytics");
  const [selection, setSelection] = useState<ReportSelection | undefined>();
  const [refreshKey, setRefreshKey] = useState(0);

  const options: { label: string; value: Tab }[] = canBuild
    ? [
        { label: "Monthly report", value: "builder" },
        { label: "Past reports", value: "history" },
        { label: "Analytics", value: "analytics" },
      ]
    : [{ label: "Analytics", value: "analytics" }];

  return (
    <div className="space-y-6">
      {options.length > 1 && <SegmentedToggle options={options} value={tab} onChange={setTab} />}

      {tab === "builder" && canBuild && (
        <MonthlyReportBuilder
          key={selection ? `${selection.baseId}-${selection.month}-${selection.year}` : "new"}
          initial={selection}
          onSaved={() => setRefreshKey((k) => k + 1)}
        />
      )}
      {tab === "history" && canBuild && (
        <ReportHistory
          refreshKey={refreshKey}
          onOpen={(s) => {
            setSelection(s);
            setTab("builder");
          }}
        />
      )}
      {tab === "analytics" && <ReportsAnalyticsOverview />}
    </div>
  );
}
