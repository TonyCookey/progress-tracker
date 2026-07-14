import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSession, requireRole, assertBaseAccess, handleApiError } from "@/lib/auth";
import { updateGroupSchema } from "@/lib/validation/group";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const group = await prisma.group.findFirst({
      where: { id: params.id, ...notDeleted(includeArchived) },
      include: {
        // Soft-deleted teens/support-generals must not appear as active roster
        // members just because the parent group itself wasn't deleted.
        teens: { where: notDeleted(includeArchived) },
        base: true,
        activities: { where: notDeleted(includeArchived), orderBy: { date: "asc" } },
        leader: true,
        members: { where: { teen: notDeleted(includeArchived) }, include: { teen: true } },
        support: { where: { user: notDeleted(includeArchived) }, include: { user: true } },
      },
    });

    if (!group) return NextResponse.json("Group not found", { status: 404 });

    // `leader` is a required to-one relation, so Prisma can't filter it out via
    // `include`'s `where` — null it out manually if that general was soft-deleted.
    const leaderDeleted = !includeArchived && !!group.leader?.deletedAt;

    // Attendance trend: for each of the group's activities, the % of the group's
    // own teens (platoon roster or squad members) who attended.
    const memberTeenIds =
      group.type === "PLATOON" ? group.teens.map((t) => t.id) : group.members.map((m) => m.teenId);
    const activityIds = group.activities.map((a) => a.id);
    const participation = activityIds.length
      ? await prisma.activityParticipation.findMany({
          where: { activityId: { in: activityIds }, teenId: { in: memberTeenIds } },
        })
      : [];
    const attendanceTrend = group.activities.map((activity) => {
      const records = participation.filter((p) => p.activityId === activity.id);
      const attended = records.filter((p) => p.attended).length;
      return {
        activityId: activity.id,
        activityName: activity.name,
        date: activity.date,
        rate: records.length ? Math.round((attended / records.length) * 100) : null,
      };
    });

    return NextResponse.json({ ...group, leader: leaderDeleted ? null : group.leader, attendanceTrend });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    // Reassigning leadership/support is more consequential than a routine edit
    // (e.g. teen contact info), so gate it like offerings: SUPERADMIN or GENERAL only.
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);
    const data = parseOrThrow(updateGroupSchema, await req.json());

    const existingGroup = await prisma.group.findUnique({ where: { id: params.id } });
    if (!existingGroup) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    assertBaseAccess(session, existingGroup.baseId);
    assertBaseAccess(session, data.baseId);

    const updatedGroup = await prisma.group.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description ?? undefined,
        baseId: data.baseId,
        leaderId: data.leaderId,
        support: {
          deleteMany: {},
          create: (data.supportIds ?? []).map((userId: string) => ({
            user: { connect: { id: userId } },
          })),
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const activeMemberCount =
      group.type === "PLATOON"
        ? await prisma.teen.count({ where: { groupId: params.id, deletedAt: null } })
        : await prisma.groupMember.count({ where: { groupId: params.id, teen: { deletedAt: null } } });

    if (activeMemberCount > 0) {
      return NextResponse.json({ error: "Reassign teens before deleting this group" }, { status: 409 });
    }

    await prisma.group.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Group deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
