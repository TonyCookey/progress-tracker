import type { TeenStatus } from "@prisma/client";

// Statuses that take a teen off the current roster: they no longer count towards
// membership, attendance rosters or group sizes, but all their history is kept.
export const OFF_ROSTER_STATUSES: TeenStatus[] = ["LEFT", "GRADUATED"];

export const TEEN_STATUS_LABEL: Record<TeenStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  LEFT: "Left",
  GRADUATED: "Graduated",
};

/** Prisma `where` fragment: teens still on the roster (any status but Left/Graduated). */
export const onRosterWhere = { deletedAt: null, status: { notIn: OFF_ROSTER_STATUSES } };

/** Status update + matching graduation fields, so the two never drift apart. */
export function statusChange(next: TeenStatus | undefined, current: { status: TeenStatus; graduatedAt: Date | null }) {
  if (!next || next === current.status) return {};
  if (next === "GRADUATED") return { status: next, graduatedAt: current.graduatedAt ?? new Date() };
  return { status: next, graduatedAt: null, graduationNote: null };
}
