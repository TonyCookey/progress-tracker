import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GroupType } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const type: GroupType = url.searchParams.get("type") as GroupType;

    const groups = await prisma.group.findMany({
      where: { type: type ?? "SQUAD" },
      include: { leader: true, base: true },
    });
    return NextResponse.json(groups);
  } catch (error) {
    console.error("[GROUPS_ERROR]", error);
    return NextResponse.json({ error: "Failed to fetch groups" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { name, description, baseId, type, leaderId } = await req.json();

    const squad = await prisma.group.create({
      data: {
        name,
        description,
        type,
        baseId,
        leaderId,
      },
    });

    return NextResponse.json(squad);
  } catch (error) {
    console.error("[CREATE_GROUP_ERROR]", error);
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}
