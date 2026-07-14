import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();

    const report = await prisma.monthlyReport.findUnique({
      where: { id: params.id },
      include: { base: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    assertBaseAccess(session, report.baseId);

    return NextResponse.json(report);
  } catch (error) {
    return handleApiError(error);
  }
}
