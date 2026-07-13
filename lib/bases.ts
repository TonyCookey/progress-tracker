import { prisma } from "@/lib/prisma";

export function getBases() {
  return prisma.base.findMany({});
}
