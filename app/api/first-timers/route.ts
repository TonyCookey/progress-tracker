import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createFirstTimerSchema } from "@/lib/validation/firstTimer";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") ?? "10") || 10));
    const search = searchParams.get("search") ?? "";
    const requestedBaseId = searchParams.get("baseId") ?? "";
    const includeArchived = searchParams.get("includeArchived") === "true";

    // Non-SUPERADMIN users only ever see their own base.
    const baseId = session.user.role === "SUPERADMIN" ? requestedBaseId : session.user.baseId;

    const where = {
      baseId: baseId ? baseId : undefined,
      name: { contains: search, mode: "insensitive" as const },
      ...notDeleted(includeArchived),
    };

    const [data, total] = await Promise.all([
      prisma.firstTimer.findMany({
        where,
        include: { base: { select: { id: true, name: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { visitDate: "desc" },
      }),
      prisma.firstTimer.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = parseOrThrow(createFirstTimerSchema, await req.json());
    assertBaseAccess(session, body.baseId);

    const firstTimer = await prisma.firstTimer.create({ data: body });
    return NextResponse.json(firstTimer, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
