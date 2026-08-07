"use client";

import { ReactNode, useState } from "react";
import BasesPanel from "./BasesPanel";
import UsersSettingsTable from "./UsersSettingsTable";
import RefDataPanel from "./RefDataPanel";
import ReportTemplatePanel from "./ReportTemplatePanel";
import SegmentedToggle from "@/components/ui/SegmentedToggle";

type TabValue = "bases" | "users" | "refdata" | "reportTemplate";

const tabs: { label: string; value: TabValue; panel: ReactNode }[] = [
  { label: "Bases", value: "bases", panel: <BasesPanel /> },
  { label: "Users", value: "users", panel: <UsersSettingsTable /> },
  { label: "Reference Data", value: "refdata", panel: <RefDataPanel /> },
  { label: "Report Template", value: "reportTemplate", panel: <ReportTemplatePanel /> },
];

export default function SettingsTabs() {
  const [activeTab, setActiveTab] = useState<TabValue>("bases");

  return (
    <div className="space-y-6">
      <SegmentedToggle options={tabs.map(({ label, value }) => ({ label, value }))} value={activeTab} onChange={setActiveTab} />
      {tabs.find((tab) => tab.value === activeTab)?.panel}
    </div>
  );
}
