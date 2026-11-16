import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createOfferingSchema } from "@/lib/validation/offering";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export async function GET(req: Request) {
  try {
    const session = await requireSession();

    const { searchParams } = new URL(req.url);
    const pageParam = parseInt(searchParams.get("page") ?? "1");
    const limitParam = parseInt(searchParams.get("limit") ?? "10");
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 10;
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    // "" = all bases, "cross-base" = offerings not tied to a base. Non-superadmins are
    // always pinned to their own base.
    const requestedBaseId = (searchParams.get("baseId") ?? "").trim();
    const baseId = session.user.role === "SUPERADMIN" ? requestedBaseId : session.user.baseId;
    const type = searchParams.get("type") || undefined;
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const dateFilter =
      from || to
        ? { date: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lt: new Date(new Date(to).getTime() + 24 * 60 * 60 * 1000) } : {}) } }
        : {};
    const includeArchived = searchParams.get("includeArchived") === "true";

    const skip = (page - 1) * limit;

    const where = {
      service: {
        contains: search,
        mode: "insensitive" as const,
      },
      baseId: baseId === "cross-base" ? null : baseId ? baseId : undefined,
      type,
      ...dateFilter,
      ...notDeleted(includeArchived),
    };

    const [offerings, total, sum] = await Promise.all([
      prisma.offering.findMany({
        where,
        include: { base: true },
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.offering.count({ where }),
      prisma.offering.aggregate({ where, _sum: { amount: true } }),
    ]);
    return NextResponse.json({ offerings, total, totalAmount: Number(sum._sum.amount ?? 0) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = parseOrThrow(createOfferingSchema, await req.json());

    const isCrossBase = body.baseId === "cross-base" ? true : (body.isCrossBase ?? false);
    const baseId = isCrossBase ? null : body.baseId;

    assertBaseAccess(session, isCrossBase ? null : baseId);

    const { service, amount, date, notes, type } = body;

    const offering = await prisma.offering.create({
      data: {
        service,
        amount,
        date,
        notes,
        type,
        baseId,
        isCrossBase,
      },
    });

    return NextResponse.json(offering);
  } catch (error) {
    return handleApiError(error);
  }
}
