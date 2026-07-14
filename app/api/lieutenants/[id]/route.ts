import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, assertBaseAccess, handleApiError } from "@/lib/auth";
import { updateTeenSchema } from "@/lib/validation/teen";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const teen = await prisma.teen.findFirst({
      where: { id: params.id, ...notDeleted(includeArchived) },
      include: {
        base: true,
        platoon: true,
        // A soft-deleted squad must not appear as one of this teen's active squads.
        squadMemberships: {
          where: { group: notDeleted(includeArchived) },
          include: { group: true },
        },
      },
    });

    if (!teen) {
      return NextResponse.json({ error: "Lieutenant not found" }, { status: 404 });
    }

    // `platoon` is a to-one relation, so Prisma can't filter it out via `include`'s
    // `where` — null it out manually if that platoon was soft-deleted.
    const platoonDeleted = !includeArchived && !!teen.platoon?.deletedAt;

    return NextResponse.json({
      ...teen,
      platoon: platoonDeleted ? null : teen.platoon,
      squads: teen.squadMemberships.map((membership) => membership.group),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const data = parseOrThrow(updateTeenSchema, await req.json());

    const existingTeen = await prisma.teen.findUnique({ where: { id: params.id } });
    if (!existingTeen) {
      return NextResponse.json({ error: "Lieutenant not found" }, { status: 404 });
    }
    // Check both the teen's current base and the target base, so a leader can't
    // edit another base's teen, and can't move a teen into a base they don't own.
    assertBaseAccess(session, existingTeen.baseId);
    assertBaseAccess(session, data.baseId);

    const updatedTeen = await prisma.teen.update({
      where: { id: params.id },
      data: {
        name: data.name,
        gender: data.gender,
        rank: data.rank,
        dateOfBirth: data.dateOfBirth,
        baseId: data.baseId,
        groupId: data.platoonId || null,
        phone: data.phone,
        address: data.address,
        school: data.school,
        guardianName: data.guardianName,
        guardianPhone: data.guardianPhone,
        dateJoined: data.dateJoined,
        status: data.status,
        squadMemberships: {
          deleteMany: {}, // Clear previous
          create: (data.squadIds ?? []).map((groupId: string) => ({
            group: { connect: { id: groupId } },
          })),
        },
      },
    });

    return NextResponse.json(updatedTeen);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    await prisma.teen.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Lieutenant deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
