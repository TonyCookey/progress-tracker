import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/auth";
import { issuePasswordResetToken, invalidatePasswordResetToken } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user || user.deletedAt) {
      throw new ApiError(404, "General not found");
    }

    const rawToken = await issuePasswordResetToken(user.id);
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password/${rawToken}`;
    try {
      await sendPasswordResetEmail(user.email, resetUrl);
    } catch (emailError) {
      await invalidatePasswordResetToken(rawToken);
      throw emailError;
    }

    return NextResponse.json({ message: "Password reset email sent" });
  } catch (error) {
    return handleApiError(error);
  }
}
