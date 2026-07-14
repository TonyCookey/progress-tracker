import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, assertBaseAccess, handleApiError } from "@/lib/auth";
import { updateNewConvertSchema } from "@/lib/validation/newConvert";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const newConvert = await prisma.newConvert.findFirst({
      where: { id: params.id, ...notDeleted(includeArchived) },
      include: { base: true },
    });

    if (!newConvert) {
      return NextResponse.json({ error: "New convert not found" }, { status: 404 });
    }

    return NextResponse.json(newConvert);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const data = parseOrThrow(updateNewConvertSchema, await req.json());

    const existing = await prisma.newConvert.findUnique({ where: { id: params.id } });
    if (!existing) {
      return NextResponse.json({ error: "New convert not found" }, { status: 404 });
    }

    // The edit form has no isCrossBase control, so a missing field on the request
    // must preserve the record's existing value rather than silently reset it to false.
    const isCrossBase = data.isCrossBase ?? existing.isCrossBase;
    const baseId = isCrossBase ? null : (data.baseId ?? existing.baseId);
    assertBaseAccess(session, existing.isCrossBase ? null : existing.baseId);
    assertBaseAccess(session, isCrossBase ? null : baseId);

    const updated = await prisma.newConvert.update({
      where: { id: params.id },
      data: {
        name: data.name,
        gender: data.gender,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth,
        baseId,
        isCrossBase,
        date: data.date,
        activityId: data.activityId,
        invitedBy: data.invitedBy,
        followedUp: data.followedUp,
        becameTeen: data.becameTeen,
        teenId: data.teenId,
        notes: data.notes,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    await prisma.newConvert.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "New convert deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
