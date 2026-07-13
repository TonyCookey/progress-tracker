import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireSession, requireRole, assertBaseAccess, handleApiError } from "@/lib/auth";
import { updateGroupSchema } from "@/lib/validation/group";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const group = await prisma.group.findFirst({
      where: { id: params.id, ...notDeleted(includeArchived) },
      include: {
        teens: true,
        base: true,
        activities: true,
        leader: true,
        members: { include: { teen: true } },
        support: { include: { user: true } },
      },
    });

    if (!group) return NextResponse.json("Group not found", { status: 404 });

    return NextResponse.json(group);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const data = parseOrThrow(updateGroupSchema, await req.json());

    const existingGroup = await prisma.group.findUnique({ where: { id: params.id } });
    if (!existingGroup) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    assertBaseAccess(session, existingGroup.baseId);
    assertBaseAccess(session, data.baseId);

    const updatedGroup = await prisma.group.update({
      where: { id: params.id },
      data: {
        name: data.name,
        description: data.description ?? undefined,
        baseId: data.baseId,
        leaderId: data.leaderId,
        support: {
          deleteMany: {},
          create: (data.supportIds ?? []).map((userId: string) => ({
            user: { connect: { id: userId } },
          })),
        },
      },
    });

    return NextResponse.json(updatedGroup);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    const group = await prisma.group.findUnique({ where: { id: params.id } });
    if (!group) return NextResponse.json({ error: "Group not found" }, { status: 404 });

    const activeMemberCount =
      group.type === "PLATOON"
        ? await prisma.teen.count({ where: { groupId: params.id, deletedAt: null } })
        : await prisma.groupMember.count({ where: { groupId: params.id, teen: { deletedAt: null } } });

    if (activeMemberCount > 0) {
      return NextResponse.json({ error: "Reassign teens before deleting this group" }, { status: 409 });
    }

    await prisma.group.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Group deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
