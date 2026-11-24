// app/api/generals/route.ts
import { NextResponse } from "next/server";
import { Prisma, UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/auth";
import { notDeleted } from "@/lib/softDelete";
import { safeUserSelect } from "@/lib/users";

// Reads the session (headers), so it must never be prerendered at build time.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    await requireSession();

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") ?? "10") || 10));
    const skip = (page - 1) * limit;
    const includeArchived = searchParams.get("includeArchived") === "true";
    const roleParam = searchParams.get("role");
    const role = roleParam && ["SUPERADMIN", "GENERAL", "COLONEL", "VOLUNTEER"].includes(roleParam) ? (roleParam as UserRole) : undefined;
    const baseId = searchParams.get("baseId") || undefined;
    const search = searchParams.get("search")?.trim();
    const where: Prisma.UserWhereInput = {
      ...notDeleted(includeArchived),
      role,
      baseId,
      ...(search
        ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] }
        : {}),
    };

    const [generals, count] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: safeUserSelect,
        orderBy: { name: "asc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      generals,
      total: count,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
