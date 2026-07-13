// app/api/teens/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createTeenSchema } from "@/lib/validation/teen";
import { parseOrThrow } from "@/lib/validation/parse";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = parseOrThrow(createTeenSchema, await req.json());
    assertBaseAccess(session, body.baseId);

    const { name, gender, dateOfBirth, baseId, rank, groupId, squadIds = [] } = body;

    const teen = await prisma.teen.create({
      data: {
        name,
        gender,
        baseId,
        rank,
        dateOfBirth,
        groupId,
        squadMemberships: {
          create: squadIds.map((id: string) => ({
            group: { connect: { id } },
          })),
        },
      },
    });

    return NextResponse.json(teen);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: Request) {
  try {
    await requireSession();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "10");
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const baseId = searchParams.get("baseId") ?? "";

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      prisma.teen.findMany({
        where: {
          rank: "LIEUTENANT",
          baseId: baseId ? baseId : undefined,
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        include: { base: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.teen.count({
        where: {
          rank: "LIEUTENANT",
          baseId: baseId ? baseId : undefined,
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
      }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    return handleApiError(error);
  }
}
