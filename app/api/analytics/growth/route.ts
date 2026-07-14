import { NextResponse } from "next/server";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { getMembershipGrowth } from "@/lib/analytics";
import { dateRangeSchema, resolveDateRange } from "@/lib/validation/analytics";
import { parseOrThrow } from "@/lib/validation/parse";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const query = parseOrThrow(dateRangeSchema, Object.fromEntries(searchParams));

    let baseId = query.baseId ?? null;
    if (session.user.role !== "SUPERADMIN") baseId = session.user.baseId;
    if (baseId) assertBaseAccess(session, baseId);

    const { from, to } = resolveDateRange(query);
    const result = await getMembershipGrowth({ baseId, from, to });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
