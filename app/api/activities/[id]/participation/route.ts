import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSession, assertBaseAccess, handleApiError, ApiError } from "@/lib/auth";
import { markParticipationSchema } from "@/lib/validation/activity";
import { parseOrThrow } from "@/lib/validation/parse";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const activityId = params.id;

    // Fetch activity details to determine scope
    const activity = await prisma.activity.findUnique({
      where: { id: activityId },
      include: { groups: true, base: true },
    });

    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const activeTeenFilter = { deletedAt: null, status: { not: "LEFT" as const } };
    let teenWhere: any = { ...activeTeenFilter };

    if (activity.groups && activity.groups.length > 0) {
      // Teens in the specified squads/platoons
      const groupIds = activity.groups.map((g) => g.id);
      teenWhere = {
        ...activeTeenFilter,
        OR: [{ platoon: { id: { in: groupIds } } }, { squadMemberships: { some: { groupId: { in: groupIds } } } }],
      };
    } else if (activity.baseId) {
      teenWhere = { ...activeTeenFilter, baseId: activity.baseId };
    }

    // Fetch teens with their participation for this activity
    const teens = await prisma.teen.findMany({
      where: teenWhere,
      include: {
        activityParticipation: {
          where: { activityId },
          select: { attended: true, id: true },
        },
      },
    });

    const result = teens.map((teen) => ({
      id: teen.id,
      name: teen.name,
      gender: teen.gender,
      attended: teen.activityParticipation[0]?.attended ?? false,
      participationId: teen.activityParticipation[0]?.id ?? null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const activityId = params.id;
    const { teenId, attended, notes } = parseOrThrow(markParticipationSchema, await req.json());

    const activity = await prisma.activity.findUnique({ where: { id: activityId }, include: { groups: true } });
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!activity.isCrossBase) {
      assertBaseAccess(session, activity.baseId);
    }

    const [teen, existing] = await Promise.all([
      prisma.teen.findUnique({ where: { id: teenId } }),
      prisma.activityParticipation.findFirst({ where: { activityId, teenId } }),
    ]);

    // Only block *new* attendance records for an inactive teen; allow correcting
    // an already-recorded entry for a teen who has since left/been removed.
    if (!existing && (!teen || teen.deletedAt || teen.status === "LEFT")) {
      throw new ApiError(400, "Teen is not active", { teenId: ["Teen is not active"] });
    }

    // Prevent marking a teen present at an activity outside its scope (e.g. a
    // Bravo teen at an Alpha service). Cross-base activities admit any teen;
    // group-scoped activities admit only teens in one of those groups.
    if (!existing && teen && !activity.isCrossBase) {
      const groupIds = activity.groups.map((g) => g.id);
      let inScope: boolean;
      if (groupIds.length > 0) {
        inScope =
          (!!teen.groupId && groupIds.includes(teen.groupId)) ||
          (await prisma.groupMember.count({ where: { teenId, groupId: { in: groupIds } } })) > 0;
      } else {
        inScope = teen.baseId === activity.baseId;
      }
      if (!inScope) {
        throw new ApiError(400, "Teen is not in this activity's scope", { teenId: ["Teen is not in this activity's scope"] });
      }
    }

    let participation;
    if (existing) {
      // Update attendance
      participation = await prisma.activityParticipation.update({
        where: { id: existing.id },
        data: { attended, notes },
      });
    } else {
      // Create attendance record
      participation = await prisma.activityParticipation.create({
        data: { activityId, teenId, attended, notes },
      });
    }

    return NextResponse.json({ success: true, participation });
  } catch (error) {
    return handleApiError(error);
  }
}
