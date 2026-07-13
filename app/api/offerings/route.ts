import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createOfferingSchema } from "@/lib/validation/offering";
import { parseOrThrow } from "@/lib/validation/parse";

export async function GET(req: Request) {
  try {
    await requireSession();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const baseId = searchParams.get("baseId") ?? "";

    const skip = (page - 1) * limit;

    const [offerings, total] = await Promise.all([
      prisma.offering.findMany({
        where: {
          service: {
            contains: search,
            mode: "insensitive",
          },
          baseId: baseId ? baseId : undefined,
        },
        include: { base: true },
        skip,
        take: limit,
        orderBy: { date: "desc" },
      }),
      prisma.offering.count({
        where: {
          service: {
            contains: search,
            mode: "insensitive",
          },
          baseId: baseId ? baseId : undefined,
        },
      }),
    ]);
    return NextResponse.json({ offerings, total });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = parseOrThrow(createOfferingSchema, await req.json());
    assertBaseAccess(session, body.baseId);

    const { service, amount, date, notes, type, baseId } = body;

    const offering = await prisma.offering.create({
      data: {
        service,
        amount,
        date,
        notes,
        type,
        baseId,
      },
    });

    return NextResponse.json(offering);
  } catch (error) {
    return handleApiError(error);
  }
}
