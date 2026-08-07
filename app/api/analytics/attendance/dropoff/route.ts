import { NextResponse } from "next/server";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { getAttendanceDropoff } from "@/lib/analytics";
import { dropoffQuerySchema } from "@/lib/validation/analytics";
import { parseOrThrow } from "@/lib/validation/parse";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const query = parseOrThrow(dropoffQuerySchema, Object.fromEntries(searchParams));

    let baseId = query.baseId ?? null;
    if (session.user.role !== "SUPERADMIN") baseId = session.user.baseId;
    if (baseId) assertBaseAccess(session, baseId);

    const result = await getAttendanceDropoff({
      baseId,
      activityType: query.activityType,
      periodStart: query.periodStart,
      periodEnd: query.periodEnd,
    });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
