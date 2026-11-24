import { NextResponse } from "next/server";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { getNewConvertFunnel } from "@/lib/analytics";
import { dateRangeSchema, resolveDateRange } from "@/lib/validation/analytics";
import { parseOrThrow } from "@/lib/validation/parse";

// Reads the session (headers), so it must never be prerendered at build time.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const query = parseOrThrow(dateRangeSchema, Object.fromEntries(searchParams));

    let baseId = query.baseId ?? null;
    if (session.user.role !== "SUPERADMIN") baseId = session.user.baseId;
    if (baseId) assertBaseAccess(session, baseId);

    const { from, to } = resolveDateRange(query);
    const result = await getNewConvertFunnel({ baseId, from, to });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
