import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const activityId = params.id;

  // Fetch all teens and their participation for this activity
  const teens = await prisma.teen.findMany({
    include: {
      activityParticipation: {
        where: { activityId },
        select: { attended: true, notes: true, id: true },
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
