import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { oldPassword, newPassword } = await req.json();
    if (!oldPassword || !newPassword) {
      return NextResponse.json({ message: "Missing fields" }, { status: 400 });
    }
    const user = await prisma.user.findUnique({ where: { id: params.id } });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: "Current password is incorrect" }, { status: 400 });
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: params.id }, data: { password: hashed } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[CHANGE_PASSWORD_ERROR]", err);
    return NextResponse.json({ message: "Failed to update password" }, { status: 500 });
  }
}
