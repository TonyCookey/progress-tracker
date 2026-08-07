import { createHash } from "crypto";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashToken(rawToken: string) {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function issuePasswordResetToken(userId: string) {
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
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
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

export async function consumePasswordResetToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  return record;
}
