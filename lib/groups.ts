import { GroupType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/softDelete";
import { safeUserSelect } from "@/lib/users";

export function getGroups(type: GroupType, includeArchived = false) {
  return prisma.group.findMany({
    where: { type: type ?? "SQUAD", ...notDeleted(includeArchived) },
    include: { leader: { select: safeUserSelect }, base: true },
  });
}
