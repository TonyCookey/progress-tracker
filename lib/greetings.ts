import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email";
import { birthdayEmail, anniversaryEmail } from "@/lib/emailTemplates";

const TIMEZONE = process.env.APP_TIMEZONE || "Africa/Lagos";

// Today's calendar date in the ministry's timezone (not the server's — Vercel runs in UTC).
function todayParts(now = new Date()) {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(now)
    .split("-")
    .map(Number);
  return { year, month, day };
}

const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

// Dates are stored at UTC midnight, so read them in UTC. Feb 29 is observed on Mar 1 in
// non-leap years (same rule as getUpcomingBirthdays).
function occursToday(stored: Date, today: { year: number; month: number; day: number }) {
  let month = stored.getUTCMonth() + 1;
  let day = stored.getUTCDate();
  if (month === 2 && day === 29 && !isLeap(today.year)) {
    month = 3;
    day = 1;
  }
  return month === today.month && day === today.day;
}

export type GreetingResult = { configured: boolean; birthdays: number; anniversaries: number; failed: number };

export async function sendTodaysGreetings(now = new Date()): Promise<GreetingResult> {
  if (!isEmailConfigured()) return { configured: false, birthdays: 0, anniversaries: 0, failed: 0 };

  const today = todayParts(now);
  const generals = await prisma.user.findMany({
    where: {
      deletedAt: null,
      role: { in: ["SUPERADMIN", "GENERAL", "COLONEL", "VOLUNTEER"] },
      OR: [{ dateOfBirth: { not: null } }, { anniversaryDate: { not: null } }],
    },
    select: { name: true, email: true, dateOfBirth: true, anniversaryDate: true },
  });

  const result: GreetingResult = { configured: true, birthdays: 0, anniversaries: 0, failed: 0 };

  for (const g of generals) {
    if (g.dateOfBirth && occursToday(g.dateOfBirth, today)) {
      try {
        await sendEmail({ to: g.email, ...birthdayEmail(g.name) });
        result.birthdays++;
      } catch {
        result.failed++;
      }
    }
    if (g.anniversaryDate && occursToday(g.anniversaryDate, today)) {
      const years = today.year - g.anniversaryDate.getUTCFullYear();
      try {
        await sendEmail({ to: g.email, ...anniversaryEmail(g.name, years) });
        result.anniversaries++;
      } catch {
        result.failed++;
      }
    }
  }

  return result;
}
