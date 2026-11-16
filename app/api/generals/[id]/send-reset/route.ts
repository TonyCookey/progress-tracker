import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/auth";
import { issuePasswordResetToken, invalidatePasswordResetToken, SHARED_LINK_TTL_MS } from "@/lib/passwordReset";
import { sendPasswordResetEmail, isEmailConfigured, appBaseUrl } from "@/lib/email";

// POST                -> email the reset link (needs RESEND_API_KEY)
// POST ?mode=link     -> return the link so the admin can share it by hand (valid 72h);
//                        works with no email provider configured.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);
    const mode = new URL(req.url).searchParams.get("mode") === "link" ? "link" : "email";

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user || user.deletedAt) {
      throw new ApiError(404, "General not found");
    }

    if (mode === "email" && !isEmailConfigured()) {
      throw new ApiError(503, "Email isn't set up yet. Use \"Copy reset link\" and send it on WhatsApp instead.");
    }

    const rawToken = await issuePasswordResetToken(user.id, mode === "link" ? SHARED_LINK_TTL_MS : undefined);
    const resetUrl = `${appBaseUrl(req)}/auth/reset-password/${rawToken}`;

    if (mode === "link") {
      return NextResponse.json({ resetUrl, expiresInHours: SHARED_LINK_TTL_MS / 3_600_000 });
    }

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
