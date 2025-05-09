// app/api/teens/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();

  const { name, gender, dateOfBirth, baseId, rank, groupId, squadIds } = body;

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

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.teen.findMany({
      where: {
        rank: "LIEUTENANT",
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
        name: {
          contains: search,
          mode: "insensitive",
        },
      },
    }),
  ]);

  return NextResponse.json({ data, total });
}

export async function DELETE(req: Request) {
  const body = await req.json();
  const { id } = body;

  try {
    await prisma.teen.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("[DELETE_TEEN_ERROR]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
export async function PUT(req: Request) {
  const body = await req.json();
  const { id, name } = body;
  try {
    const updatedTeen = await prisma.teen.update({
      where: { id },
      data: { name },
    });

    return NextResponse.json(updatedTeen);
  } catch (err) {
    console.error("[UPDATE_TEEN_ERROR]", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
