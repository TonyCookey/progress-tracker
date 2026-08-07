import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { GroupType } from "@prisma/client";
import { getGroups } from "@/lib/groups";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { createGroupSchema } from "@/lib/validation/group";
import { parseOrThrow } from "@/lib/validation/parse";
import { assertUsersInBase } from "@/lib/validateBaseRefs";

export async function GET(req: Request) {
  try {
    await requireSession();

    const url = new URL(req.url);
    const type: GroupType = url.searchParams.get("type") as GroupType;
    const includeArchived = url.searchParams.get("includeArchived") === "true";

    const groups = await getGroups(type, includeArchived);
    return NextResponse.json(groups);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const { name, description, baseId, type, leaderId, supportIds } = parseOrThrow(createGroupSchema, await req.json());
    assertBaseAccess(session, baseId);

    await assertUsersInBase([leaderId], baseId, "leaderId");
    await assertUsersInBase(supportIds ?? [], baseId, "supportIds");

    const group = await prisma.group.create({
      data: {
        name,
        description: description ?? undefined,
        type,
        baseId,
        leaderId,
        support: {
          create: (supportIds ?? []).map((userId: string) => ({
            user: { connect: { id: userId } },
          })),
        },
      },
    });

    return NextResponse.json(group);
  } catch (error) {
    return handleApiError(error);
  }
}
