import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";
import { updateRefDataSchema } from "@/lib/validation/refdata";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    const data = parseOrThrow(updateRefDataSchema, await req.json());
    const item = await prisma.refData.update({ where: { id: params.id }, data });
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    const item = await prisma.refData.update({ where: { id: params.id }, data: { active: false } });
    return NextResponse.json(item);
  } catch (error) {
    return handleApiError(error);
  }
}
