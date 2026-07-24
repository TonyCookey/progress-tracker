// lib/prisma.ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Query logging is dev-only — in production it floods function logs (and can
    // surface filter values like emails in WHERE clauses). Keep errors in prod.
    log: process.env.NODE_ENV === "production" ? ["error"] : ["query", "error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
