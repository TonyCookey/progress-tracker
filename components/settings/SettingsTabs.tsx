"use client";

import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import clsx from "clsx";
import BasesPanel from "./BasesPanel";
import UsersSettingsTable from "./UsersSettingsTable";
import RefDataPanel from "./RefDataPanel";
import ReportTemplatePanel from "./ReportTemplatePanel";

const tabs = [
  { label: "Bases", panel: <BasesPanel /> },
  { label: "Users", panel: <UsersSettingsTable /> },
  { label: "Reference Data", panel: <RefDataPanel /> },
  { label: "Report Template", panel: <ReportTemplatePanel /> },
];

export default function SettingsTabs() {
  return (
    <TabGroup>
      <TabList className="flex flex-wrap gap-2 border-b mb-6">
        {tabs.map((tab) => (
          <Tab
            key={tab.label}
            className={({ selected }) =>
              clsx(
                "px-4 py-2 text-sm font-medium rounded-t-lg focus:outline-none",
                selected ? "bg-white border border-b-0 text-blue-700" : "text-gray-500 hover:text-blue-600",
              )
            }
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>
      <TabPanels>
        {tabs.map((tab) => (
          <TabPanel key={tab.label}>{tab.panel}</TabPanel>
        ))}
      </TabPanels>
    </TabGroup>
  );
}
