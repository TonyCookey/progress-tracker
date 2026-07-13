// app/api/generals/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/auth";
import { notDeleted } from "@/lib/softDelete";

export async function GET(req: Request) {
  try {
    await requireSession();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const skip = (page - 1) * limit;
    const includeArchived = searchParams.get("includeArchived") === "true";
    const where = notDeleted(includeArchived);

    const [generals, count] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: { base: true },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      generals,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
