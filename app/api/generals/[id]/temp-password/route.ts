import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError, ApiError } from "@/lib/auth";

// Unambiguous characters only (no 0/O, 1/l/I) - this gets read out or typed from a phone.
const ALPHABET = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";

function generateTempPassword() {
  const chunk = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  return `${chunk()}-${chunk()}-${chunk()}`;
}

// Sets a one-time temporary password and forces a change at next sign-in. The plain
// password is returned once, to the superadmin, and never stored.
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  try {
    await requireRole(["SUPERADMIN"]);

    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user || user.deletedAt) throw new ApiError(404, "General not found");

    const tempPassword = generateTempPassword();
    await prisma.user.update({
      where: { id: user.id },
      data: { password: await bcrypt.hash(tempPassword, 10), mustChangePassword: true },
    });

    return NextResponse.json({ tempPassword, email: user.email });
  } catch (error) {
    return handleApiError(error);
  }
}
