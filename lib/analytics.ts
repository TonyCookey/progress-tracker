import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/softDelete";
import { normalizeGender } from "@/lib/normalizeGender";
import { calculateAge } from "@/lib/calculateAge";

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

export type OfferingsByTypePoint = { type: string; total: number };

// Real Offering.type values (including admin-added RefData types), with a bucket
// for null/legacy rows - replaces the old Cash/Online-only assumption (S11-B1).
export async function getOfferingsByType({ baseId, from, to }: DateRange): Promise<OfferingsByTypePoint[]> {
  const offerings = await prisma.offering.findMany({
    where: { baseId: baseId ?? undefined, date: { gte: from, lt: to }, ...notDeleted(false) },
    select: { amount: true, type: true },
  });

  const byType = new Map<string, number>();
  for (const o of offerings) {
    const key = o.type ?? "Unspecified";
    byType.set(key, (byType.get(key) ?? 0) + Number(o.amount));
  }

  return Array.from(byType.entries())
    .map(([type, total]) => ({ type, total }))
    .sort((a, b) => b.total - a.total);
}

export type OfferingPerAttendeePoint = { month: string; total: number; sundayAttendance: number; perAttendee: number | null };

// total offerings / Sunday-service attendance per month - "Sunday Service" is the
// canonical Activity.type used for weekly attendance (lib/reports/monthly.ts).
// Months with zero attendance get a null point, not a division by zero.
export async function getOfferingPerAttendee({ baseId, from, to }: DateRange): Promise<OfferingPerAttendeePoint[]> {
  const [offerings, activities] = await Promise.all([
    prisma.offering.findMany({
      where: { baseId: baseId ?? undefined, date: { gte: from, lt: to }, ...notDeleted(false) },
      select: { amount: true, type: true, date: true },
    }),
    prisma.activity.findMany({
      where: { baseId: baseId ?? undefined, type: "Sunday Service", date: { gte: from, lt: to }, ...notDeleted(false) },
      include: { teenParticipation: { where: { attended: true }, select: { id: true } } },
    }),
  ]);

  const totalByMonth = new Map<string, number>();
  for (const o of offerings) {
    const key = monthKey(o.date);
    totalByMonth.set(key, (totalByMonth.get(key) ?? 0) + Number(o.amount));
  }

  const attendanceByMonth = new Map<string, number>();
  for (const a of activities) {
    const key = monthKey(a.date);
    attendanceByMonth.set(key, (attendanceByMonth.get(key) ?? 0) + a.teenParticipation.length);
  }

  return enumerateMonths(from, to).map((month) => {
    const total = totalByMonth.get(month) ?? 0;
    const sundayAttendance = attendanceByMonth.get(month) ?? 0;
    return {
      month,
      total,
      sundayAttendance,
      perAttendee: sundayAttendance > 0 ? Math.round((total / sundayAttendance) * 100) / 100 : null,
    };
  });
}

export type AttendanceTrendPoint = {
  activityId: string;
  date: string;
  type: string;
  attended: number;
  newCount: number;
  returningCount: number;
  rosterSize: number;
  rate: number | null;
};

const activeTeenFilter = { deletedAt: null, status: { not: "LEFT" as const } };

export async function getAttendanceTrend({
  baseId,
  activityType,
  from,
  to,
}: DateRange & { activityType?: string }): Promise<{
  points: AttendanceTrendPoint[];
  summary: { average: number; total: number; averageRate: number | null };
}> {
  const activities = await prisma.activity.findMany({
    where: { baseId: baseId ?? undefined, type: activityType ?? undefined, date: { gte: from, lt: to }, ...notDeleted(false) },
    include: { teenParticipation: { where: { attended: true }, select: { teenId: true } } },
    orderBy: { date: "asc" },
  });

  if (!activities.length) return { points: [], summary: { average: 0, total: 0, averageRate: null } };

  // Base-level roster denominator (v1) - active teen count per base, plus a global
  // count for cross-base activities (baseId null), computed once for the whole range.
  const baseIdsInScope = Array.from(new Set(activities.map((a) => a.baseId).filter((id): id is string => !!id)));
  const hasCrossBase = activities.some((a) => !a.baseId);
  const [rosterByBase, globalRoster] = await Promise.all([
    baseIdsInScope.length
      ? prisma.teen.groupBy({ by: ["baseId"], where: { baseId: { in: baseIdsInScope }, ...activeTeenFilter }, _count: { _all: true } })
      : [],
    hasCrossBase ? prisma.teen.count({ where: activeTeenFilter }) : 0,
  ]);
  const rosterSizeByBase = new Map(rosterByBase.map((r) => [r.baseId, r._count._all]));

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
    const rosterSize = activity.baseId ? (rosterSizeByBase.get(activity.baseId) ?? 0) : globalRoster;
    const attended = activity.teenParticipation.length;
    points.push({
      activityId: activity.id,
      date: activity.date.toISOString(),
      type: activity.type,
      attended,
      newCount,
      returningCount,
      rosterSize,
      rate: rosterSize > 0 ? Math.round((attended / rosterSize) * 1000) / 10 : null,
    });
  }

  const total = points.reduce((sum, p) => sum + p.attended, 0);
  const ratedPoints = points.filter((p) => p.rate !== null);
  const averageRate = ratedPoints.length
    ? Math.round((ratedPoints.reduce((sum, p) => sum + (p.rate as number), 0) / ratedPoints.length) * 10) / 10
    : null;
  return { points, summary: { average: Math.round((total / points.length) * 10) / 10, total, averageRate } };
}

export type AttendanceByTypePoint = { type: string; average: number; activityCount: number };

// Average attendance per Activity.type for the period - types come from the data
// itself (RefData keys are admin-editable, never hardcode a type list).
export async function getAttendanceByType({ baseId, from, to }: DateRange): Promise<AttendanceByTypePoint[]> {
  const activities = await prisma.activity.findMany({
    where: { baseId: baseId ?? undefined, date: { gte: from, lt: to }, ...notDeleted(false) },
    include: { teenParticipation: { where: { attended: true }, select: { id: true } } },
  });

  const byType = new Map<string, { total: number; count: number }>();
  for (const activity of activities) {
    const entry = byType.get(activity.type) ?? { total: 0, count: 0 };
    entry.total += activity.teenParticipation.length;
    entry.count += 1;
    byType.set(activity.type, entry);
  }

  return Array.from(byType.entries())
    .map(([type, { total, count }]) => ({ type, average: Math.round((total / count) * 10) / 10, activityCount: count }))
    .sort((a, b) => b.average - a.average);
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

export type TeenDemographics = {
  genderBreakdown: { gender: string; count: number }[];
  ageBreakdown: { bucket: string; count: number }[];
  totalActive: number;
};

const AGE_BUCKETS = ["10-12", "13-15", "16-18", "unknown"] as const;

function ageBucket(dateOfBirth: Date | null): (typeof AGE_BUCKETS)[number] {
  if (!dateOfBirth) return "unknown";
  const age = calculateAge(dateOfBirth);
  if (age <= 12) return "10-12";
  if (age <= 15) return "13-15";
  if (age <= 18) return "16-18";
  return "unknown";
}

// Over active teens for the base - counts must sum to the active roster, and
// unknown-DOB teens get their own bucket rather than being silently dropped.
export async function getTeenDemographics({ baseId }: { baseId?: string | null }): Promise<TeenDemographics> {
  const teens = await prisma.teen.findMany({
    where: { baseId: baseId ?? undefined, ...activeTeenFilter, ...notDeleted(false) },
    select: { gender: true, dateOfBirth: true },
  });

  const byGender = new Map<string, number>();
  const byAge = new Map<string, number>();
  for (const teen of teens) {
    const gender = normalizeGender(teen.gender);
    byGender.set(gender, (byGender.get(gender) ?? 0) + 1);
    const bucket = ageBucket(teen.dateOfBirth);
    byAge.set(bucket, (byAge.get(bucket) ?? 0) + 1);
  }

  return {
    genderBreakdown: Array.from(byGender.entries()).map(([gender, count]) => ({ gender, count })),
    ageBreakdown: AGE_BUCKETS.filter((b) => byAge.has(b)).map((bucket) => ({ bucket, count: byAge.get(bucket) ?? 0 })),
    totalActive: teens.length,
  };
}

export type NewConvertFunnel = {
  trend: { month: string; count: number }[];
  total: number;
  followedUp: number;
  becameTeen: number;
  followUpRate: number | null;
  conversionRate: number | null;
};

// baseId null records (cross-base converts) only appear in the all-bases view,
// same rule as every other analytics endpoint (S11-A4).
export async function getNewConvertFunnel({ baseId, from, to }: DateRange): Promise<NewConvertFunnel> {
  const converts = await prisma.newConvert.findMany({
    where: { baseId: baseId ?? undefined, date: { gte: from, lt: to }, ...notDeleted(false) },
    select: { date: true, followedUp: true, becameTeen: true },
  });

  const byMonth = new Map<string, number>();
  for (const c of converts) {
    const key = monthKey(c.date);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }
  const trend = enumerateMonths(from, to).map((month) => ({ month, count: byMonth.get(month) ?? 0 }));

  const total = converts.length;
  const followedUp = converts.filter((c) => c.followedUp).length;
  const becameTeen = converts.filter((c) => c.becameTeen).length;

  return {
    trend,
    total,
    followedUp,
    becameTeen,
    followUpRate: total > 0 ? Math.round((followedUp / total) * 100) : null,
    conversionRate: total > 0 ? Math.round((becameTeen / total) * 100) : null,
  };
}

export type TeachingRatePoint = { userId: string; name: string; taught: number; scheduled: number; rate: number };

// Per-general taught/scheduled rate for the period, from TeacherParticipation -
// names via safeUserSelect-style fields only (no password/etc).
export async function getTeachingRateComparison({ baseId, from, to }: DateRange): Promise<TeachingRatePoint[]> {
  const records = await prisma.teacherParticipation.findMany({
    where: { activity: { baseId: baseId ?? undefined, date: { gte: from, lt: to }, ...notDeleted(false) } },
    select: { attended: true, user: { select: { id: true, name: true, deletedAt: true } } },
  });

  const byUser = new Map<string, { name: string; taught: number; scheduled: number }>();
  for (const r of records) {
    if (r.user.deletedAt) continue;
    const entry = byUser.get(r.user.id) ?? { name: r.user.name, taught: 0, scheduled: 0 };
    entry.scheduled += 1;
    if (r.attended) entry.taught += 1;
    byUser.set(r.user.id, entry);
  }

  return Array.from(byUser.entries())
    .map(([userId, { name, taught, scheduled }]) => ({ userId, name, taught, scheduled, rate: Math.round((taught / scheduled) * 100) }))
    .sort((a, b) => b.rate - a.rate);
}
