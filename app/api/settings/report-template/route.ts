import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";
import { reportTemplateConfigSchema } from "@/lib/validation/reportTemplate";

export async function GET() {
  try {
    await requireRole(["SUPERADMIN"]);
    const config = await prisma.reportTemplateConfig.findUnique({ where: { key: "default" } });
    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request) {
  try {
    await requireRole(["SUPERADMIN"]);
    const data = parseOrThrow(reportTemplateConfigSchema, await req.json());

    const config = await prisma.reportTemplateConfig.upsert({
      where: { key: "default" },
      update: { sectionsJson: data.sectionsJson },
      create: { key: "default", sectionsJson: data.sectionsJson },
    });

    return NextResponse.json(config);
  } catch (error) {
    return handleApiError(error);
  }
}
