// app/api/squads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const squads = await prisma.group.findMany({
      where: { type: "SQUAD" },
      include: { leader: true, base: true },
    });
    return NextResponse.json(squads);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch squads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, baseId, leaderId } = await req.json();

    const squad = await prisma.group.create({
      data: {
        name,
        type: "SQUAD",
        baseId,
        leaderId,
      },
    });

    return NextResponse.json(squad);
  } catch (error) {
    return NextResponse.json({ error: "Failed to create squad" }, { status: 500 });
  }
}
