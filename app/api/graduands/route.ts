import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, handleApiError, ApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";
import { graduateTeensSchema } from "@/lib/validation/graduation";

export const dynamic = "force-dynamic";

// GET ?year=2026&baseId=&search=&page=&limit= -> graduated teens, newest first, plus
// per-year totals for the year picker / summary tiles.
export async function GET(req: Request) {
  try {
    const session = await requireSession();
    const { searchParams } = new URL(req.url);
    const isSuperAdmin = session.user.role === "SUPERADMIN";
    const baseId = isSuperAdmin ? (searchParams.get("baseId") ?? "").trim() || undefined : session.user.baseId;
    const yearParam = parseInt(searchParams.get("year") ?? "");
    const year = Number.isFinite(yearParam) ? yearParam : null;
    const search = (searchParams.get("search") ?? "").trim();
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "25") || 25));

    const scope: Prisma.TeenWhereInput = { deletedAt: null, status: "GRADUATED", baseId };
    const where: Prisma.TeenWhereInput = {
      ...scope,
      ...(year ? { graduatedAt: { gte: new Date(Date.UTC(year, 0, 1)), lt: new Date(Date.UTC(year + 1, 0, 1)) } } : {}),
      ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
    };

    const [data, total, allDates] = await Promise.all([
      prisma.teen.findMany({
        where,
        select: {
          id: true,
          name: true,
          gender: true,
          rank: true,
          dateOfBirth: true,
          dateJoined: true,
          createdAt: true,
          graduatedAt: true,
          graduationNote: true,
          imageKey: true,
          base: { select: { id: true, name: true } },
          platoon: { select: { id: true, name: true } },
        },
        orderBy: [{ graduatedAt: { sort: "desc", nulls: "last" } }, { name: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.teen.count({ where }),
      prisma.teen.findMany({ where: scope, select: { graduatedAt: true } }),
    ]);

    const byYear = new Map<number, number>();
    for (const { graduatedAt } of allDates) {
      if (graduatedAt) byYear.set(graduatedAt.getUTCFullYear(), (byYear.get(graduatedAt.getUTCFullYear()) ?? 0) + 1);
    }
    const years = Array.from(byYear, ([y, count]) => ({ year: y, count })).sort((a, b) => b.year - a.year);

    return NextResponse.json({ data, total, totalAllTime: allDates.length, years, page, totalPages: Math.max(1, Math.ceil(total / limit)) });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST { teenIds, graduatedAt?, note? } -> graduates every listed on-roster teen.
export async function POST(req: Request) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);
    const { teenIds, graduatedAt, note } = parseOrThrow(graduateTeensSchema, await req.json());

    const teens = await prisma.teen.findMany({ where: { id: { in: teenIds }, deletedAt: null }, select: { id: true, baseId: true, status: true } });
    if (teens.length !== new Set(teenIds).size) throw new ApiError(404, "Some of these teens couldn't be found");
    if (session.user.role !== "SUPERADMIN" && teens.some((t) => t.baseId !== session.user.baseId)) {
      throw new ApiError(403, "You can only graduate teens in your own base");
    }

    const when = graduatedAt ?? new Date();
    if (when.getTime() > Date.now() + 24 * 3_600_000) throw new ApiError(400, "Graduation date can't be in the future");

    const toGraduate = teens.filter((t) => t.status !== "GRADUATED").map((t) => t.id);
    const { count } = await prisma.teen.updateMany({
      where: { id: { in: toGraduate } },
      data: { status: "GRADUATED", graduatedAt: when, graduationNote: note || null },
    });

    return NextResponse.json({ graduated: count, alreadyGraduated: teens.length - toGraduate.length });
  } catch (error) {
    return handleApiError(error);
  }
}
