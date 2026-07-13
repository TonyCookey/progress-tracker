import { NextResponse } from "next/server";
import { GroupType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getGroups } from "@/lib/groups";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createGroupSchema } from "@/lib/validation/group";
import { parseOrThrow } from "@/lib/validation/parse";

export async function GET(req: Request) {
  try {
    await requireSession();

    const url = new URL(req.url);
    const type: GroupType = url.searchParams.get("type") as GroupType;

    const squads = await getGroups(type);
    return NextResponse.json(squads);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const { name, baseId, type, leaderId } = parseOrThrow(createGroupSchema, await req.json());
    assertBaseAccess(session, baseId);

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
    return handleApiError(error);
  }
}
