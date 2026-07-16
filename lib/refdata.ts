import { prisma } from "@/lib/prisma";

export function getRefData(category: string, includeInactive = false) {
  return prisma.refData.findMany({
    where: { category, ...(includeInactive ? {} : { active: true }) },
    orderBy: { sortOrder: "asc" },
  });
}

export async function nextSortOrder(category: string) {
  const last = await prisma.refData.findFirst({
    where: { category },
    orderBy: { sortOrder: "desc" },
  });
  return (last?.sortOrder ?? -1) + 1;
}

export function slugifyKey(label: string) {
  return label
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}
