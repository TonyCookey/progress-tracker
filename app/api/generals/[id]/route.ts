import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const general = await prisma.user.findUnique({
    where: { id: params.id },
    include: { base: true, leadingGroups: true, supportingGroups: true },
  });

  if (!general) {
    return NextResponse.json({ error: "General not found" }, { status: 404 });
  }

  return NextResponse.json(general);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.user.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: "Deleted" });
  } catch (err) {
    console.error("[DELETE_GENERAL_ERROR]", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
