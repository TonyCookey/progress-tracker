import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";
import { requireSession, handleApiError, ApiError } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { userId, key } = await req.json();

    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      return NextResponse.json({ error: "General not found" }, { status: 404 });
    }

    if (session.user.role !== "SUPERADMIN" && session.user.id !== userId) {
      throw new ApiError(403, "Forbidden");
    }

    // delete old image if exists
    if (user.imageKey) {
      await r2.send(
        new DeleteObjectCommand({
          Bucket: process.env.R2_BUCKET!,
          Key: user.imageKey,
        }),
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: { imageKey: key },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
