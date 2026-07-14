import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, assertBaseAccess, handleApiError } from "@/lib/auth";
import { updateGeneralSchema } from "@/lib/validation/general";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const general = await prisma.user.findFirst({
      where: { id: params.id, ...notDeleted(includeArchived) },
      include: {
        base: true,
        leadingGroups: { where: notDeleted(includeArchived) },
        // supportingGroups is the GroupSupport join table, not Group itself —
        // must include the nested `group` to get name/id, not just the join row.
        supportingGroups: { where: { group: notDeleted(includeArchived) }, include: { group: true } },
      },
    });

    if (!general) {
      return NextResponse.json({ error: "General not found" }, { status: 404 });
    }

    return NextResponse.json(general);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    const data = parseOrThrow(updateGeneralSchema, await req.json());

    const existingGeneral = await prisma.user.findUnique({ where: { id: params.id } });
    if (!existingGeneral) {
      return NextResponse.json({ error: "General not found" }, { status: 404 });
    }
    // Only SUPERADMIN or the general themselves may edit. A non-SUPERADMIN editing
    // their own record cannot change role or baseId (privilege escalation guard) -
    // those fields are silently pinned to their existing values.
    const isSuperAdmin = session.user.role === "SUPERADMIN";
    if (!isSuperAdmin && session.user.id !== params.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (isSuperAdmin) {
      assertBaseAccess(session, existingGeneral.baseId);
      assertBaseAccess(session, data.baseId);
    }

    const updatedGeneral = await prisma.user.update({
      where: { id: params.id },
      data: {
        name: data.name,
        username: data.username,
        email: data.email,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
        role: isSuperAdmin ? data.role : existingGeneral.role,
        baseId: isSuperAdmin ? data.baseId : existingGeneral.baseId,
      },
    });

    return NextResponse.json(updatedGeneral);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    await prisma.user.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
