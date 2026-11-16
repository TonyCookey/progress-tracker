import type { Base, MonthlyReport } from "@prisma/client";
import { buildMonthlyReportPptx } from "@/lib/reports/generatePptx";
import type { MonthlyReportData } from "@/lib/reports/monthly";

export const PPTX_CONTENT_TYPE = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

export function isR2Configured() {
  return !!(process.env.R2_ENDPOINT && process.env.R2_ACCESS_KEY && process.env.R2_SECRET_KEY && process.env.R2_BUCKET);
}

export function reportFileName(base: Pick<Base, "name" | "label">, month: number, year: number) {
  return `${(base.label ?? base.name).replace(/\s+/g, "-")}-${year}-${String(month).padStart(2, "0")}.pptx`;
}

export function reportFileKey(baseId: string, month: number, year: number) {
  return `reports/monthly/${baseId}/${year}-${String(month).padStart(2, "0")}.pptx`;
}

// One place that turns a saved report (narrative + finances) and its auto figures into
// a .pptx buffer - used both when generating and when re-downloading a past report.
export async function buildReportBuffer({
  base,
  month,
  year,
  auto,
  draft,
}: {
  base: Pick<Base, "name" | "label">;
  month: number;
  year: number;
  auto: MonthlyReportData;
  draft: MonthlyReport | null;
}): Promise<Buffer> {
  const pptx = buildMonthlyReportPptx({
    baseLabel: base.label ?? base.name,
    baseName: base.name,
    month,
    year,
    auto,
    openingBalance: Number(draft?.openingBalance ?? 0),
    income: Number(draft?.income ?? auto.offeringsTotal.total),
    expenseItems: (draft?.expenseItems as { description: string; amount: number }[] | null) ?? [],
    theme: draft?.theme ?? "",
    executiveSummary: draft?.executiveSummary ?? "",
    issues: draft?.issues ?? "",
    alternativeChurches: draft?.alternativeChurches ?? "",
    sundayTeaching: draft?.sundayTeaching ?? "",
    description: draft?.description ?? "",
    victories: (draft?.victories as string[] | null) ?? [],
    challenges: (draft?.challenges as string[] | null) ?? [],
    plans: (draft?.plans as string[] | null) ?? [],
    updateOnTeens: draft?.updateOnTeens ?? "",
  });
  return (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
}
