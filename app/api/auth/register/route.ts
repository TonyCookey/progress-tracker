import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { requireRole, handleApiError } from "@/lib/auth";
import { registerSchema } from "@/lib/validation/register";
import { parseOrThrow } from "@/lib/validation/parse";

export async function POST(req: Request) {
  try {
    await requireRole(["SUPERADMIN"]);

    const body = parseOrThrow(registerSchema, await req.json());
    const { name, username, email, password, dateOfBirth, role, baseName } = body;

    const base = await prisma.base.findFirst({
      where: { name: baseName },
    });

    if (!base) {
      return NextResponse.json({ message: "Base not found" }, { status: 400 });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json({ message: "Email or username already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        role,
        baseId: base.id,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
