"use client";

import { useState } from "react";
import GeneralBirthdaysTable from "./GeneralBirthdaysTable";
import TeenBirthdaysTable from "./TeenBirthdaysTable";
import GeneralAnniversariesTable from "./GeneralAnniversariesTable";
import SegmentedToggle from "@/components/ui/SegmentedToggle";

type Tab = "generals" | "teens" | "anniversaries";

export default function BirthdayTabs({ generals, teens, anniversaries }: { generals: any[]; teens: any[]; anniversaries: any[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("generals");

  return (
    <div className="space-y-6">
      <SegmentedToggle
        options={[
          { label: "Generals", value: "generals" },
          { label: "Teens", value: "teens" },
          { label: "Anniversaries", value: "anniversaries" },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "generals" && <GeneralBirthdaysTable data={generals} />}
      {activeTab === "teens" && <TeenBirthdaysTable data={teens} />}
      {activeTab === "anniversaries" && <GeneralAnniversariesTable data={anniversaries} />}
    </div>
  );
}
