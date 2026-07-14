"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useSession } from "next-auth/react";
import { formatMoney } from "@/lib/formatMoney";
import LoadingSpinner from "../common/LoadingSpinner";

type Option = { id: string; name: string; label?: string | null };

type AutoData = {
  membership: number;
  sundayAttendance: { activityId: string; date: string; count: number }[];
  offeringsTotal: { cash: number; online: number; total: number };
  newConverts: { count: number; list: { id: string; name: string; date: string }[] };
};

type ExpenseItem = { description: string; amount: number };

type FormData = {
  openingBalance: number | string;
  income: number | string;
  expenseItems: ExpenseItem[];
  theme: string;
  executiveSummary: string;
  issues: string;
  alternativeChurches: string;
  sundayTeaching: string;
  description: string;
  victories: string;
  challenges: string;
  plans: string;
  updateOnTeens: string;
};

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function toLines(value: string) {
  return value.split("\n").map((s) => s.trim()).filter(Boolean);
}

function fromLines(value: unknown) {
  return Array.isArray(value) ? value.join("\n") : "";
}

export default function MonthlyReportBuilder() {
  const { data: session } = useSession();
  const user = session?.user;
  const isSuperAdmin = user?.role === "SUPERADMIN";

  const now = new Date();
  const [bases, setBases] = useState<Option[]>([]);
  const [baseId, setBaseId] = useState<string>("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [auto, setAuto] = useState<AutoData | null>(null);
  const [status, setStatus] = useState<"DRAFT" | "FINAL" | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const { register, handleSubmit, reset, control, watch } = useForm<FormData>({
    defaultValues: { expenseItems: [] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "expenseItems" });

  useEffect(() => {
    if (isSuperAdmin) {
      fetch("/api/bases")
        .then((res) => res.json())
        .then(setBases);
    } else if (user?.baseId) {
      setBaseId(user.baseId);
    }
  }, [isSuperAdmin, user?.baseId]);

  useEffect(() => {
    if (isSuperAdmin && !baseId && bases.length) {
      setBaseId(bases[0].id);
    }
  }, [isSuperAdmin, bases, baseId]);

  const loadReport = async () => {
    if (!baseId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/monthly?baseId=${baseId}&month=${month}&year=${year}`, { cache: "no-store" });
      if (!res.ok) return;
      const { auto, draft } = await res.json();
      setAuto(auto);
      setStatus(draft?.status ?? null);
      reset({
        openingBalance: draft?.openingBalance ?? "",
        income: draft?.income ?? auto.offeringsTotal.total ?? "",
        expenseItems: draft?.expenseItems ?? [],
        theme: draft?.theme ?? "",
        executiveSummary: draft?.executiveSummary ?? "",
        issues: draft?.issues ?? "",
        alternativeChurches: draft?.alternativeChurches ?? "",
        sundayTeaching: draft?.sundayTeaching ?? "",
        description: draft?.description ?? "",
        victories: fromLines(draft?.victories),
        challenges: fromLines(draft?.challenges),
        plans: fromLines(draft?.plans),
        updateOnTeens: draft?.updateOnTeens ?? "",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseId, month, year]);

  const income = Number(watch("income")) || 0;
  const openingBalance = Number(watch("openingBalance")) || 0;
  const expenseItems = watch("expenseItems") ?? [];
  const expensesTotal = expenseItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const closingBalance = openingBalance + income - expensesTotal;
  const reconciliationGap = auto ? income - auto.offeringsTotal.total : 0;

  const currentBase = useMemo(() => bases.find((b) => b.id === baseId), [bases, baseId]);

  const buildPayload = (data: FormData) => ({
    baseId,
    month,
    year,
    openingBalance: data.openingBalance === "" ? null : Number(data.openingBalance),
    income: data.income === "" ? null : Number(data.income),
    expenseItems: (data.expenseItems ?? []).map((item) => ({ description: item.description, amount: Number(item.amount) || 0 })),
    theme: data.theme,
    executiveSummary: data.executiveSummary,
    issues: data.issues,
    alternativeChurches: data.alternativeChurches,
    sundayTeaching: data.sundayTeaching,
    description: data.description,
    victories: toLines(data.victories),
    challenges: toLines(data.challenges),
    plans: toLines(data.plans),
    updateOnTeens: data.updateOnTeens,
  });

  const onSaveDraft = async (data: FormData) => {
    setSaving(true);
    try {
      const res = await fetch("/api/reports/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(data)),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to save draft: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      const report = await res.json();
      setStatus(report.status);
      alert("Draft saved");
    } finally {
      setSaving(false);
    }
  };

  const onGenerate = async (data: FormData) => {
    setGenerating(true);
    try {
      // Save first so the .pptx is built from the latest inputs.
      const saveRes = await fetch("/api/reports/monthly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildPayload(data)),
      });
      if (!saveRes.ok) {
        const text = await saveRes.text();
        alert(`Failed to save before generating: ${saveRes.status} ${saveRes.statusText} - ${text}`);
        return;
      }
      const res = await fetch("/api/reports/monthly/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseId, month, year }),
      });
      if (!res.ok) {
        const text = await res.text();
        alert(`Failed to generate report: ${res.status} ${res.statusText} - ${text}`);
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${currentBase?.label ?? currentBase?.name ?? "report"}-${months[month - 1]}-${year}.pptx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      setStatus("FINAL");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center bg-white border rounded p-4 shadow-sm">
        {isSuperAdmin && (
          <select value={baseId} onChange={(e) => setBaseId(e.target.value)} className="border rounded px-3 py-2">
            {bases.map((base) => (
              <option key={base.id} value={base.id}>
                {base.name}
              </option>
            ))}
          </select>
        )}
        <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border rounded px-3 py-2">
          {months.map((m, idx) => (
            <option key={m} value={idx + 1}>
              {m}
            </option>
          ))}
        </select>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border rounded px-3 py-2">
          {Array.from({ length: 6 }).map((_, idx) => {
            const y = now.getFullYear() - 2 + idx;
            return (
              <option key={y} value={y}>
                {y}
              </option>
            );
          })}
        </select>
        {status && (
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${status === "FINAL" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
            {status}
          </span>
        )}
      </div>

      {loading || !auto ? (
        <LoadingSpinner />
      ) : (
        <form className="space-y-6">
          {/* Auto figures */}
          <div className="bg-white border rounded p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Auto Figures (read-only)</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">Estimated Membership</p>
                <p className="text-xl font-bold">{auto.membership}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">New Converts</p>
                <p className="text-xl font-bold">{auto.newConverts.count}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Offerings (Cash)</p>
                <p className="text-xl font-bold">{formatMoney(auto.offeringsTotal.cash)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Offerings (Transfer)</p>
                <p className="text-xl font-bold">{formatMoney(auto.offeringsTotal.online)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-2">Sunday Attendance</p>
              {auto.sundayAttendance.length ? (
                <div className="flex flex-wrap gap-3">
                  {auto.sundayAttendance.map((a) => (
                    <span key={a.activityId} className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-sm">
                      {new Date(a.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}: {a.count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No Sunday Service activities recorded for this month.</p>
              )}
            </div>
          </div>

          {/* Manual finance inputs */}
          <div className="bg-white border rounded p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Finances (from bank statement)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Opening Balance</label>
                <input type="number" step="0.01" {...register("openingBalance")} className="w-full border px-3 py-2 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Income (statement) <span className="text-gray-400 font-normal">- app offerings: {formatMoney(auto.offeringsTotal.total)}</span>
                </label>
                <input type="number" step="0.01" {...register("income")} className="w-full border px-3 py-2 rounded" />
                {reconciliationGap !== 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    {reconciliationGap > 0 ? "Statement is higher by" : "Statement is lower by"} {formatMoney(Math.abs(reconciliationGap))} vs app offerings.
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Expense Line Items</label>
                <button
                  type="button"
                  onClick={() => append({ description: "", amount: 0 })}
                  className="text-sm px-3 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  + Add Expense
                </button>
              </div>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex gap-2">
                    <input
                      placeholder="Description (e.g. Bank Charges)"
                      {...register(`expenseItems.${idx}.description` as const)}
                      className="flex-1 border px-3 py-2 rounded"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      {...register(`expenseItems.${idx}.amount` as const)}
                      className="w-40 border px-3 py-2 rounded"
                    />
                    <button type="button" onClick={() => remove(idx)} className="px-3 py-2 text-red-600 hover:bg-red-50 rounded">
                      Remove
                    </button>
                  </div>
                ))}
                {!fields.length && <p className="text-sm text-gray-500">No expense line items yet.</p>}
              </div>
            </div>

            <div className="flex justify-end gap-8 border-t pt-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="font-semibold">{formatMoney(expensesTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Closing Balance</p>
                <p className="text-xl font-bold">{formatMoney(closingBalance)}</p>
              </div>
            </div>
          </div>

          {/* Narrative */}
          <div className="bg-white border rounded p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold mb-2">Narrative</h2>
            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <input {...register("theme")} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Executive Summary</label>
              <textarea {...register("executiveSummary")} rows={3} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Issues</label>
              <textarea {...register("issues")} rows={2} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Alternative Churches</label>
              <textarea {...register("alternativeChurches")} rows={2} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Sunday Teaching Summary</label>
              <textarea {...register("sundayTeaching")} rows={3} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea {...register("description")} rows={2} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Victories (one per line)</label>
              <textarea {...register("victories")} rows={3} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Challenges (one per line)</label>
              <textarea {...register("challenges")} rows={3} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Plans (one per line)</label>
              <textarea {...register("plans")} rows={3} className="w-full border px-3 py-2 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Update on Teens</label>
              <textarea {...register("updateOnTeens")} rows={3} className="w-full border px-3 py-2 rounded" />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleSubmit(onSaveDraft)}
              disabled={saving || !baseId}
              className="px-5 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            <button
              type="button"
              onClick={handleSubmit(onGenerate)}
              disabled={generating || !baseId}
              className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate .pptx"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
