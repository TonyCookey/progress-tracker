import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createActivitySchema } from "@/lib/validation/activity";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";
import { assertGroupsInBase, assertGroupsExist } from "@/lib/validateBaseRefs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const activity = await prisma.activity.findFirst({
      where: { id: params.id, ...notDeleted(includeArchived) },
      include: { base: true, groups: true },
    });

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);
    const body = parseOrThrow(createActivitySchema, await req.json());
    const { name, description, type, date, platoonId, squadIds } = body;

    const existingActivity = await prisma.activity.findUnique({ where: { id: params.id } });
    if (!existingActivity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

    const isCrossBase = body.baseId === "cross-base" ? true : body.isCrossBase;
    const baseId = isCrossBase ? null : body.baseId;

    assertBaseAccess(session, existingActivity.isCrossBase ? null : existingActivity.baseId);
    if (!isCrossBase) {
      assertBaseAccess(session, baseId);
    } else if (session.user.role !== "SUPERADMIN") {
      assertBaseAccess(session, null);
    }

    const groupIds: string[] = [];
    if (platoonId) groupIds.push(platoonId);
    if (Array.isArray(squadIds)) groupIds.push(...squadIds);

    // A base-scoped activity may only attach its own base's groups; a cross-base
    // activity may span groups from any base, so just check they exist.
    if (baseId) await assertGroupsInBase(groupIds, baseId, "groupIds");
    else await assertGroupsExist(groupIds, "groupIds");

    const updatedActivity = await prisma.activity.update({
      where: { id: params.id },
      data: {
        name,
        description: description ?? undefined,
        type,
        date,
        baseId,
        isCrossBase,
        groups: { set: groupIds.map((id) => ({ id })) },
      },
      include: { groups: true },
    });

    return NextResponse.json(updatedActivity);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);

    const activity = await prisma.activity.findUnique({ where: { id: params.id } });
    if (!activity) return NextResponse.json({ error: "Activity not found" }, { status: 404 });

    assertBaseAccess(session, activity.isCrossBase ? null : activity.baseId);

    await prisma.activity.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Activity deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
