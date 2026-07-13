import { GroupType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export function getGroups(type: GroupType) {
  return prisma.group.findMany({
    where: { type: type ?? "SQUAD" },
    include: { leader: true, base: true },
  });
}
