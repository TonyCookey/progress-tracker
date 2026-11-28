import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { ApiError, handleApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";
import { resetPasswordSchema } from "@/lib/validation/passwordReset";
import { consumePasswordResetToken, inspectPasswordResetToken } from "@/lib/passwordReset";

export async function POST(req: Request) {
  try {
    const { token, password } = parseOrThrow(resetPasswordSchema, await req.json());

    const record = await consumePasswordResetToken(token);
    if (!record) {
      throw new ApiError(400, "This reset link is invalid or has expired");
    }

    const hashed = await bcrypt.hash(password, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { password: hashed, mustChangePassword: false } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    const user = await prisma.user.findUnique({ where: { id: record.userId }, select: { email: true } });
    return NextResponse.json({ success: true, email: user?.email ?? null });
  } catch (error) {
    return handleApiError(error);
  }
}

// GET ?token=... -> { state, email } so the page can explain a dead link before the
// person types anything, and show which email to sign in with afterwards.
export async function GET(req: Request) {
  try {
    const token = new URL(req.url).searchParams.get("token") ?? "";
    if (!token) throw new ApiError(400, "Token is required");
    return NextResponse.json(await inspectPasswordResetToken(token), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return handleApiError(error);
  }
}
