import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { requireRole, assertBaseAccess, handleApiError } from "@/lib/auth";
import { getMonthlyReport, type MonthlyReportData } from "@/lib/reports/monthly";
import { buildReportBuffer, isR2Configured, PPTX_CONTENT_TYPE, reportFileName } from "@/lib/reports/buildReportFile";

// Download a past report. Prefers the archived copy in R2 (exactly what was generated);
// otherwise rebuilds it from the saved inputs, using the auto-figure snapshot taken at
// generation time so the numbers match what was originally sent. Drafts that were never
// generated are built from live figures.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);

    const report = await prisma.monthlyReport.findUnique({ where: { id: params.id }, include: { base: true } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    assertBaseAccess(session, report.baseId);

    if (report.fileKey && isR2Configured()) {
      try {
        const url = await getSignedUrl(r2, new GetObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: report.fileKey }), { expiresIn: 300 });
        return NextResponse.redirect(url);
      } catch (signError) {
        console.error("[reports/download] presign failed, rebuilding instead", signError);
      }
    }

    const auto = (report.dataJson as MonthlyReportData | null) ?? (await getMonthlyReport({ baseId: report.baseId, month: report.month, year: report.year }));
    const buffer = await buildReportBuffer({ base: report.base, month: report.month, year: report.year, auto, draft: report });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": PPTX_CONTENT_TYPE,
        "Content-Disposition": `attachment; filename="${reportFileName(report.base, report.month, report.year)}"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
