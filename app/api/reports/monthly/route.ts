import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, assertBaseAccess, handleApiError, ApiError } from "@/lib/auth";
import { saveMonthlyReportSchema } from "@/lib/validation/monthlyReport";
import { parseOrThrow } from "@/lib/validation/parse";
import { getMonthlyReport } from "@/lib/reports/monthly";

// Reads the session (headers), so it must never be prerendered at build time.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);
    const { searchParams } = new URL(req.url);
    const baseId = searchParams.get("baseId");
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    // History listing: superadmins may omit baseId to see every base's reports.
    if (!month && !year) {
      if (!baseId && session.user.role !== "SUPERADMIN") throw new ApiError(400, "baseId is required");
      if (baseId) assertBaseAccess(session, baseId);
      const reports = await prisma.monthlyReport.findMany({
        where: baseId ? { baseId } : {},
        select: { id: true, baseId: true, month: true, year: true, status: true, generatedAt: true, generatedBy: true, updatedAt: true, fileKey: true, base: { select: { name: true, label: true } } },
        orderBy: [{ year: "desc" }, { month: "desc" }],
      });
      const userIds = Array.from(new Set(reports.map((r) => r.generatedBy)));
      const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true } });
      const nameById = new Map(users.map((u) => [u.id, u.name]));
      return NextResponse.json({
        reports: reports.map(({ fileKey, ...r }) => ({ ...r, archived: !!fileKey, generatedByName: nameById.get(r.generatedBy) ?? null })),
      });
    }

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
    throw new ApiError(400, "month and year must be provided together");
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
