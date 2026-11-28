import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";
import { undoGraduationSchema } from "@/lib/validation/graduation";

// POST { teenIds } -> puts graduated teens back on the roster as ACTIVE (for mistakes).
export async function POST(req: Request) {
  try {
    const session = await requireRole(["SUPERADMIN", "GENERAL"]);
    const { teenIds } = parseOrThrow(undoGraduationSchema, await req.json());

    const teens = await prisma.teen.findMany({ where: { id: { in: teenIds }, deletedAt: null, status: "GRADUATED" }, select: { id: true, baseId: true } });
    if (session.user.role !== "SUPERADMIN" && teens.some((t) => t.baseId !== session.user.baseId)) {
      throw new ApiError(403, "You can only change teens in your own base");
    }

    const { count } = await prisma.teen.updateMany({
      where: { id: { in: teens.map((t) => t.id) } },
      data: { status: "ACTIVE", graduatedAt: null, graduationNote: null },
    });
    return NextResponse.json({ restored: count });
  } catch (error) {
    return handleApiError(error);
  }
}
