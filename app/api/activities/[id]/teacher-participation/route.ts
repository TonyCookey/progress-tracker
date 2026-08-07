import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSession, assertBaseAccess, handleApiError, ApiError } from "@/lib/auth";
import { markTeacherParticipationSchema } from "@/lib/validation/activity";
import { parseOrThrow } from "@/lib/validation/parse";
import { safeUserSelect } from "@/lib/users";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const activityId = params.id;

    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const userWhere = activity.isCrossBase || !activity.baseId ? { deletedAt: null } : { deletedAt: null, baseId: activity.baseId };

    const users = await prisma.user.findMany({
      where: userWhere,
      select: {
        ...safeUserSelect,
        teacherParticipation: {
          where: { activityId },
          select: { attended: true, id: true, role: true },
        },
      },
    });

    const result = users.map((user) => ({
      id: user.id,
      name: user.name,
      role: user.role,
      attended: user.teacherParticipation[0]?.attended ?? false,
      participationId: user.teacherParticipation[0]?.id ?? null,
      teachingRole: user.teacherParticipation[0]?.role ?? null,
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
    const { userId, attended, role, notes } = parseOrThrow(markTeacherParticipationSchema, await req.json());

    const activity = await prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }
    if (!activity.isCrossBase) {
      assertBaseAccess(session, activity.baseId);
    }

    const [user, existing] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.teacherParticipation.findFirst({ where: { activityId, userId } }),
    ]);

    // Only block *new* attendance records for a soft-deleted user; allow
    // correcting an already-recorded entry for a user who has since been removed.
    if (!existing && (!user || user.deletedAt)) {
      throw new ApiError(400, "User is not active", { userId: ["User is not active"] });
    }

    // Cross-base activities admit any user; base-scoped activities admit only
    // users belonging to that base (mirrors the teen scope check).
    if (!existing && user && !activity.isCrossBase && activity.baseId && user.baseId !== activity.baseId) {
      throw new ApiError(400, "User is not in this activity's scope", { userId: ["User is not in this activity's scope"] });
    }

    let participation;
    if (existing) {
      participation = await prisma.teacherParticipation.update({
        where: { id: existing.id },
        data: { attended, role, notes },
      });
    } else {
      participation = await prisma.teacherParticipation.create({
        data: { activityId, userId, attended, role, notes },
      });
    }

    return NextResponse.json({ success: true, participation });
  } catch (error) {
    return handleApiError(error);
  }
}
