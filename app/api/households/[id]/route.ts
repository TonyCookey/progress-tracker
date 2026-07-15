import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { updateHouseholdSchema } from "@/lib/validation/household";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const household = await prisma.household.findFirst({
      where: { id: params.id, ...notDeleted(includeArchived) },
      include: {
        base: true,
        teens: { where: notDeleted(includeArchived) },
      },
    });

    if (!household) return NextResponse.json({ error: "Household not found" }, { status: 404 });

    return NextResponse.json(household);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const data = parseOrThrow(updateHouseholdSchema, await req.json());

    const existingHousehold = await prisma.household.findUnique({ where: { id: params.id } });
    if (!existingHousehold) return NextResponse.json({ error: "Household not found" }, { status: 404 });

    assertBaseAccess(session, existingHousehold.baseId);
    assertBaseAccess(session, data.baseId);

    const updatedHousehold = await prisma.household.update({
      where: { id: params.id },
      data: {
        name: data.name,
        address: data.address ?? undefined,
        primaryContactName: data.primaryContactName ?? undefined,
        primaryContactPhone: data.primaryContactPhone ?? undefined,
        baseId: data.baseId ?? null,
      },
    });

    return NextResponse.json(updatedHousehold);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();

    const household = await prisma.household.findUnique({ where: { id: params.id } });
    if (!household) return NextResponse.json({ error: "Household not found" }, { status: 404 });
    assertBaseAccess(session, household.baseId);

    const activeMemberCount = await prisma.teen.count({ where: { householdId: params.id, deletedAt: null } });
    if (activeMemberCount > 0) {
      return NextResponse.json({ error: "Reassign teens before deleting this household" }, { status: 409 });
    }

    await prisma.household.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Household deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
