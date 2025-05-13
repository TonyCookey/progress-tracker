import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const teen = await prisma.teen.findUnique({
      where: { id: params.id },
      include: {
        base: true,
        platoon: true,
        squadMemberships: {
          include: { group: true },
        },
      },
    });

    if (!teen) {
      return NextResponse.json({ error: "Teen not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...teen,
      squads: teen.squadMemberships.map((membership) => membership.group),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const data = await req.json();

    const updatedTeen = await prisma.teen.update({
      where: { id: params.id },
      data: {
        name: data.name,
        gender: data.gender,
        rank: data.rank,
        dateOfBirth: new Date(data.dateOfBirth),
        baseId: data.baseId,
        groupId: data.platoonId || null,
        squadMemberships: {
          deleteMany: {}, // Clear previous
          create: data.squadIds.map((groupId: string) => ({
            group: { connect: { id: groupId } },
          })),
        },
      },
    });

    return NextResponse.json(updatedTeen);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update teen" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.teen.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Teen deleted" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete teen" }, { status: 500 });
  }
}
