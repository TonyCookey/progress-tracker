import { NextResponse } from "next/server";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { getTeenDemographics } from "@/lib/analytics";
import { z } from "zod";
import { parseOrThrow } from "@/lib/validation/parse";

const demographicsQuerySchema = z.object({ baseId: z.string().optional().nullable() });

export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const query = parseOrThrow(demographicsQuerySchema, Object.fromEntries(searchParams));

    let baseId = query.baseId ?? null;
    if (session.user.role !== "SUPERADMIN") baseId = session.user.baseId;
    if (baseId) assertBaseAccess(session, baseId);

    const result = await getTeenDemographics({ baseId });
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}
