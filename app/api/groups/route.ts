import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GroupType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type: GroupType = url.searchParams.get("type") as GroupType;

    const squads = await prisma.group.findMany({
      where: { type: type ?? "SQUAD" },
      include: { leader: true, base: true },
    });
    return NextResponse.json(squads);
  } catch (error) {
    console.error("[SQUADS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch squads" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, baseId, type, leaderId } = await req.json();

    console.log("[CREATE_SQUAD]", { name, baseId, type, leaderId });

    const squad = await prisma.group.create({
      data: {
        name,
        type,
        baseId,
        leaderId,
      },
    });

    return NextResponse.json(squad);
  } catch (error) {
    console.error("[CREATE_SQUAD_ERROR]", error);
    return NextResponse.json({ error: "Failed to create squad" }, { status: 500 });
  }
}
