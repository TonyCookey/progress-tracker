import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { z } from "zod";
import { r2 } from "@/lib/r2";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";
import { requireSession, assertBaseAccess, handleApiError } from "@/lib/auth";
import { parseOrThrow } from "@/lib/validation/parse";

const uploadUrlSchema = z.object({
  lieutenantId: z.string().min(1, "lieutenantId is required"),
  fileType: z.enum(["image/jpeg", "image/png", "image/webp"], {
    errorMap: () => ({ message: "Unsupported file type" }),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { lieutenantId, fileType } = parseOrThrow(uploadUrlSchema, await req.json());

    const teen = await prisma.teen.findUnique({ where: { id: lieutenantId } });
    if (!teen) {
      return NextResponse.json({ error: "Teen not found" }, { status: 404 });
    }
    assertBaseAccess(session, teen.baseId);

    const key = `lieutenant/${lieutenantId}/${nanoid()}.jpg`;

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
