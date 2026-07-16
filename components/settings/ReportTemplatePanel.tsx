"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";

const SECTION_LABELS: Record<string, string> = {
  theme: "Theme",
  executiveSummary: "Executive Summary",
  issues: "Issues",
  alternativeChurches: "Alternative Churches",
  sundayTeaching: "Sunday Teaching",
  description: "Description",
  victories: "Victories",
  challenges: "Challenges",
  plans: "Plans",
  updateOnTeens: "Update on Teens",
};

export default function ReportTemplatePanel() {
  const [sections, setSections] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/report-template");
      const data = await res.json();
      setSections(data?.sectionsJson ?? {});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const toggle = (key: string) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings/report-template", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectionsJson: sections }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to save: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      alert("Report template saved");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="shadow rounded p-4">
      <p className="text-sm text-gray-500 mb-4">Choose which sections appear on the monthly report.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(SECTION_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input type="checkbox" checked={!!sections[key]} onChange={() => toggle(key)} className="h-4 w-4" />
            <span className="text-sm">{label}</span>
          </label>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}
