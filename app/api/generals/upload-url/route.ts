import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { r2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { requireSession, handleApiError, ApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";

const uploadUrlSchema = z.object({
  userId: z.string().min(1, "userId is required"),
  fileType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    errorMap: () => ({ message: "Unsupported file type" }),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { userId, fileType } = parseOrThrow(uploadUrlSchema, await req.json());

    const user = await prisma.user.findFirst({ where: { id: userId, deletedAt: null } });
    if (!user) {
      return NextResponse.json({ error: "General not found" }, { status: 404 });
    }

    // Self-or-SUPERADMIN, not assertBaseAccess — a General's photo is theirs to
    // control; a same-base colleague must not be able to change it.
    if (session.user.role !== "SUPERADMIN" && session.user.id !== userId) {
      throw new ApiError(403, "Forbidden");
    }

    const key = `general/${userId}/${nanoid()}.jpg`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET!,
      Key: key,
      ContentType: fileType,
    });

    const url = await getSignedUrl(r2, command, { expiresIn: 60 });

    return NextResponse.json({ url, key });
  } catch (error) {
    return handleApiError(error);
  }
}
