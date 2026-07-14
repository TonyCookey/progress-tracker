import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/softDelete";

export type MonthlyReportData = {
  baseId: string;
  month: number;
  year: number;
  membership: number;
  sundayAttendance: { activityId: string; date: string; count: number }[];
  offeringsTotal: { cash: number; online: number; total: number };
  newConverts: { count: number; list: { id: string; name: string; date: string }[] };
};

/**
 * Auto-computed (app-owned) figures for a base's monthly report. Official report
 * income/opening/closing figures are entered separately from the bank statement
 * (see MonthlyReport.income/openingBalance/expenseItems) - this only aggregates
 * what the app itself records.
 */
export async function getMonthlyReport({ baseId, month, year }: { baseId: string; month: number; year: number }): Promise<MonthlyReportData> {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));

  const [membership, sundayActivities, offerings, newConverts] = await Promise.all([
    prisma.teen.count({
      where: { baseId, status: "ACTIVE", ...notDeleted(false) },
    }),
    prisma.activity.findMany({
      where: {
        baseId,
        type: "Sunday Service",
        date: { gte: start, lt: end },
        ...notDeleted(false),
      },
      include: {
        teenParticipation: { where: { attended: true } },
      },
      orderBy: { date: "asc" },
    }),
    // Cross-base offerings (baseId null) aren't attributed to a single base's report.
    prisma.offering.findMany({
      where: { baseId, date: { gte: start, lt: end }, ...notDeleted(false) },
    }),
    prisma.newConvert.findMany({
      where: { baseId, date: { gte: start, lt: end }, ...notDeleted(false) },
      orderBy: { date: "asc" },
    }),
  ]);

  const sundayAttendance = sundayActivities.map((activity) => ({
    activityId: activity.id,
    date: activity.date.toISOString(),
    count: activity.teenParticipation.length,
  }));

  const cash = offerings.filter((o) => o.type === "Cash").reduce((sum, o) => sum + Number(o.amount), 0);
  const online = offerings.filter((o) => o.type === "Online").reduce((sum, o) => sum + Number(o.amount), 0);

  return {
    baseId,
    month,
    year,
    membership,
    sundayAttendance,
    offeringsTotal: { cash, online, total: cash + online },
    newConverts: {
      count: newConverts.length,
      list: newConverts.map((nc) => ({ id: nc.id, name: nc.name, date: nc.date.toISOString() })),
    },
  };
}
