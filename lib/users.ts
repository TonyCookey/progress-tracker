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
