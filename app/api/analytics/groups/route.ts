import { NextResponse } from "next/server";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { getGroupBreakdown, getTeachingRateComparison } from "@/lib/analytics";
import { groupsQuerySchema } from "@/lib/validation/analytics";
import { parseOrThrow } from "@/lib/validation/parse";

// Attendance-by-platoon needs a bounded window (it joins participation rows in JS);
// default to the last 3 months rather than year-to-date if the caller omits from/to.
function resolveGroupsRange(input: { from?: Date; to?: Date }) {
  const to = input.to ?? new Date();
  const from = input.from ?? new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth() - 3, to.getUTCDate()));
  return { from, to };
}

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const query = parseOrThrow(groupsQuerySchema, Object.fromEntries(searchParams));

    let baseId = query.baseId ?? null;
    if (session.user.role !== "SUPERADMIN") baseId = session.user.baseId;
    if (baseId) assertBaseAccess(session, baseId);

    const { from, to } = resolveGroupsRange(query);
    const [result, teachingRates] = await Promise.all([
      getGroupBreakdown({ baseId, from, to }),
      getTeachingRateComparison({ baseId, from, to }),
    ]);
    return NextResponse.json({ ...result, teachingRates });
  } catch (error) {
    return handleApiError(error);
  }
}
