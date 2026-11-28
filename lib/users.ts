import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/softDelete";

// Excludes the bcrypt `password` hash — every route that returns User records
// to the client must select through this instead of a bare findMany/include.
export const safeUserSelect = {
  id: true,
  name: true,
  username: true,
  email: true,
  dateOfBirth: true,
  anniversaryDate: true,
  gender: true,
  role: true,
  baseId: true,
  base: true,
  imageKey: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
} as const;

export function getUsers(includeArchived = false) {
  return prisma.user.findMany({
    where: notDeleted(includeArchived),
    select: safeUserSelect,
  });
}

// Emails are stored as typed (older rows may have capitals or stray spaces), and phone
// keyboards often auto-capitalise the first letter. Normalise on write, and match
// case-insensitively on read so sign-in / reset never fail over letter case.
export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email.trim(), mode: "insensitive" } },
    orderBy: { createdAt: "asc" },
  });
}
