import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/softDelete";

export type DateRange = { baseId?: string | null; from: Date; to: Date };

function monthKey(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

// Every month in [from, to), even ones with no data, so line charts don't skip months.
function enumerateMonths(from: Date, to: Date) {
  const months: string[] = [];
  const cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), 1));
  const end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), 1));
  while (cursor <= end) {
    months.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function splitCashOnline(offerings: { amount: unknown; type: string | null }[]) {
  const cash = offerings.filter((o) => o.type === "Cash").reduce((sum, o) => sum + Number(o.amount), 0);
  const online = offerings.filter((o) => o.type === "Online").reduce((sum, o) => sum + Number(o.amount), 0);
  // total = every offering in the bucket regardless of type, so custom
  // admin-added RefData types aren't silently dropped (sibling of S10-A1).
  const total = offerings.reduce((sum, o) => sum + Number(o.amount), 0);
  return { cash, online, total };
}

export type OfferingsTrendPoint = { month: string; cash: number; online: number; total: number };

export async function getOfferingsTrend({ baseId, from, to }: DateRange): Promise<OfferingsTrendPoint[]> {
  const offerings = await prisma.offering.findMany({
    where: { baseId: baseId ?? undefined, date: { gte: from, lt: to }, ...notDeleted(false) },
    select: { amount: true, type: true, date: true },
  });

  const byMonth = new Map<string, { amount: unknown; type: string | null }[]>();
  for (const o of offerings) {
    const key = monthKey(o.date);
    if (!byMonth.has(key)) byMonth.set(key, []);
    byMonth.get(key)!.push(o);
  }

  return enumerateMonths(from, to).map((month) => {
    const { cash, online, total } = splitCashOnline(byMonth.get(month) ?? []);
    return { month, cash, online, total };
  });
}

export type OfferingsByBasePoint = { baseId: string; baseName: string; month: string; cash: number; online: number; total: number };

export async function getOfferingsTrendByBase({ from, to }: { from: Date; to: Date }): Promise<OfferingsByBasePoint[]> {
  const [bases, offerings] = await Promise.all([
    prisma.base.findMany({ orderBy: { name: "asc" } }),
    prisma.offering.findMany({
      where: { date: { gte: from, lt: to }, ...notDeleted(false) },
      select: { amount: true, type: true, date: true, baseId: true },
    }),
  ]);

  const months = enumerateMonths(from, to);
  const points: OfferingsByBasePoint[] = [];
  for (const base of bases) {
    const baseOfferings = offerings.filter((o) => o.baseId === base.id);
    const byMonth = new Map<string, typeof baseOfferings>();
    for (const o of baseOfferings) {
      const key = monthKey(o.date);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key)!.push(o);
    }
    for (const month of months) {
      const { cash, online, total } = splitCashOnline(byMonth.get(month) ?? []);
      points.push({ baseId: base.id, baseName: base.name, month, cash, online, total });
    }
  }
  return points;
}

export type OfferingsByServicePoint = { service: string; cash: number; online: number; total: number };

export async function getOfferingsByService({ baseId, from, to }: DateRange): Promise<OfferingsByServicePoint[]> {
  const offerings = await prisma.offering.findMany({
    where: { baseId: baseId ?? undefined, date: { gte: from, lt: to }, ...notDeleted(false) },
    select: { amount: true, type: true, service: true },
  });

  const byService = new Map<string, { amount: unknown; type: string | null }[]>();
  for (const o of offerings) {
    if (!byService.has(o.service)) byService.set(o.service, []);
    byService.get(o.service)!.push(o);
  }

  const points = Array.from(byService.entries())
    .map(([service, items]) => ({ service, ...splitCashOnline(items) }))
    .sort((a, b) => b.total - a.total);

  if (points.length <= 8) return points;

  const top = points.slice(0, 8);
  const rest = points.slice(8);
  const other = rest.reduce(
    (acc, p) => ({ service: "Other", cash: acc.cash + p.cash, online: acc.online + p.online, total: acc.total + p.total }),
    { service: "Other", cash: 0, online: 0, total: 0 },
  );
  return [...top, other];
}

export type AttendanceTrendPoint = {
  activityId: string;
  date: string;
  type: string;
  attended: number;
  newCount: number;
  returningCount: number;
};

export async function getAttendanceTrend({
  baseId,
  activityType,
  from,
  to,
}: DateRange & { activityType?: string }): Promise<{ points: AttendanceTrendPoint[]; summary: { average: number; total: number } }> {
  const activities = await prisma.activity.findMany({
    where: { baseId: baseId ?? undefined, type: activityType ?? undefined, date: { gte: from, lt: to }, ...notDeleted(false) },
    include: { teenParticipation: { where: { attended: true }, select: { teenId: true } } },
    orderBy: { date: "asc" },
  });

  if (!activities.length) return { points: [], summary: { average: 0, total: 0 } };

  // Every teen who had an attended participation before this range, so "new" can be
  // told apart from "returning" without an N+1 query per activity.
  const priorAttended = await prisma.activityParticipation.findMany({
    where: {
      attended: true,
      activity: { baseId: baseId ?? undefined, type: activityType ?? undefined, date: { lt: from }, ...notDeleted(false) },
    },
    select: { teenId: true },
  });
  const everAttendedBefore = new Set(priorAttended.map((p) => p.teenId));

  const points: AttendanceTrendPoint[] = [];
  const seenInRange = new Set(everAttendedBefore);
  for (const activity of activities) {
    let newCount = 0;
    let returningCount = 0;
    for (const p of activity.teenParticipation) {
      if (seenInRange.has(p.teenId)) returningCount++;
      else newCount++;
      seenInRange.add(p.teenId);
    }
    points.push({
      activityId: activity.id,
      date: activity.date.toISOString(),
      type: activity.type,
      attended: activity.teenParticipation.length,
      newCount,
      returningCount,
    });
  }

  const total = points.reduce((sum, p) => sum + p.attended, 0);
  return { points, summary: { average: Math.round((total / points.length) * 10) / 10, total } };
}

export type AttendanceDropoff = {
  priorCount: number;
  currentCount: number;
  droppedOffCount: number;
  droppedOffTeens: { id: string; name: string }[];
};

export async function getAttendanceDropoff({
  baseId,
  activityType,
  periodStart,
  periodEnd,
}: {
  baseId?: string | null;
  activityType?: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<AttendanceDropoff> {
  const periodLengthMs = periodEnd.getTime() - periodStart.getTime();
  const priorStart = new Date(periodStart.getTime() - periodLengthMs);

  const [currentParticipation, priorParticipation] = await Promise.all([
    prisma.activityParticipation.findMany({
      where: {
        attended: true,
        activity: { baseId: baseId ?? undefined, type: activityType ?? undefined, date: { gte: periodStart, lt: periodEnd }, ...notDeleted(false) },
        teen: { status: "ACTIVE", ...notDeleted(false) },
      },
      select: { teenId: true },
    }),
    prisma.activityParticipation.findMany({
      where: {
        attended: true,
        activity: { baseId: baseId ?? undefined, type: activityType ?? undefined, date: { gte: priorStart, lt: periodStart }, ...notDeleted(false) },
        teen: { status: "ACTIVE", ...notDeleted(false) },
      },
      select: { teenId: true },
    }),
  ]);

  const currentSet = new Set(currentParticipation.map((p) => p.teenId));
  const priorSet = new Set(priorParticipation.map((p) => p.teenId));
  const droppedOffIds = [...priorSet].filter((id) => !currentSet.has(id));

  const droppedOffTeens = droppedOffIds.length
    ? await prisma.teen.findMany({ where: { id: { in: droppedOffIds.slice(0, 20) } }, select: { id: true, name: true } })
    : [];

  return {
    priorCount: priorSet.size,
    currentCount: currentSet.size,
    droppedOffCount: droppedOffIds.length,
    droppedOffTeens,
  };
}

export type MembershipGrowth = {
  trend: { month: string; added: number }[];
  statusSnapshot: { status: string; count: number }[];
};

export async function getMembershipGrowth({ baseId, from, to }: DateRange): Promise<MembershipGrowth> {
  const [joined, statusGroups] = await Promise.all([
    prisma.teen.findMany({
      where: { baseId: baseId ?? undefined, dateJoined: { gte: from, lt: to }, ...notDeleted(false) },
      select: { dateJoined: true },
    }),
    prisma.teen.groupBy({
      by: ["status"],
      where: { baseId: baseId ?? undefined, ...notDeleted(false) },
      _count: { _all: true },
    }),
  ]);

  const byMonth = new Map<string, number>();
  for (const t of joined) {
    if (!t.dateJoined) continue;
    const key = monthKey(t.dateJoined);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  const trend = enumerateMonths(from, to).map((month) => ({ month, added: byMonth.get(month) ?? 0 }));
  const statusSnapshot = statusGroups.map((g) => ({ status: g.status, count: g._count._all }));

  return { trend, statusSnapshot };
}

export type GroupBreakdown = {
  platoons: { groupId: string; name: string; teenCount: number }[];
  squads: { groupId: string; name: string; teenCount: number }[];
  attendanceByPlatoon: { groupId: string; name: string; attended: number }[];
};

export async function getGroupBreakdown({ baseId, from, to }: DateRange): Promise<GroupBreakdown> {
  const [platoons, squads, participation] = await Promise.all([
    prisma.group.findMany({
      where: { type: "PLATOON", baseId: baseId ?? undefined, ...notDeleted(false) },
      select: { id: true, name: true, _count: { select: { teens: true } } },
    }),
    prisma.group.findMany({
      where: { type: "SQUAD", baseId: baseId ?? undefined, ...notDeleted(false) },
      select: { id: true, name: true, _count: { select: { members: true } } },
    }),
    prisma.activityParticipation.findMany({
      where: { attended: true, activity: { baseId: baseId ?? undefined, date: { gte: from, lt: to }, ...notDeleted(false) } },
      select: { teen: { select: { groupId: true } } },
    }),
  ]);

  const attendedByPlatoonId = new Map<string, number>();
  for (const p of participation) {
    if (!p.teen.groupId) continue;
    attendedByPlatoonId.set(p.teen.groupId, (attendedByPlatoonId.get(p.teen.groupId) ?? 0) + 1);
  }

  return {
    platoons: platoons.map((g) => ({ groupId: g.id, name: g.name, teenCount: g._count.teens })),
    squads: squads.map((g) => ({ groupId: g.id, name: g.name, teenCount: g._count.members })),
    attendanceByPlatoon: platoons.map((g) => ({ groupId: g.id, name: g.name, attended: attendedByPlatoonId.get(g.id) ?? 0 })),
  };
}
