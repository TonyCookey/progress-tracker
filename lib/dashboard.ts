import { prisma } from "@/lib/prisma";

export type DashboardStat = { label: string; value: number; href: string; hint?: string };
export type DashboardBaseSummary = {
  id: string;
  name: string;
  label: string | null;
  stats: DashboardStat[];
};
export type DashboardSummary = {
  headline: DashboardStat[];
  roles: DashboardStat[];
  bases: DashboardBaseSummary[];
};

const ROLES = [
  { role: "SUPERADMIN", label: "Superadmins" },
  { role: "GENERAL", label: "Generals" },
  { role: "COLONEL", label: "Colonels" },
  { role: "VOLUNTEER", label: "Volunteers" },
] as const;

// Every number on the dashboard links to the list it was counted from, pre-filtered,
// so "12 Alpha squads" opens exactly those 12 squads.
// `scopeBaseId` limits every count to one base (non-superadmins only ever see their own
// base in the lists these cards link to, so the numbers must match).
export async function getDashboardSummary(scopeBaseId?: string): Promise<DashboardSummary> {
  const bases = await prisma.base.findMany({ where: scopeBaseId ? { id: scopeBaseId } : {}, orderBy: { name: "asc" } });
  const base = scopeBaseId ? { baseId: scopeBaseId } : {};

  const [teensCount, usersCount, activitiesCount, squadsCount, platoonsCount, roleCounts, teensByBase, groupsByBase, usersByBase] =
    await Promise.all([
      prisma.teen.count({ where: { deletedAt: null, ...base } }),
      prisma.user.count({ where: { deletedAt: null, ...base } }),
      prisma.activity.count({ where: { deletedAt: null, ...base } }),
      prisma.group.count({ where: { type: "SQUAD", deletedAt: null, ...base } }),
      prisma.group.count({ where: { type: "PLATOON", deletedAt: null, ...base } }),
      prisma.user.groupBy({ by: ["role"], where: { deletedAt: null, ...base }, _count: { _all: true } }),
      prisma.teen.groupBy({ by: ["baseId"], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.group.groupBy({ by: ["baseId", "type"], where: { deletedAt: null }, _count: { _all: true } }),
      prisma.user.groupBy({ by: ["baseId"], where: { deletedAt: null }, _count: { _all: true } }),
    ]);

  const roleCount = (role: string) => roleCounts.find((r) => r.role === role)?._count._all ?? 0;
  const teenCount = (baseId: string) => teensByBase.find((r) => r.baseId === baseId)?._count._all ?? 0;
  const userCount = (baseId: string) => usersByBase.find((r) => r.baseId === baseId)?._count._all ?? 0;
  const groupCount = (baseId: string, type: "SQUAD" | "PLATOON") =>
    groupsByBase.find((r) => r.baseId === baseId && r.type === type)?._count._all ?? 0;

  return {
    headline: [
      { label: "Lieutenants", value: teensCount, href: "/dashboard/lieutenants", hint: "Teens on the roster" },
      // "Generals" (UI term) = all active Users, any role — see AGENT.md §2.
      { label: "Generals", value: usersCount, href: scopeBaseId ? `/dashboard/generals?baseId=${scopeBaseId}` : "/dashboard/generals", hint: "Leaders, all roles" },
      { label: "Activities", value: activitiesCount, href: "/dashboard/activities", hint: "All time" },
      { label: "Squads", value: squadsCount, href: scopeBaseId ? `/dashboard/squads?baseId=${scopeBaseId}` : "/dashboard/squads" },
      { label: "Platoons", value: platoonsCount, href: scopeBaseId ? `/dashboard/platoons?baseId=${scopeBaseId}` : "/dashboard/platoons" },
    ],
    roles: ROLES.map(({ role, label }) => ({
      label,
      value: roleCount(role),
      href: `/dashboard/generals?role=${role}${scopeBaseId ? `&baseId=${scopeBaseId}` : ""}`,
    })),
    bases: bases.map((base) => ({
      id: base.id,
      name: base.name,
      label: base.label,
      stats: [
        { label: "Lieutenants", value: teenCount(base.id), href: `/dashboard/lieutenants?baseId=${base.id}` },
        { label: "Generals", value: userCount(base.id), href: `/dashboard/generals?baseId=${base.id}` },
        { label: "Squads", value: groupCount(base.id, "SQUAD"), href: `/dashboard/squads?baseId=${base.id}` },
        { label: "Platoons", value: groupCount(base.id, "PLATOON"), href: `/dashboard/platoons?baseId=${base.id}` },
      ],
    })),
  };
}

// Flat card list kept for the existing GET /api/dashboard consumers.
export async function getDashboardCards(scopeBaseId?: string) {
  const summary = await getDashboardSummary(scopeBaseId);
  return [
    ...summary.headline.map(({ label, value, href }) => ({ label: `Total ${label}`, value, href })),
    ...summary.roles.map(({ label, value, href }) => ({ label: `Role: ${label}`, value, href })),
    ...summary.bases.flatMap((b) => b.stats.map(({ label, value, href }) => ({ label: `Total ${b.name} ${label}`, value, href }))),
  ];
}
