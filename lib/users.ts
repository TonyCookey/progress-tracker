import { prisma } from "@/lib/prisma";
import { notDeleted } from "@/lib/softDelete";

export function getUsers(includeArchived = false) {
  return prisma.user.findMany({
    where: notDeleted(includeArchived),
    include: { base: true },
  });
}
