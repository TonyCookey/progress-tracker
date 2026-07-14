import { NextResponse } from "next/server";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { getOfferingsTrend, getOfferingsTrendByBase, getOfferingsByService } from "@/lib/analytics";
import { offeringsQuerySchema, resolveDateRange } from "@/lib/validation/analytics";
import { parseOrThrow } from "@/lib/validation/parse";

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const query = parseOrThrow(offeringsQuerySchema, Object.fromEntries(searchParams));

    let baseId = query.baseId ?? null;
    if (session.user.role !== "SUPERADMIN") baseId = session.user.baseId;
    if (baseId) assertBaseAccess(session, baseId);

    const { from, to } = resolveDateRange(query);

    if (query.by === "service") {
      const byService = await getOfferingsByService({ baseId, from, to });
      return NextResponse.json({ byService });
    }

    const trend = await getOfferingsTrend({ baseId, from, to });
    if (query.groupByBase && session.user.role === "SUPERADMIN" && !baseId) {
      const byBase = await getOfferingsTrendByBase({ from, to });
      return NextResponse.json({ trend, byBase });
    }
    return NextResponse.json({ trend });
  } catch (error) {
    return handleApiError(error);
  }
}
