import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, assertBaseAccess, handleApiError, ApiError } from "@/lib/auth";
import { saveMonthlyReportSchema } from "@/lib/validation/monthlyReport";
import { parseOrThrow } from "@/lib/validation/parse";
import { getMonthlyReport } from "@/lib/reports/monthly";

export async function GET(req: Request) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);
    const { searchParams } = new URL(req.url);
    const baseId = searchParams.get("baseId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    if (!baseId) {
      throw new ApiError(400, "baseId is required");
    }
    assertBaseAccess(session, baseId);

    if (month && year) {
      const [auto, draft] = await Promise.all([
        getMonthlyReport({ baseId, month: parseInt(month), year: parseInt(year) }),
        prisma.monthlyReport.findUnique({
          where: { baseId_month_year: { baseId, month: parseInt(month), year: parseInt(year) } },
        }),
      ]);
      return NextResponse.json({ auto, draft });
    }

    const reports = await prisma.monthlyReport.findMany({
      where: { baseId },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });
    return NextResponse.json({ reports });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);
    const data = parseOrThrow(saveMonthlyReportSchema, await req.json());
    assertBaseAccess(session, data.baseId);

    const report = await prisma.monthlyReport.upsert({
      where: { baseId_month_year: { baseId: data.baseId, month: data.month, year: data.year } },
      create: {
        baseId: data.baseId,
        month: data.month,
        year: data.year,
        generatedBy: session.user.id,
        openingBalance: data.openingBalance,
        income: data.income,
        expenseItems: data.expenseItems,
        theme: data.theme,
        executiveSummary: data.executiveSummary,
        issues: data.issues,
        alternativeChurches: data.alternativeChurches,
        sundayTeaching: data.sundayTeaching,
        description: data.description,
        victories: data.victories,
        challenges: data.challenges,
        plans: data.plans,
        updateOnTeens: data.updateOnTeens,
      },
      update: {
        openingBalance: data.openingBalance,
        income: data.income,
        expenseItems: data.expenseItems,
        theme: data.theme,
        executiveSummary: data.executiveSummary,
        issues: data.issues,
        alternativeChurches: data.alternativeChurches,
        sundayTeaching: data.sundayTeaching,
        description: data.description,
        victories: data.victories,
        challenges: data.challenges,
        plans: data.plans,
        updateOnTeens: data.updateOnTeens,
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    return handleApiError(error);
  }
}
