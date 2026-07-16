"use client";

import { useEffect, useState } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

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
    <Card>
      <p className="text-sm text-neutral-500 mb-4">Choose which sections appear on the monthly report.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {Object.entries(SECTION_LABELS).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!sections[key]}
              onChange={() => toggle(key)}
              className="h-4 w-4 rounded border-neutral-300 text-accent-500 focus:ring-accent-400"
            />
            <span className="text-sm text-neutral-700">{label}</span>
          </label>
        ))}
      </div>
      <Button onClick={save} disabled={saving} isLoading={saving} className="mt-4">
        {saving ? "Saving..." : "Save"}
      </Button>
    </Card>
  );
}
