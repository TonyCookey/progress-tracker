import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";
import { resetPasswordSchema } from "@/lib/validation/passwordReset";
import { consumePasswordResetToken } from "@/lib/passwordReset";

export async function POST(req: Request) {
  try {
    const { token, password } = parseOrThrow(resetPasswordSchema, await req.json());

    const record = await consumePasswordResetToken(token);
    if (!record) {
      throw new ApiError(400, "This reset link is invalid or has expired");
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
