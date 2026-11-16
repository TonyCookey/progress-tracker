import { GroupType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/softDelete";
import { safeUserSelect } from "@/lib/users";

export function getGroups(type: GroupType, includeArchived = false) {
  return prisma.group.findMany({
    where: { type: type ?? "SQUAD", ...notDeleted(includeArchived) },
    include: {
      leader: { select: safeUserSelect },
      base: true,
      // ACTIVE only, matching the analytics roster so "12 members" agrees everywhere.
      _count: {
        select: {
          teens: { where: { deletedAt: null, status: "ACTIVE" } },
          members: { where: { teen: { deletedAt: null, status: "ACTIVE" } } },
        },
      },
    },
    orderBy: { name: "asc" },
  });
}
