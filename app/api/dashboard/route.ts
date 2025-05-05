import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const [teensCount, generalsCount, activitiesCount, squadsCount, platoonsCount] = await Promise.all([
      prisma.teen.count(),
      prisma.user.count(),
      prisma.activity.count(),
      prisma.group.count({ where: { type: "SQUAD" } }),
      prisma.group.count({ where: { type: "PLATOON" } }),
    ]);
    const cards = [
      { label: "Total Lieutenants", value: teensCount },
      { label: "Total Generals", value: generalsCount },
      { label: "Total Activities", value: activitiesCount },
      { label: "Total Squads", value: squadsCount },
      { label: "Total Platoons", value: platoonsCount },
    ];

    return NextResponse.json(cards);
  } catch (error) {
    console.error("[DASHBOARD_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch Dashboard" }, { status: 500 });
  }
}
