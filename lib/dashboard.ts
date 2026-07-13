import { prisma } from "@/lib/prisma";

export async function getDashboardCards() {
  const bases = await prisma.base.findMany({ orderBy: { name: "asc" } });

  const [
    teensCount,
    generalsCount,
    leadersCount,
    volunteersCount,
    activitiesCount,
    squadsCount,
    platoonsCount,
    baseTeenCounts,
    baseSquadCounts,
    basePlatoonCounts,
  ] = await Promise.all([
    prisma.teen.count({ where: { deletedAt: null } }),

    prisma.user.count({ where: { role: "GENERAL", deletedAt: null } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.user.count({ where: { role: "VOLUNTEER", deletedAt: null } }),

    prisma.activity.count({ where: { deletedAt: null } }),

    prisma.group.count({ where: { type: "SQUAD", deletedAt: null } }),
    prisma.group.count({ where: { type: "PLATOON", deletedAt: null } }),

    Promise.all(bases.map((base) => prisma.teen.count({ where: { baseId: base.id, deletedAt: null } }))),
    Promise.all(bases.map((base) => prisma.group.count({ where: { type: "SQUAD", baseId: base.id, deletedAt: null } }))),
    Promise.all(bases.map((base) => prisma.group.count({ where: { type: "PLATOON", baseId: base.id, deletedAt: null } }))),
  ]);

  const baseCards = bases.flatMap((base, i) => [
    { label: `Total ${base.name} Base Lieutenants`, value: baseTeenCounts[i] },
    { label: `Total ${base.name} Squads`, value: baseSquadCounts[i] },
    { label: `Total ${base.name} Platoons`, value: basePlatoonCounts[i] },
  ]);

  return [
    { label: "Total Lieutenants", value: teensCount },
    { label: "Total Generals", value: generalsCount },
    { label: "Total Leaders", value: leadersCount },
    { label: "Total Volunteers", value: volunteersCount },

    { label: "Total Activities", value: activitiesCount },

    { label: "Total Squads", value: squadsCount },
    { label: "Total Platoons", value: platoonsCount },

    ...baseCards,
  ];
}
