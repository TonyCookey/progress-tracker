import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, assertBaseAccess, handleApiError, ApiError } from "@/lib/auth";
import { updateGeneralSchema, toggleActiveSchema } from "@/lib/validation/general";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";
import { safeUserSelect } from "@/lib/users";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const general = await prisma.user.findFirst({
      where: { id: params.id, ...notDeleted(includeArchived) },
      select: {
        ...safeUserSelect,
        leadingGroups: { where: notDeleted(includeArchived) },
        // supportingGroups is the GroupSupport join table, not Group itself —
        // must include the nested `group` to get name/id, not just the join row.
        supportingGroups: { where: { group: notDeleted(includeArchived) }, include: { group: true } },
        teacherParticipation: {
          where: { activity: notDeleted(includeArchived) },
          include: { activity: true },
          orderBy: { activity: { date: "asc" } },
        },
      },
    });

    if (!general) {
      return NextResponse.json({ error: "General not found" }, { status: 404 });
    }

    const groups = [...general.leadingGroups, ...general.supportingGroups.map((s) => s.group)];
    const platoonIds = groups.filter((g) => g.type === "PLATOON").map((g) => g.id);
    const squadIds = groups.filter((g) => g.type === "SQUAD").map((g) => g.id);
    const [platoonCounts, squadCounts] = await Promise.all([
      platoonIds.length
        ? prisma.teen.groupBy({ by: ["groupId"], where: { groupId: { in: platoonIds }, deletedAt: null }, _count: { id: true } })
        : [],
      squadIds.length
        ? prisma.groupMember.groupBy({ by: ["groupId"], where: { groupId: { in: squadIds }, teen: { deletedAt: null } }, _count: { id: true } })
        : [],
    ]);
    const teenCountByGroup = new Map([
      ...platoonCounts.map((t): [string, number] => [t.groupId as string, t._count.id]),
      ...squadCounts.map((t): [string, number] => [t.groupId, t._count.id]),
    ]);

    const teaching = general.teacherParticipation.map((p) => ({
      activityId: p.activityId,
      activityName: p.activity.name,
      date: p.activity.date,
      attended: p.attended,
    }));
    const taughtCount = teaching.filter((t) => t.attended).length;
    const teachingRate = teaching.length ? Math.round((taughtCount / teaching.length) * 100) : null;

    return NextResponse.json({
      ...general,
      leadingGroups: general.leadingGroups.map((g) => ({ ...g, teenCount: teenCountByGroup.get(g.id) ?? 0 })),
      supportingGroups: general.supportingGroups.map((s) => ({
        ...s,
        group: { ...s.group, teenCount: teenCountByGroup.get(s.group.id) ?? 0 },
      })),
      teaching,
      teachingRate,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const data = parseOrThrow(updateGeneralSchema, await req.json());

    const existingGeneral = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existingGeneral) {
      return NextResponse.json({ error: "General not found" }, { status: 404 });
    }
    // Only SUPERADMIN or the general themselves may edit. A non-SUPERADMIN editing
    // their own record cannot change role or baseId (privilege escalation guard) -
    // those fields are silently pinned to their existing values.
    const isSuperAdmin = session.user.role === "SUPERADMIN";
    if (!isSuperAdmin && session.user.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isSuperAdmin) {
      assertBaseAccess(session, existingGeneral.baseId);
      assertBaseAccess(session, data.baseId);
    }

    const updatedGeneral = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        role: isSuperAdmin ? data.role : existingGeneral.role,
        baseId: isSuperAdmin ? data.baseId : existingGeneral.baseId,
      },
      select: safeUserSelect,
    });

    return NextResponse.json(updatedGeneral);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["SUPERADMIN"]);
    const { active } = parseOrThrow(toggleActiveSchema, await req.json());

    if (!active && session.user.id === params.id) {
      throw new ApiError(400, "You cannot deactivate your own account");
    }

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { deletedAt: active ? null : new Date() },
      select: safeUserSelect,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["SUPERADMIN"]);

    if (session.user.id === params.id) {
      throw new ApiError(400, "You cannot deactivate your own account");
    }

    await prisma.user.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
