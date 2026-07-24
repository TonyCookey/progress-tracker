import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/auth";

// Verifies that a set of Group ids exist and all belong to `baseId`, so a
// caller can't connect a teen/activity to another base's squads/platoon.
export async function assertGroupsInBase(groupIds: string[], baseId: string, field = "groupIds") {
  if (groupIds.length === 0) return;
  const groups = await prisma.group.findMany({ where: { id: { in: groupIds } }, select: { id: true, baseId: true } });
  const found = new Map(groups.map((g) => [g.id, g.baseId]));
  for (const id of groupIds) {
    const groupBaseId = found.get(id);
    if (!groupBaseId) throw new ApiError(400, "Invalid group", { [field]: [`Group ${id} not found`] });
    if (groupBaseId !== baseId) throw new ApiError(400, "Group belongs to a different base", { [field]: [`Group ${id} belongs to a different base`] });
  }
}

// Verifies that a set of Group ids simply exist (no base constraint), for
// cross-base activities that may legitimately span groups from multiple bases —
// still catches a bad/deleted id before it 500s in a Prisma connect.
export async function assertGroupsExist(groupIds: string[], field = "groupIds") {
  if (groupIds.length === 0) return;
  const groups = await prisma.group.findMany({ where: { id: { in: groupIds } }, select: { id: true } });
  const found = new Set(groups.map((g) => g.id));
  for (const id of groupIds) {
    if (!found.has(id)) throw new ApiError(400, "Invalid group", { [field]: [`Group ${id} not found`] });
  }
}

// Verifies that a set of User ids exist and all belong to `baseId`, so a
// caller can't assign a leader/support general from another base.
export async function assertUsersInBase(userIds: string[], baseId: string, field = "userIds") {
  if (userIds.length === 0) return;
  const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, baseId: true } });
  const found = new Map(users.map((u) => [u.id, u.baseId]));
  for (const id of userIds) {
    const userBaseId = found.get(id);
    if (!userBaseId) throw new ApiError(400, "Invalid user", { [field]: [`User ${id} not found`] });
    if (userBaseId !== baseId) throw new ApiError(400, "User belongs to a different base", { [field]: [`User ${id} belongs to a different base`] });
  }
}
