"use client";

import { useState } from "react";
import GeneralBirthdaysTable from "./GeneralBirthdaysTable";
import TeenBirthdaysTable from "./TeenBirthdaysTable";

type Tab = "generals" | "teens";

export default function BirthdayTabs({ generals, teens }: { generals: any[]; teens: any[] }) {
  const [activeTab, setActiveTab] = useState<Tab>("generals");

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <button className={`px-4 py-2 rounded ${activeTab === "generals" ? "bg-cyan-600 text-white" : "bg-gray-200"}`} onClick={() => setActiveTab("generals")}>
          Generals
        </button>
        <button className={`px-4 py-2 rounded ${activeTab === "teens" ? "bg-cyan-600 text-white" : "bg-gray-200"}`} onClick={() => setActiveTab("teens")}>
          Teens
        </button>
      </div>

      {activeTab === "generals" && <GeneralBirthdaysTable data={generals} />}
      {activeTab === "teens" && <TeenBirthdaysTable data={teens} />}
    </div>
  );
}
