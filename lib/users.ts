import { prisma } from "@/lib/prisma";

export function getUsers() {
  return prisma.user.findMany({
    include: { base: true },
  });
}
