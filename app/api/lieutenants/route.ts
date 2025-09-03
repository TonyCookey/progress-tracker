// app/api/teens/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const { name, gender, dateOfBirth, baseId, rank, groupId } = body;
  const squadIds = Array.isArray(body.squadIds) ? body.squadIds : [];

  const teen = await prisma.teen.create({
    data: {
      name,
      gender,
      baseId,
      rank,
      dateOfBirth: new Date(dateOfBirth),
      groupId,
      squadMemberships: {
        create: squadIds.map((id: string) => ({
          group: { connect: { id } },
        })),
      },
    },
  });

  return NextResponse.json(teen);
}

export async function GET(req: Request) {
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
}
