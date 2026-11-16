import { NextResponse } from "next/server";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { getEngagement } from "@/lib/analytics";
import { attendanceQuerySchema, resolveDateRange } from "@/lib/validation/analytics";
import { parseOrThrow } from "@/lib/validation/parse";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const query = parseOrThrow(attendanceQuerySchema, Object.fromEntries(searchParams));

    let baseId = query.baseId ?? null;
    if (session.user.role !== "SUPERADMIN") baseId = session.user.baseId;
    if (baseId) assertBaseAccess(session, baseId);

    const { from, to } = resolveDateRange(query);
    const result = await getEngagement({
      baseId,
      from,
      to,
      activityType: query.activityType,
      platoonIds: query.platoonIds,
      squadIds: query.squadIds,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
