import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/auth";
import { onRosterWhere } from "@/lib/teens";

export const dynamic = "force-dynamic";

// GET ?baseId= -> everyone still on the roster, oldest first, for the graduation picker.
export async function GET(req: Request) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);
    const requested = (new URL(req.url).searchParams.get("baseId") ?? "").trim();
    const baseId = session.user.role === "SUPERADMIN" ? requested || undefined : session.user.baseId;

    const teens = await prisma.teen.findMany({
      where: { ...onRosterWhere, baseId },
      select: { id: true, name: true, dateOfBirth: true, base: { select: { name: true } }, platoon: { select: { name: true } } },
      orderBy: [{ dateOfBirth: { sort: "asc", nulls: "last" } }, { name: "asc" }],
      take: 1000,
    });
    return NextResponse.json({ data: teens });
  } catch (error) {
    return handleApiError(error);
  }
}
