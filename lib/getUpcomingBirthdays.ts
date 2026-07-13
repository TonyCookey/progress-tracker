import { prisma } from "@/lib/prisma";

// Computes the next occurrence of each person's birthday relative to today.
// Feb 29 birthdays are observed on Mar 1 in non-leap years so everyone gets
// exactly one birthday per year. Wraps into next year when this year's date
// has already passed.
function nextBirthdayExpr(dobColumn: string) {
  // make_date throws for Feb 29 in a non-leap year, so build it defensively
  // with a CASE that falls back to Mar 1 of the current (non-leap) year.
  return `
    CASE
      WHEN EXTRACT(MONTH FROM ${dobColumn}) = 2 AND EXTRACT(DAY FROM ${dobColumn}) = 29
        AND NOT (EXTRACT(YEAR FROM CURRENT_DATE)::int % 4 = 0 AND (EXTRACT(YEAR FROM CURRENT_DATE)::int % 100 != 0 OR EXTRACT(YEAR FROM CURRENT_DATE)::int % 400 = 0))
      THEN make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, 3, 1)
      ELSE make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, EXTRACT(MONTH FROM ${dobColumn})::int, EXTRACT(DAY FROM ${dobColumn})::int)
    END
  `;
}

function nextOccurrenceExpr(dobColumn: string) {
  const thisYear = nextBirthdayExpr(dobColumn);
  return `
    CASE
      WHEN ${thisYear} >= CURRENT_DATE THEN ${thisYear}
      ELSE ${thisYear} + INTERVAL '1 year'
    END
  `;
}

export async function getUpcomingBirthdays() {
  const nextTeenBirthday = nextOccurrenceExpr(`t."dateOfBirth"`);
  const nextGeneralBirthday = nextOccurrenceExpr(`u."dateOfBirth"`);

  const teens = await prisma.$queryRawUnsafe(`
    SELECT
      t.id,
      t.name,
      t."dateOfBirth",
      t."gender",
      t."rank",
      b.name AS "baseName",
      (${nextTeenBirthday})::date AS "nextBirthday",
      (${nextTeenBirthday}::date - CURRENT_DATE) AS "daysToNextBirthday"
    FROM "Teen" t
    JOIN "Base" b ON t."baseId" = b.id
    WHERE
      t."dateOfBirth" IS NOT NULL
      AND (${nextTeenBirthday}::date - CURRENT_DATE) BETWEEN 0 AND 30
    ORDER BY "nextBirthday"
  `);

  const generals = await prisma.$queryRawUnsafe(`
    SELECT
      u.id,
      u.name,
      u."dateOfBirth",
      b.name AS "baseName",
      (${nextGeneralBirthday})::date AS "nextBirthday",
      (${nextGeneralBirthday}::date - CURRENT_DATE) AS "daysToNextBirthday"
    FROM "User" u
    JOIN "Base" b ON u."baseId" = b.id
    WHERE
      u."role" IN ('GENERAL', 'COLONEL', 'VOLUNTEER')
      AND u."dateOfBirth" IS NOT NULL
      AND (${nextGeneralBirthday}::date - CURRENT_DATE) BETWEEN 0 AND 30
    ORDER BY "nextBirthday"
  `);

  return { generals, teens };
}
