import { createHash } from "crypto";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

// Admin-generated links are shared by hand (WhatsApp/SMS), so they live longer than
// the 1-hour emailed ones.
export const SHARED_LINK_TTL_MS = 72 * 60 * 60 * 1000;

export async function issuePasswordResetToken(userId: string, ttlMs = RESET_TOKEN_TTL_MS) {
  const rawToken = nanoid(32);
  await prisma.$transaction([
    // Invalidate any outstanding tokens for this user so only the newest one is usable.
    prisma.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.create({
      data: {
        userId,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + ttlMs),
      },
    }),
  ]);
  return rawToken;
}

// Invalidates a token this call site just issued, e.g. because the follow-up
// email send failed — prevents a live, valid token being stranded silently.
export async function invalidatePasswordResetToken(rawToken: string) {
  await prisma.passwordResetToken.updateMany({
    where: { tokenHash: hashToken(rawToken), usedAt: null },
    data: { usedAt: new Date() },
  });
}

export type ResetTokenState = "valid" | "used" | "expired" | "invalid";

// Read-only check so the reset page can tell the person up front (before they type a
// new password) whether the link still works, and which email it's for.
export async function inspectPasswordResetToken(rawToken: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(rawToken) },
    include: { user: { select: { email: true, name: true, deletedAt: true } } },
  });
  let state: ResetTokenState = "valid";
  if (!record || record.user.deletedAt) state = "invalid";
  else if (record.usedAt) state = "used";
  else if (record.expiresAt < new Date()) state = "expired";
  return { state, email: state === "valid" ? record!.user.email : null, name: state === "valid" ? record!.user.name : null };
}

export async function consumePasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  return record;
}
