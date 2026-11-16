import { Prisma } from "@prisma/client";
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
  // `to` is exclusive - step back 1ms so a range ending exactly at a month boundary
  // (e.g. "This Year" -> Jan 1 next year) doesn't grow an extra empty month.
  const last = new Date(to.getTime() - 1);
  const end = new Date(Date.UTC(last.getUTCFullYear(), last.getUTCMonth(), 1));
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

// ---------------------------------------------------------------------------
// Attendance analytics
//
// Every attendance metric below is built on one shared "attendance context": the
// activities in scope (with which teens attended) plus the active roster (with which
// platoon/squads each teen is in). That lets us answer "who was *expected* at this
// activity" accurately:
//   - a base activity expects that base's active teens; a cross-base one expects everyone
//   - an activity tied to platoons/squads expects only members of those groups
// Previously the denominator was always the whole base roster, so a single-platoon
// activity showed a misleadingly low rate.
//
// Activities where nobody has been marked yet (no participation rows at all) are
// treated as "not recorded" - they are excluded from rates and drop-off rather than
// counted as 0% turnout.
// ---------------------------------------------------------------------------

export type GroupFilter = { platoonIds?: string[]; squadIds?: string[] };
export type AnalyticsScope = DateRange & GroupFilter;

// "Active roster" for analytics denominators is strictly status ACTIVE - the same
// definition the monthly report uses for membership (lib/reports/monthly.ts).
const activeTeenFilter = { deletedAt: null, status: "ACTIVE" as const };

function hasGroupFilter(f: GroupFilter) {
  return !!(f.platoonIds?.length || f.squadIds?.length);
}

// Platoons OR'd together, squads OR'd together, and the two dimensions AND'd - so
// "Platoon A + Choir squad" means choir members who are in platoon A.
export function teenGroupWhere(f: GroupFilter): Prisma.TeenWhereInput {
  const and: Prisma.TeenWhereInput[] = [];
  if (f.platoonIds?.length) and.push({ groupId: { in: f.platoonIds } });
  if (f.squadIds?.length) and.push({ squadMemberships: { some: { groupId: { in: f.squadIds } } } });
  return and.length ? { AND: and } : {};
}

// With a group filter, only activities the filtered teens could have attended: open
// activities (no groups attached) or ones attached to a selected group.
function activityGroupWhere(f: GroupFilter): Prisma.ActivityWhereInput {
  const ids = [...(f.platoonIds ?? []), ...(f.squadIds ?? [])];
  if (!ids.length) return {};
  return { OR: [{ groups: { none: {} } }, { groups: { some: { id: { in: ids } } } }] };
}

type RosterTeen = { id: string; name: string; baseId: string; groupId: string | null; squadIds: string[] };

type ContextActivity = {
  id: string;
  name: string;
  type: string;
  date: Date;
  baseId: string | null;
  groupIds: string[];
  attendees: Set<string>;
  recorded: boolean;
};

async function loadRoster(baseId: string | null | undefined, f: GroupFilter): Promise<RosterTeen[]> {
  const teens = await prisma.teen.findMany({
    where: { baseId: baseId ?? undefined, ...activeTeenFilter, ...teenGroupWhere(f) },
    select: { id: true, name: true, baseId: true, groupId: true, squadMemberships: { select: { groupId: true } } },
  });
  return teens.map((t) => ({ id: t.id, name: t.name, baseId: t.baseId, groupId: t.groupId, squadIds: t.squadMemberships.map((m) => m.groupId) }));
}

async function loadActivities({
  baseId,
  from,
  to,
  activityType,
  ...f
}: AnalyticsScope & { activityType?: string }): Promise<ContextActivity[]> {
  const activities = await prisma.activity.findMany({
    where: {
      baseId: baseId ?? undefined,
      type: activityType || undefined,
      date: { gte: from, lt: to },
      ...notDeleted(false),
      ...activityGroupWhere(f),
    },
    select: {
      id: true,
      name: true,
      type: true,
      date: true,
      baseId: true,
      groups: { select: { id: true } },
      teenParticipation: {
        where: { attended: true, ...(hasGroupFilter(f) ? { teen: teenGroupWhere(f) } : {}) },
        select: { teenId: true },
      },
      _count: { select: { teenParticipation: true } },
    },
    orderBy: { date: "asc" },
  });

  return activities.map((a) => ({
    id: a.id,
    name: a.name,
    type: a.type,
    date: a.date,
    baseId: a.baseId,
    groupIds: a.groups.map((g) => g.id),
    attendees: new Set(a.teenParticipation.map((p) => p.teenId)),
    recorded: a._count.teenParticipation > 0,
  }));
}

function isExpected(activity: ContextActivity, teen: RosterTeen) {
  if (activity.baseId && activity.baseId !== teen.baseId) return false;
  if (!activity.groupIds.length) return true;
  if (teen.groupId && activity.groupIds.includes(teen.groupId)) return true;
  return teen.squadIds.some((id) => activity.groupIds.includes(id));
}

function pct(numerator: number, denominator: number) {
  return denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : null;
}

export type AttendanceTrendPoint = {
  activityId: string;
  name: string;
  date: string;
  type: string;
  attended: number;
  expected: number;
  newCount: number;
  returningCount: number;
  rosterSize: number;
  recorded: boolean;
  rate: number | null;
};

export async function getAttendanceTrend(
  scope: AnalyticsScope & { activityType?: string },
): Promise<{
  points: AttendanceTrendPoint[];
  summary: { average: number; total: number; averageRate: number | null; recordedActivities: number; uniqueAttendees: number };
}> {
  const { baseId, activityType, from, ...f } = scope;
  const [activities, roster] = await Promise.all([loadActivities(scope), loadRoster(baseId, f)]);

  const empty = { average: 0, total: 0, averageRate: null, recordedActivities: 0, uniqueAttendees: 0 };
  if (!activities.length) return { points: [], summary: empty };

  // Every teen who attended before this range, so "first time" can be told apart from
  // "returning" without an N+1 query per activity.
  const priorAttended = await prisma.activityParticipation.findMany({
    where: {
      attended: true,
      activity: { baseId: baseId ?? undefined, type: activityType || undefined, date: { lt: from }, ...notDeleted(false) },
      ...(hasGroupFilter(f) ? { teen: teenGroupWhere(f) } : {}),
    },
    select: { teenId: true },
    distinct: ["teenId"],
  });
  const seen = new Set(priorAttended.map((p) => p.teenId));

  const unique = new Set<string>();
  const points: AttendanceTrendPoint[] = activities.map((activity) => {
    let newCount = 0;
    let returningCount = 0;
    for (const teenId of Array.from(activity.attendees)) {
      if (seen.has(teenId)) returningCount++;
      else newCount++;
      seen.add(teenId);
      unique.add(teenId);
    }
    const expectedTeens = roster.filter((t) => isExpected(activity, t));
    const attendedExpected = expectedTeens.filter((t) => activity.attendees.has(t.id)).length;
    return {
      activityId: activity.id,
      name: activity.name,
      date: activity.date.toISOString(),
      type: activity.type,
      attended: activity.attendees.size,
      expected: expectedTeens.length,
      newCount,
      returningCount,
      rosterSize: expectedTeens.length,
      recorded: activity.recorded,
      rate: activity.recorded ? pct(attendedExpected, expectedTeens.length) : null,
    };
  });

  // With a platoon/squad filter, activities in other bases have nobody expected and
  // nobody attending - drop them rather than plotting empty points.
  if (hasGroupFilter(f)) {
    for (let i = points.length - 1; i >= 0; i--) if (points[i].expected === 0 && points[i].attended === 0) points.splice(i, 1);
  }

  const recordedPoints = points.filter((p) => p.recorded);
  const total = recordedPoints.reduce((sum, p) => sum + p.attended, 0);
  const ratedPoints = recordedPoints.filter((p) => p.rate !== null);
  const averageRate = ratedPoints.length
    ? Math.round((ratedPoints.reduce((sum, p) => sum + (p.rate as number), 0) / ratedPoints.length) * 10) / 10
    : null;
  return {
    points,
    summary: {
      average: recordedPoints.length ? Math.round((total / recordedPoints.length) * 10) / 10 : 0,
      total,
      averageRate,
      recordedActivities: recordedPoints.length,
      uniqueAttendees: unique.size,
    },
  };
}

export type AttendanceByTypePoint = { type: string; average: number; activityCount: number; averageRate: number | null };

// Average attendance per Activity.type for the period - types come from the data
// itself (RefData keys are admin-editable, never hardcode a type list).
export async function getAttendanceByType(scope: AnalyticsScope): Promise<AttendanceByTypePoint[]> {
  const { points } = await getAttendanceTrend(scope);

  const byType = new Map<string, { total: number; count: number; rates: number[] }>();
  for (const p of points) {
    if (!p.recorded) continue;
    const entry = byType.get(p.type) ?? { total: 0, count: 0, rates: [] };
    entry.total += p.attended;
    entry.count += 1;
    if (p.rate !== null) entry.rates.push(p.rate);
    byType.set(p.type, entry);
  }

  return Array.from(byType.entries())
    .map(([type, { total, count, rates }]) => ({
      type,
      average: Math.round((total / count) * 10) / 10,
      activityCount: count,
      averageRate: rates.length ? Math.round((rates.reduce((s, r) => s + r, 0) / rates.length) * 10) / 10 : null,
    }))
    .sort((a, b) => b.average - a.average);
}

export type AttendanceDropoff = {
  priorCount: number;
  currentCount: number;
  droppedOffCount: number;
  droppedOffTeens: { id: string; name: string; lastAttended: string | null; missed: number }[];
  minMissed: number;
  currentRecordedActivities: number;
};

// "Needs follow-up" / dropped off. A teen is flagged when ALL of these hold:
//   1. they're on the active roster (and match any platoon/squad filter)
//   2. they have attended before (we look back up to LOOKBACK_DAYS before the period)
//   3. they missed their most recent MIN_MISSED+ *recorded* activities in a row that
//      they were expected at, up to the end of the selected period
//   4. at least one of those misses falls inside the selected period
// Activities with no attendance marked at all are ignored, so an unmarked Sunday
// doesn't make everyone look dropped off. The earlier "attended last period but not
// this one" rule missed teens who stopped coming more than one period ago and flagged
// everyone at the start of a month.
const MIN_MISSED = 3;
const LOOKBACK_DAYS = 180;

export async function getAttendanceDropoff({
  baseId,
  activityType,
  periodStart,
  periodEnd,
  ...f
}: GroupFilter & {
  baseId?: string | null;
  activityType?: string;
  periodStart: Date;
  periodEnd: Date;
}): Promise<AttendanceDropoff> {
  const lookbackStart = new Date(periodStart.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

  // The platoon/squad filter narrows *who* we look at, not which activities count: a
  // Lions teen who skipped Sundays but came to a squad rehearsal hasn't dropped off.
  const [activities, roster] = await Promise.all([
    loadActivities({ baseId, activityType, from: lookbackStart, to: periodEnd }),
    loadRoster(baseId, f),
  ]);

  const recorded = activities.filter((a) => a.recorded); // ascending by date
  const inPeriod = recorded.filter((a) => a.date >= periodStart);

  const dropped: AttendanceDropoff["droppedOffTeens"] = [];
  const attendedBefore = new Set<string>();
  const attendedInPeriod = new Set<string>();

  for (const teen of roster) {
    const expected = recorded.filter((a) => isExpected(a, teen));
    let streak = 0;
    let lastAttended: Date | null = null;
    for (let i = expected.length - 1; i >= 0; i--) {
      if (expected[i].attendees.has(teen.id)) {
        lastAttended = expected[i].date;
        break;
      }
      streak++;
    }
    if (lastAttended && lastAttended < periodStart) attendedBefore.add(teen.id);
    if (expected.some((a) => a.date >= periodStart && a.attendees.has(teen.id))) attendedInPeriod.add(teen.id);

    const latestMiss = streak > 0 ? expected[expected.length - 1].date : null;
    if (lastAttended && streak >= MIN_MISSED && latestMiss && latestMiss >= periodStart) {
      dropped.push({ id: teen.id, name: teen.name, lastAttended: lastAttended.toISOString(), missed: streak });
    }
  }
  dropped.sort((a, b) => b.missed - a.missed || a.name.localeCompare(b.name));

  return {
    priorCount: attendedBefore.size,
    currentCount: attendedInPeriod.size,
    droppedOffCount: dropped.length,
    droppedOffTeens: dropped.slice(0, 50),
    minMissed: MIN_MISSED,
    currentRecordedActivities: inPeriod.length,
  };
}

export type EngagementBucket = "Regular" | "Occasional" | "Rarely" | "Not seen" | "No activities yet";
export type Engagement = {
  buckets: { bucket: EngagementBucket; count: number }[];
  totalActive: number;
  notSeen: { id: string; name: string }[];
};

// Fixed order so the donut always maps bucket -> colour the same way.
const ENGAGEMENT_ORDER: EngagementBucket[] = ["Regular", "Occasional", "Rarely", "Not seen", "No activities yet"];

// How engaged the active roster has been in the period: each teen's share of the
// recorded activities they were expected at. Replaces the old "status breakdown"
// donut, which only reflected a rarely-edited status field (almost always ACTIVE).
export async function getEngagement(scope: AnalyticsScope & { activityType?: string }): Promise<Engagement> {
  // Group filter narrows the roster; every activity a teen was expected at still counts.
  const { platoonIds, squadIds, ...activityScope } = scope;
  const [activities, roster] = await Promise.all([loadActivities(activityScope), loadRoster(scope.baseId, { platoonIds, squadIds })]);
  const recorded = activities.filter((a) => a.recorded);

  const counts = new Map<EngagementBucket, number>();
  const notSeen: { id: string; name: string }[] = [];
  for (const teen of roster) {
    const expected = recorded.filter((a) => isExpected(a, teen));
    let bucket: EngagementBucket;
    if (!expected.length) bucket = "No activities yet";
    else {
      const share = expected.filter((a) => a.attendees.has(teen.id)).length / expected.length;
      if (share >= 0.75) bucket = "Regular";
      else if (share >= 0.25) bucket = "Occasional";
      else if (share > 0) bucket = "Rarely";
      else bucket = "Not seen";
    }
    if (bucket === "Not seen") notSeen.push({ id: teen.id, name: teen.name });
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  return {
    buckets: ENGAGEMENT_ORDER.filter((b) => counts.has(b)).map((bucket) => ({ bucket, count: counts.get(bucket) ?? 0 })),
    totalActive: roster.length,
    notSeen: notSeen.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 50),
  };
}

export type MembershipGrowth = {
  trend: { month: string; added: number; total: number }[];
  statusSnapshot: { status: string; count: number }[];
};

// `added` = teens who joined in the month; `total` = members on the books at the end
// of that month (joined by then, not deleted, not LEFT). Join date falls back to the
// record's creation date for teens imported without a dateJoined.
export async function getMembershipGrowth({ baseId, from, to, ...f }: AnalyticsScope): Promise<MembershipGrowth> {
  const [teens, statusGroups] = await Promise.all([
    prisma.teen.findMany({
      where: { baseId: baseId ?? undefined, status: { not: "LEFT" }, ...notDeleted(false), ...teenGroupWhere(f) },
      select: { dateJoined: true, createdAt: true },
    }),
    prisma.teen.groupBy({
      by: ["status"],
      where: { baseId: baseId ?? undefined, ...notDeleted(false), ...teenGroupWhere(f) },
      _count: { _all: true },
    }),
  ]);

  const joinDates = teens.map((t) => t.dateJoined ?? t.createdAt);
  const trend = enumerateMonths(from, to).map((month) => {
    const [y, m] = month.split("-").map(Number);
    const monthStart = new Date(Date.UTC(y, m - 1, 1));
    const monthEnd = new Date(Date.UTC(y, m, 1));
    return {
      month,
      added: joinDates.filter((d) => d >= monthStart && d < monthEnd && d >= from && d < to).length,
      total: joinDates.filter((d) => d < monthEnd).length,
    };
  });
  const statusSnapshot = statusGroups.map((g) => ({ status: g.status, count: g._count._all }));

  return { trend, statusSnapshot };
}

export type GroupBreakdown = {
  platoons: { groupId: string; name: string; teenCount: number }[];
  squads: { groupId: string; name: string; teenCount: number }[];
  attendanceByPlatoon: { groupId: string; name: string; attended: number; rate: number | null }[];
};

// Platoon comparison uses turnout % (attended / expected across recorded activities),
// not raw attendance totals - a raw sum just ranks platoons by size.
export async function getGroupBreakdown({ baseId, from, to }: DateRange): Promise<GroupBreakdown> {
  const [platoons, squads, activities, roster] = await Promise.all([
    prisma.group.findMany({
      where: { type: "PLATOON", baseId: baseId ?? undefined, ...notDeleted(false) },
      select: { id: true, name: true, teens: { where: activeTeenFilter, select: { id: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.group.findMany({
      where: { type: "SQUAD", baseId: baseId ?? undefined, ...notDeleted(false) },
      select: { id: true, name: true, members: { where: { teen: activeTeenFilter }, select: { id: true } } },
      orderBy: { name: "asc" },
    }),
    loadActivities({ baseId, from, to }),
    loadRoster(baseId, {}),
  ]);

  const recorded = activities.filter((a) => a.recorded);
  const byPlatoon = new Map<string, { attended: number; expected: number }>();
  for (const teen of roster) {
    if (!teen.groupId) continue;
    const entry = byPlatoon.get(teen.groupId) ?? { attended: 0, expected: 0 };
    for (const a of recorded) {
      if (!isExpected(a, teen)) continue;
      entry.expected += 1;
      if (a.attendees.has(teen.id)) entry.attended += 1;
    }
    byPlatoon.set(teen.groupId, entry);
  }

  return {
    platoons: platoons.map((g) => ({ groupId: g.id, name: g.name, teenCount: g.teens.length })),
    squads: squads.map((g) => ({ groupId: g.id, name: g.name, teenCount: g.members.length })),
    attendanceByPlatoon: platoons.map((g) => {
      const entry = byPlatoon.get(g.id) ?? { attended: 0, expected: 0 };
      return { groupId: g.id, name: g.name, attended: entry.attended, rate: pct(entry.attended, entry.expected) };
    }),
  };
}


export type TeenDemographics = {
  genderBreakdown: { gender: string; count: number }[];
  ageBreakdown: { bucket: string; count: number }[];
  totalActive: number;
};

// "unknown" is strictly for a missing DOB - a known age outside the expected
// 10-18 teen range gets its own bucket (under-10 / 19+) rather than being folded
// into "unknown", which would conflate a real age with missing data.
const AGE_BUCKETS = ["under 10", "10-12", "13-15", "16-18", "19+", "unknown"] as const;

// Fixed order so the demographic donut maps gender → colour by known label, not by
// data arrival order (chartTheme's rule): Male is always slot 0 (blue), Female slot 1
// (pink). normalizeGender only ever yields these two values.
const GENDER_ORDER = ["Male", "Female"] as const;

function ageBucket(dateOfBirth: Date | null): (typeof AGE_BUCKETS)[number] {
  if (!dateOfBirth) return "unknown";
  const age = calculateAge(dateOfBirth);
  if (age < 10) return "under 10";
  if (age <= 12) return "10-12";
  if (age <= 15) return "13-15";
  if (age <= 18) return "16-18";
  return "19+";
}

// Over active teens for the base - counts must sum to the active roster, and
// unknown-DOB teens get their own bucket rather than being silently dropped.
export async function getTeenDemographics({ baseId, ...f }: { baseId?: string | null } & GroupFilter): Promise<TeenDemographics> {
  const teens = await prisma.teen.findMany({
    where: { baseId: baseId ?? undefined, ...activeTeenFilter, ...teenGroupWhere(f) },
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
    genderBreakdown: GENDER_ORDER.filter((g) => byGender.has(g)).map((gender) => ({ gender, count: byGender.get(gender) ?? 0 })),
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
