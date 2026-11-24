import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, assertBaseAccess, handleApiError } from "@/lib/auth";
import { updateFirstTimerSchema } from "@/lib/validation/firstTimer";
import { parseOrThrow } from "@/lib/validation/parse";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const firstTimer = await prisma.firstTimer.findFirst({
      where: { id: params.id, deletedAt: null },
      include: { base: { select: { id: true, name: true } } },
    });
    if (!firstTimer) return NextResponse.json({ error: "First timer not found" }, { status: 404 });
    assertBaseAccess(session, firstTimer.baseId);
    return NextResponse.json(firstTimer);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const data = parseOrThrow(updateFirstTimerSchema, await req.json());

    const existing = await prisma.firstTimer.findFirst({ where: { id: params.id, deletedAt: null } });
    if (!existing) return NextResponse.json({ error: "First timer not found" }, { status: 404 });

    assertBaseAccess(session, existing.baseId);
    assertBaseAccess(session, data.baseId);

    const updated = await prisma.firstTimer.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);
    await prisma.firstTimer.update({ where: { id: params.id }, data: { deletedAt: new Date() } });
    return NextResponse.json({ message: "First timer deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
