import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";
import { forgotPasswordSchema } from "@/lib/validation/passwordReset";
import { issuePasswordResetToken } from "@/lib/passwordReset";
import { sendPasswordResetEmail } from "@/lib/email";

const GENERIC_MESSAGE = "If that email exists, a reset link has been sent.";

export async function POST(req: Request) {
  try {
    const { email } = parseOrThrow(forgotPasswordSchema, await req.json());

    const user = await prisma.user.findUnique({ where: { email } });
    if (user && !user.deletedAt) {
      const rawToken = await issuePasswordResetToken(user.id);
      const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password/${rawToken}`;
      // Swallow email failures — never leak whether the account exists via the response.
      await sendPasswordResetEmail(user.email, resetUrl).catch((e) => console.error("[forgot-password]", e));
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    return handleApiError(error);
  }
}
