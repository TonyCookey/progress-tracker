"use client";

import { useState } from "react";
import GeneralBirthdaysTable from "./GeneralBirthdaysTable";
import TeenBirthdaysTable from "./TeenBirthdaysTable";
import SegmentedToggle from "@/components/ui/SegmentedToggle";

type Tab = "generals" | "teens";

export default function BirthdayTabs({ generals, teens }: { generals: any[]; teens: any[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("generals");

  return (
    <div className="space-y-6">
      <SegmentedToggle
        options={[
          { label: "Generals", value: "generals" },
          { label: "Teens", value: "teens" },
        ]}
        value={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === "generals" && <GeneralBirthdaysTable data={generals} />}
      {activeTab === "teens" && <TeenBirthdaysTable data={teens} />}
    </div>
  );
}
