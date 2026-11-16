import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { requireRole, assertBaseAccess, handleApiError, ApiError } from "@/lib/auth";
import { generateMonthlyReportSchema } from "@/lib/validation/monthlyReport";
import { parseOrThrow } from "@/lib/validation/parse";
import { getMonthlyReport } from "@/lib/reports/monthly";
import { buildReportBuffer, isR2Configured, PPTX_CONTENT_TYPE, reportFileKey, reportFileName } from "@/lib/reports/buildReportFile";

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

    const buffer = await buildReportBuffer({ base, month, year, auto, draft });

    // Archiving to R2 is best-effort: if storage isn't configured or the upload fails,
    // the user still gets their file, and the report can be rebuilt later from the
    // saved inputs + the auto-figure snapshot (dataJson) stored below.
    let fileKey: string | null = draft?.fileKey ?? null;
    if (isR2Configured()) {
      const key = reportFileKey(baseId, month, year);
      try {
        await r2.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: key, Body: buffer, ContentType: PPTX_CONTENT_TYPE }));
        fileKey = key;
      } catch (uploadError) {
        console.error("[reports/generate] R2 upload failed - returning file without archiving", uploadError);
      }
    }

    const snapshot = JSON.parse(JSON.stringify(auto));
    await prisma.monthlyReport.upsert({
      where: { baseId_month_year: { baseId, month, year } },
      create: {
        baseId,
        month,
        year,
        generatedBy: session.user.id,
        status: "FINAL",
        dataJson: snapshot,
        fileKey,
      },
      update: {
        status: "FINAL",
        dataJson: snapshot,
        fileKey,
        generatedBy: session.user.id,
        generatedAt: new Date(),
      },
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": PPTX_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${reportFileName(base, month, year)}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
