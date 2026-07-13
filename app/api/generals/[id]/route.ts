import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, requireRole, handleApiError } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireSession();

    const general = await prisma.user.findUnique({
      where: { id: params.id },
      include: { base: true, leadingGroups: true, supportingGroups: true },
    });

    if (!general) {
      return NextResponse.json({ error: "General not found" }, { status: 404 });
    }

    return NextResponse.json(general);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
