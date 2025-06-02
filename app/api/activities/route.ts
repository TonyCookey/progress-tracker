import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, type, date, baseId, platoonId, squadIds = [], isCrossBase = false } = body;

    // Collect all group IDs
    const groupIds: string[] = [];

    if (platoonId) groupIds.push(platoonId);
    if (Array.isArray(squadIds)) groupIds.push(...squadIds);

    const activity = await prisma.activity.create({
      data: {
        name,
        type,
        date: new Date(date),
        baseId,
        isCrossBase,
        groups: {
          connect: groupIds.map((id) => ({ id })),
        },
      },
      include: {
        groups: true,
      },
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json({ message: "Failed to create activity" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const baseId = searchParams.get("baseId");

    const activities = await prisma.activity.findMany({
      where: baseId ? { baseId } : {},
      include: {
        base: true,
        groups: true,
        teenParticipation: true,
        teacherParticipation: true,
      },
      orderBy: {
        date: "desc",
      },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
