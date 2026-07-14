import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();

    const report = await prisma.monthlyReport.findUnique({ where: { id: params.id } });
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    assertBaseAccess(session, report.baseId);

    if (!report.fileKey) {
      return NextResponse.json({ error: "Report has not been generated yet" }, { status: 404 });
    }

    const url = await getSignedUrl(r2, new GetObjectCommand({ Bucket: process.env.R2_BUCKET!, Key: report.fileKey }), { expiresIn: 3600 });

    return NextResponse.json({ url });
  } catch (error) {
    return handleApiError(error);
  }
}
