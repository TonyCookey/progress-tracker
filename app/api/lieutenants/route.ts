// app/api/teens/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createTeenSchema } from "@/lib/validation/teen";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";
import { assertGroupsInBase } from "@/lib/validateBaseRefs";

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const body = parseOrThrow(createTeenSchema, await req.json());
    assertBaseAccess(session, body.baseId);

    const { name, gender, dateOfBirth, baseId, rank, groupId, squadIds = [] } = body;

    await assertGroupsInBase(groupId ? [groupId] : [], baseId, "groupId");
    await assertGroupsInBase(squadIds, baseId, "squadIds");

    const teen = await prisma.teen.create({
      data: {
        name,
        gender,
        baseId,
        rank,
        dateOfBirth,
        groupId,
        phone: body.phone,
        address: body.address,
        school: body.school,
        guardianName: body.guardianName,
        guardianPhone: body.guardianPhone,
        dateJoined: body.dateJoined ?? new Date(),
        status: body.status,
        householdId: body.householdId,
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
    const pageParam = parseInt(searchParams.get("page") ?? "1");
    const limitParam = parseInt(searchParams.get("limit") ?? "10");
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 10;
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const baseId = searchParams.get("baseId") ?? "";
    const rank = searchParams.get("rank");
    const includeArchived = searchParams.get("includeArchived") === "true";

    const skip = (page - 1) * limit;

    const where = {
      rank: (rank === "LIEUTENANT" || rank === "CAPTAIN" ? rank : undefined) as "LIEUTENANT" | "CAPTAIN" | undefined,
      baseId: baseId ? baseId : undefined,
      name: {
        contains: search,
        mode: "insensitive" as const,
      },
      ...notDeleted(includeArchived),
    };

    const [data, total] = await Promise.all([
      prisma.teen.findMany({
        where,
        include: { base: true },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.teen.count({ where }),
    ]);

    return NextResponse.json({ data, total });
  } catch (error) {
    return handleApiError(error);
  }
}
