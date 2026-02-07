import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2 } from "@/lib/r2";

export async function POST(req: NextRequest) {
  const { lieutenantId, key } = await req.json();

  const teen = await prisma.teen.findUnique({
    where: { id: lieutenantId },
  });

  if (!teen) {
    return NextResponse.json({ error: "Lieutenant not found" }, { status: 404 });
  }

  // delete old image if exists
  if (teen.imageKey) {
    await r2.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET!,
        Key: teen.imageKey,
      }),
    );
  }

  await prisma.teen.update({
    where: { id: lieutenantId },
    data: { imageKey: key },
  });

  return NextResponse.json({ success: true });
}
