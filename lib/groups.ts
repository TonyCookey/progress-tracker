import { GroupType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/softDelete";

export function getGroups(type: GroupType, includeArchived = false) {
  return prisma.group.findMany({
    where: { type: type ?? "SQUAD", ...notDeleted(includeArchived) },
    include: { leader: true, base: true },
  });
}
