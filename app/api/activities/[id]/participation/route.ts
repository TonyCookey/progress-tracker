import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const activityId = params.id;

  // Fetch activity details to determine scope
  const activity = await prisma.activity.findUnique({
    where: { id: activityId },
    include: { groups: true, base: true },
  });

  if (!activity) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 });
  }
  console.log(activity, "activity");

  let teenWhere: any = {};

  if (activity.isCrossBase) {
    teenWhere = {};
  } else if (activity.groups && activity.groups.length > 0) {
    // Teens in the specified squads/platoons
    const groupIds = activity.groups.map((g) => g.id);
    teenWhere = {
      OR: [{ platoon: { id: { in: groupIds } } }, { squadMemberships: { some: { groupId: { in: groupIds } } } }],
    };
  } else if (activity.baseId) {
    teenWhere = { baseId: activity.baseId };
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
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const activityId = params.id;
  const { teenId, attended, notes } = await req.json();

  // Check if participation record exists
  const existing = await prisma.activityParticipation.findFirst({
    where: { activityId, teenId },
  });

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
}
