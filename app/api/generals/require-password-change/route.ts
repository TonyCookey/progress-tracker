import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/auth";

// Ask every active account (except the superadmin doing it) to choose a new password
// the next time they sign in. Their current password keeps working until then.
export async function POST() {
  try {
    const session = await requireRole(["SUPERADMIN"]);
    const { count } = await prisma.user.updateMany({
      where: { deletedAt: null, id: { not: session.user.id } },
      data: { mustChangePassword: true },
    });
    return NextResponse.json({ count });
  } catch (error) {
    return handleApiError(error);
  }
}
