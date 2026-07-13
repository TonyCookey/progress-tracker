// app/api/generals/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireSession();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = 10;
    const skip = (page - 1) * limit;

    const [generals, count] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        include: { base: true },
      }),
      prisma.user.count({}),
    ]);

    return NextResponse.json({
      generals,
      totalPages: Math.ceil(count / limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
