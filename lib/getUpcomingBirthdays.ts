import { prisma } from "@/lib/prisma";

export async function getUpcomingBirthdays() {
  const teens = await prisma.$queryRawUnsafe(`
    SELECT 
      t.id, 
      t.name, 
      t."dateOfBirth",
      b.name AS "baseName",
      EXTRACT(DAY FROM (t."dateOfBirth" - CURRENT_DATE)) AS "daysToBirthday",
      CASE
        WHEN EXTRACT(DOY FROM t."dateOfBirth") >= EXTRACT(DOY FROM CURRENT_DATE) 
        THEN EXTRACT(DOY FROM t."dateOfBirth") - EXTRACT(DOY FROM CURRENT_DATE)
        ELSE 365 - EXTRACT(DOY FROM CURRENT_DATE) + EXTRACT(DOY FROM t."dateOfBirth")
      END AS "daysToNextBirthday"
    FROM "Teen" t
    JOIN "Base" b ON t."baseId" = b.id
    WHERE 
      t."dateOfBirth" IS NOT NULL
      AND (
        (EXTRACT(DOY FROM t."dateOfBirth") - EXTRACT(DOY FROM CURRENT_DATE)) BETWEEN 0 AND 30
        OR 
        (EXTRACT(DOY FROM t."dateOfBirth") + (365 * (CASE WHEN EXTRACT(DOY FROM t."dateOfBirth") < EXTRACT(DOY FROM CURRENT_DATE) THEN 1 ELSE 0 END)) - EXTRACT(DOY FROM CURRENT_DATE)) BETWEEN 0 AND 30
      )
    ORDER BY EXTRACT(DOY FROM t."dateOfBirth")
  `);

  const generals = await prisma.$queryRawUnsafe(`
    SELECT 
      u.id, 
      u.name, 
      u."dateOfBirth",
      b.name AS "baseName",
      EXTRACT(DAY FROM (u."dateOfBirth" - CURRENT_DATE)) AS "daysToBirthday",
      CASE
        WHEN EXTRACT(DOY FROM u."dateOfBirth") >= EXTRACT(DOY FROM CURRENT_DATE) 
        THEN EXTRACT(DOY FROM u."dateOfBirth") - EXTRACT(DOY FROM CURRENT_DATE)
        ELSE 365 - EXTRACT(DOY FROM CURRENT_DATE) + EXTRACT(DOY FROM u."dateOfBirth")
      END AS "daysToNextBirthday"
    FROM "User" u
    JOIN "Base" b ON u."baseId" = b.id
    WHERE 
      u."role" IN ('GENERAL', 'COLONEL', 'VOLUNTEER')
      AND u."dateOfBirth" IS NOT NULL
      AND (
        (EXTRACT(DOY FROM u."dateOfBirth") - EXTRACT(DOY FROM CURRENT_DATE)) BETWEEN 0 AND 30
        OR 
        (EXTRACT(DOY FROM u."dateOfBirth") + (365 * (CASE WHEN EXTRACT(DOY FROM u."dateOfBirth") < EXTRACT(DOY FROM CURRENT_DATE) THEN 1 ELSE 0 END)) - EXTRACT(DOY FROM CURRENT_DATE)) BETWEEN 0 AND 30
      )
    ORDER BY EXTRACT(DOY FROM u."dateOfBirth")
  `);

  return { generals, teens };
}
