import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { requireRole, assertBaseAccess, handleApiError, ApiError } from "@/lib/auth";
import { generateMonthlyReportSchema } from "@/lib/validation/monthlyReport";
import { parseOrThrow } from "@/lib/validation/parse";
import { getMonthlyReport } from "@/lib/reports/monthly";
import { buildMonthlyReportPptx } from "@/lib/reports/generatePptx";

export async function POST(req: Request) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);
    const { baseId, month, year } = parseOrThrow(generateMonthlyReportSchema, await req.json());
    assertBaseAccess(session, baseId);

    const [base, draft, auto] = await Promise.all([
      prisma.base.findUnique({ where: { id: baseId } }),
      prisma.monthlyReport.findUnique({ where: { baseId_month_year: { baseId, month, year } } }),
      getMonthlyReport({ baseId, month, year }),
    ]);

    if (!base) {
      throw new ApiError(404, "Base not found");
    }

    const expenseItems = (draft?.expenseItems as { description: string; amount: number }[] | null) ?? [];

    const pptx = buildMonthlyReportPptx({
      baseLabel: base.label ?? base.name,
      baseName: base.name,
      month,
      year,
      auto,
      openingBalance: Number(draft?.openingBalance ?? 0),
      income: Number(draft?.income ?? auto.offeringsTotal.total),
      expenseItems,
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

    const buffer = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;

    const fileKey = `reports/monthly/${baseId}/${year}-${String(month).padStart(2, "0")}.pptx`;
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: fileKey,
        Body: buffer,
        ContentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      }),
    );

    await prisma.monthlyReport.upsert({
      where: { baseId_month_year: { baseId, month, year } },
      create: {
        baseId,
        month,
        year,
        generatedBy: session.user.id,
        status: "FINAL",
        dataJson: JSON.parse(JSON.stringify(auto)),
        fileKey,
        openingBalance: draft?.openingBalance,
        income: draft?.income,
        expenseItems: draft?.expenseItems ?? undefined,
        theme: draft?.theme,
        executiveSummary: draft?.executiveSummary,
        issues: draft?.issues,
        alternativeChurches: draft?.alternativeChurches,
        sundayTeaching: draft?.sundayTeaching,
        description: draft?.description,
        victories: draft?.victories ?? undefined,
        challenges: draft?.challenges ?? undefined,
        plans: draft?.plans ?? undefined,
        updateOnTeens: draft?.updateOnTeens,
      },
      update: {
        status: "FINAL",
        dataJson: JSON.parse(JSON.stringify(auto)),
        fileKey,
        generatedAt: new Date(),
      },
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${(base.label ?? base.name).replace(/\s+/g, "-")}-${year}-${String(month).padStart(2, "0")}.pptx"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
