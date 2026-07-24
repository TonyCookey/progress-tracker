import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, assertBaseAccess, handleApiError } from "@/lib/auth";
import { updateOfferingSchema } from "@/lib/validation/offering";
import { parseOrThrow } from "@/lib/validation/parse";
import { notDeleted } from "@/lib/softDelete";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const includeArchived = searchParams.get("includeArchived") === "true";

    const offering = await prisma.offering.findFirst({
      where: { id: params.id, ...notDeleted(includeArchived) },
      include: { base: true },
    });

    if (!offering) return NextResponse.json({ error: "Offering not found" }, { status: 404 });

    return NextResponse.json(offering);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);
    const body = parseOrThrow(updateOfferingSchema, await req.json());

    const existingOffering = await prisma.offering.findUnique({ where: { id: params.id } });
    if (!existingOffering) return NextResponse.json({ error: "Offering not found" }, { status: 404 });

    const isCrossBase = body.baseId === "cross-base" ? true : (body.isCrossBase ?? false);
    const baseId = isCrossBase ? null : body.baseId;

    assertBaseAccess(session, existingOffering.baseId);
    assertBaseAccess(session, isCrossBase ? null : baseId);

    const { service, amount, date, notes, type } = body;

    const updatedOffering = await prisma.offering.update({
      where: { id: params.id },
      data: { service, amount, date, notes, type, baseId, isCrossBase },
    });

    return NextResponse.json(updatedOffering);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);

    const offering = await prisma.offering.findUnique({ where: { id: params.id } });
    if (!offering) return NextResponse.json({ error: "Offering not found" }, { status: 404 });

    assertBaseAccess(session, offering.isCrossBase ? null : offering.baseId);

    await prisma.offering.update({
      where: { id: params.id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: "Offering deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
