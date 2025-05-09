import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const alphaBase = await prisma.base.findFirst({ where: { name: "Alpha" } });
    const bravoBase = await prisma.base.findFirst({ where: { name: "Bravo" } });

    if (!alphaBase || !bravoBase) {
      return NextResponse.json({ error: "Bases not found" }, { status: 404 });
    }
    const [
      teensCount,
      alphaBaseTeensCount,
      bravoBaseTeensCount,
      generalsCount,
      volunteersCount,
      activitiesCount,
      squadsCount,
      alphaBaseSquadsCount,
      bravoBaseSquadsCount,
      platoonsCount,
      alphaBasePlatoonsCount,
      bravoBasePlatoonsCount,
    ] = await Promise.all([
      prisma.teen.count(),
      prisma.teen.count({ where: { baseId: alphaBase.id } }),
      prisma.teen.count({ where: { baseId: bravoBase.id } }),

      prisma.user.count(),
      prisma.user.count({ where: { role: "VOLUNTEER" } }),

      prisma.activity.count(),
      prisma.activity.count({ where: { baseId: alphaBase.id } }),
      prisma.activity.count({ where: { baseId: bravoBase.id } }),

      prisma.group.count({ where: { type: "SQUAD" } }),
      prisma.group.count({ where: { type: "SQUAD", baseId: alphaBase.id } }),
      prisma.group.count({ where: { type: "SQUAD", baseId: bravoBase.id } }),

      prisma.group.count({ where: { type: "PLATOON" } }),
      prisma.group.count({ where: { type: "PLATOON", base: alphaBase } }),
      prisma.group.count({ where: { type: "PLATOON", base: bravoBase } }),
    ]);
    const cards = [
      { label: "Total Lieutenants", value: teensCount },
      { label: "Total Alpha Base Lieutenants", value: alphaBaseTeensCount },
      { label: "Total Bravo Base Lieutenants", value: bravoBaseTeensCount },

      { label: "Total Generals", value: generalsCount },
      { label: "Total Volunteers", value: volunteersCount },

      { label: "Total Activities", value: activitiesCount },

      { label: "Total Squads", value: squadsCount },
      { label: "Total Alpha Squads", value: alphaBaseSquadsCount },
      { label: "Total Bravo Squads", value: bravoBaseSquadsCount },

      { label: "Total Platoons", value: platoonsCount },
      { label: "Total Alpha Platoons", value: alphaBasePlatoonsCount },
      { label: "Total Bravo Platoons", value: bravoBasePlatoonsCount },
    ];

    return NextResponse.json(cards);
  } catch (error) {
    console.error("[DASHBOARD_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch Dashboard" }, { status: 500 });
  }
}
