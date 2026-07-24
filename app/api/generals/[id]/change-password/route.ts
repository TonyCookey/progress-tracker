import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import { requireSession, ApiError, handleApiError } from "@/lib/auth";
import { changePasswordSchema } from "@/lib/validation/passwordReset";
import { parseOrThrow } from "@/lib/validation/parse";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireSession();
    if (session.user.id !== params.id) {
      throw new ApiError(403, "Forbidden");
    }

    const { oldPassword, newPassword } = parseOrThrow(changePasswordSchema, await req.json());

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user || user.deletedAt) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: params.id }, data: { password: hashed } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
