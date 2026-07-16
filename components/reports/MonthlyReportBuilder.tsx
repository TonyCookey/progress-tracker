"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useSession } from "next-auth/react";
import { formatMoney } from "@/lib/formatMoney";
import { formatDateUTC } from "@/lib/formatDate";
import LoadingSpinner from "../common/LoadingSpinner";
import Card from "@/components/ui/Card";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";

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

  // Drop rows the user never filled in (blank description, no amount entered) so an
  // untouched "+ Add Expense" row doesn't block saving; keep everything else as-is.
  const cleanExpenseItems = (items: ExpenseItem[]) =>
    (items ?? [])
      .map((item) => ({ description: (item.description ?? "").trim(), amount: Number(item.amount) || 0 }))
      .filter((item) => item.description !== "" || item.amount !== 0);

  const buildPayload = (data: FormData) => ({
    baseId,
    month,
    year,
    openingBalance: data.openingBalance === "" ? null : Number(data.openingBalance),
    income: data.income === "" ? null : Number(data.income),
    expenseItems: cleanExpenseItems(data.expenseItems),
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

  // Shared by Save Draft and Generate (which saves first) so the request, error
  // handling, and expense-row validation stay in one place.
  const saveDraft = async (data: FormData) => {
    const incompleteRow = cleanExpenseItems(data.expenseItems).find((item) => item.description === "");
    if (incompleteRow) {
      alert("Each expense line item needs a description.");
      return null;
    }
    const res = await fetch("/api/reports/monthly", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(buildPayload(data)),
    });
    if (!res.ok) {
      const text = await res.text();
      alert(`Failed to save draft: ${res.status} ${res.statusText} - ${text}`);
      return null;
    }
    return res.json();
  };

  const onSaveDraft = async (data: FormData) => {
    setSaving(true);
    try {
      const report = await saveDraft(data);
      if (!report) return;
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
      const savedReport = await saveDraft(data);
      if (!savedReport) return;

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
      <Card className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {isSuperAdmin && (
          <Select value={baseId} onChange={(e) => setBaseId(e.target.value)} className="sm:w-auto">
            {bases.map((base) => (
              <option key={base.id} value={base.id}>
                {base.name}
              </option>
            ))}
          </Select>
        )}
        <Select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="sm:w-auto">
          {months.map((m, idx) => (
            <option key={m} value={idx + 1}>
              {m}
            </option>
          ))}
        </Select>
        <Select value={year} onChange={(e) => setYear(Number(e.target.value))} className="sm:w-auto">
          {Array.from({ length: 6 }).map((_, idx) => {
            const y = now.getFullYear() - 2 + idx;
            return (
              <option key={y} value={y}>
                {y}
              </option>
            );
          })}
        </Select>
        {status && <Badge tone={status === "FINAL" ? "success" : "warning"}>{status}</Badge>}
      </Card>

      {loading || !auto ? (
        <LoadingSpinner />
      ) : (
        <form className="space-y-6">
          {/* Auto figures */}
          <Card>
            <h2 className="text-base font-semibold text-neutral-900 mb-4">Auto Figures (read-only)</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-sm text-neutral-500">Estimated Membership</p>
                <p className="text-lg font-bold text-neutral-900">{auto.membership}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">New Converts</p>
                <p className="text-lg font-bold text-neutral-900">{auto.newConverts.count}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Offerings (Cash)</p>
                <p className="text-lg font-bold text-neutral-900">{formatMoney(auto.offeringsTotal.cash)}</p>
              </div>
              <div>
                <p className="text-sm text-neutral-500">Offerings (Transfer)</p>
                <p className="text-lg font-bold text-neutral-900">{formatMoney(auto.offeringsTotal.online)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-2">Sunday Attendance</p>
              {auto.sundayAttendance.length ? (
                <div className="flex flex-wrap gap-3">
                  {auto.sundayAttendance.map((a) => (
                    <span key={a.activityId} className="px-3 py-1 bg-accent-50 text-accent-700 rounded-pill text-sm">
                      {formatDateUTC(a.date, { month: "short", day: "numeric" })}: {a.count}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">No Sunday Service activities recorded for this month.</p>
              )}
            </div>
          </Card>

          {/* Manual finance inputs */}
          <Card>
            <h2 className="text-base font-semibold text-neutral-900 mb-4">Finances (from bank statement)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
              <Input type="number" step="0.01" label="Opening Balance" {...register("openingBalance")} />
              <div>
                <Input
                  type="number"
                  step="0.01"
                  label="Income (statement)"
                  hint={`app offerings: ${formatMoney(auto.offeringsTotal.total)}`}
                  {...register("income")}
                />
                {reconciliationGap !== 0 && (
                  <p className="text-xs text-warning-700 mt-1">
                    {reconciliationGap > 0 ? "Statement is higher by" : "Statement is lower by"} {formatMoney(Math.abs(reconciliationGap))} vs app offerings.
                  </p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-neutral-700">Expense Line Items</label>
                <Button type="button" variant="secondary" size="sm" onClick={() => append({ description: "", amount: 0 })}>
                  + Add Expense
                </Button>
              </div>
              <div className="space-y-2">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Description (e.g. Bank Charges)"
                      {...register(`expenseItems.${idx}.description` as const)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="Amount"
                      {...register(`expenseItems.${idx}.amount` as const)}
                      className="w-full sm:w-40"
                    />
                    <Button type="button" variant="ghost" onClick={() => remove(idx)} className="text-danger-500 hover:bg-danger-50">
                      Remove
                    </Button>
                  </div>
                ))}
                {!fields.length && <p className="text-sm text-neutral-500">No expense line items yet.</p>}
              </div>
            </div>

            <div className="flex justify-end gap-8 border-t border-neutral-200 pt-4">
              <div className="text-right">
                <p className="text-sm text-neutral-500">Total Expenses</p>
                <p className="font-semibold text-neutral-900">{formatMoney(expensesTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-neutral-500">Closing Balance</p>
                <p className="text-lg font-bold text-neutral-900">{formatMoney(closingBalance)}</p>
              </div>
            </div>
          </Card>

          {/* Narrative */}
          <Card className="space-y-4">
            <h2 className="text-base font-semibold text-neutral-900 mb-2">Narrative</h2>
            <Input label="Theme" {...register("theme")} />
            <Textarea label="Executive Summary" {...register("executiveSummary")} rows={3} />
            <Textarea label="Issues" {...register("issues")} rows={2} />
            <Textarea label="Alternative Churches" {...register("alternativeChurches")} rows={2} />
            <Textarea label="Sunday Teaching Summary" {...register("sundayTeaching")} rows={3} />
            <Textarea label="Description" {...register("description")} rows={2} />
            <Textarea label="Victories (one per line)" {...register("victories")} rows={3} />
            <Textarea label="Challenges (one per line)" {...register("challenges")} rows={3} />
            <Textarea label="Plans (one per line)" {...register("plans")} rows={3} />
            <Textarea label="Update on Teens" {...register("updateOnTeens")} rows={3} />
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleSubmit(onSaveDraft)} disabled={saving || !baseId} isLoading={saving}>
              {saving ? "Saving..." : "Save Draft"}
            </Button>
            <Button type="button" variant="primary" onClick={handleSubmit(onGenerate)} disabled={generating || !baseId} isLoading={generating}>
              {generating ? "Generating..." : "Generate .pptx"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
