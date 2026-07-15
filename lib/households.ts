import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/softDelete";

export function getHouseholds(includeArchived = false) {
  return prisma.household.findMany({
    where: { ...notDeleted(includeArchived) },
    include: {
      base: true,
      teens: { where: notDeleted(includeArchived) },
    },
    orderBy: { name: "asc" },
  });
}
